import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type EventGuest, type EventRsvp } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { isRsvpClosed, formatDate } from "../../lib/utils";

interface RsvpFormState {
  status: "attending" | "declined" | "";
  plus_ones: number;
  dietary: string;
  message: string;
}

const EMPTY_FORM: RsvpFormState = {
  status: "",
  plus_ones: 0,
  dietary: "",
  message: "",
};

export default function Rsvp() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestId } = useGuestAuth();
  const queryClient = useQueryClient();

  const closed = isRsvpClosed(event.rsvp_deadline);

  // Fetch sub-events the guest is invited to
  const { data: subEvents, isLoading } = useQuery({
    queryKey: ["guest-rsvp-sub-events", event.id, guestId],
    queryFn: async () => {
      const { data: allSubEvents, error: seError } = await supabase
        .from("sub_events").select("*").eq("parent_event_id", event.id).order("display_order", { ascending: true });
      if (seError) throw seError;
      const subs = (allSubEvents ?? []) as SubEvent[];
      if (subs.length === 0) return [] as SubEvent[];

      const { data: guest } = await supabase.from("event_guests").select("*").eq("id", guestId!).maybeSingle();
      const g = guest as EventGuest | null;
      if (!g) return [] as SubEvent[];

      const { data: assignments } = await supabase
        .from("sub_event_group_assignments").select("sub_event_id, group_id").in("sub_event_id", subs.map((s) => s.id));
      const assignmentMap = new Map<string, Set<string>>();
      for (const a of assignments ?? []) {
        if (!assignmentMap.has(a.sub_event_id)) assignmentMap.set(a.sub_event_id, new Set());
        assignmentMap.get(a.sub_event_id)!.add(a.group_id);
      }

      const { data: overrides } = await supabase
        .from("guest_invitation_overrides").select("sub_event_id, is_invited").eq("guest_id", g.id);
      const overrideMap = new Map<string, boolean>();
      for (const o of overrides ?? []) overrideMap.set(o.sub_event_id, o.is_invited);

      return subs.filter((se) => {
        if (overrideMap.has(se.id)) return overrideMap.get(se.id);
        return g.group_id ? (assignmentMap.get(se.id)?.has(g.group_id) ?? false) : false;
      });
    },
    enabled: !!guestId,
  });

  // Fetch existing RSVPs
  const { data: existingRsvps } = useQuery({
    queryKey: ["guest-rsvps", event.id, guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("guest_id", guestId!);
      if (error) throw error;
      return (data ?? []) as EventRsvp[];
    },
    enabled: !!guestId,
  });

  // Form state per sub-event
  const [forms, setForms] = useState<Record<string, RsvpFormState>>({});

  useEffect(() => {
    if (existingRsvps && subEvents) {
      const next: Record<string, RsvpFormState> = {};
      for (const se of subEvents) {
        const existing = existingRsvps.find((r) => r.sub_event_id === se.id);
        next[se.id] = existing
          ? {
              status: existing.status as RsvpFormState["status"],
              plus_ones: existing.plus_ones,
              dietary: existing.dietary ?? "",
              message: existing.message ?? "",
            }
          : { ...EMPTY_FORM };
      }
      setForms(next);
    }
  }, [existingRsvps, subEvents]);

  const { guestName } = useGuestAuth();

  const upsertMutation = useMutation({
    mutationFn: async (subEventId: string) => {
      const form = forms[subEventId];
      if (!form || !form.status) throw new Error("Please select Accept or Decline");
      const existing = existingRsvps?.find((r) => r.sub_event_id === subEventId);

      const payload = {
        event_id: event.id,
        guest_id: guestId!,
        guest_name: guestName ?? "Guest",
        status: form.status,
        plus_ones: form.plus_ones,
        dietary: form.dietary || null,
        message: form.message || null,
        sub_event_id: subEventId,
        submitted_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from("event_rsvps")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", event.id, guestId] });
    },
  });

  if (closed) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-lg event-card text-center">
          <h2 className="text-2xl font-bold" style={{ color: "var(--event-heading)" }}>
            RSVP Closed
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--event-muted)" }}>
            The RSVP deadline ({formatDate(event.rsvp_deadline)}) has passed.
            Please contact the host if you need to make changes.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-gray-400">Loading…</div>
      </div>
    );
  }

  if (!subEvents || subEvents.length === 0) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-lg event-card text-center">
          <h2 className="text-2xl font-bold" style={{ color: "var(--event-heading)" }}>
            RSVP
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--event-muted)" }}>
            You have not been invited to any specific events yet.
            Please check back later or contact the host.
          </p>
        </div>
      </div>
    );
  }

  const updateForm = (subEventId: string, patch: Partial<RsvpFormState>) => {
    setForms((prev) => ({ ...prev, [subEventId]: { ...prev[subEventId], ...patch } }));
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-lg">
        <h2 className="text-center text-3xl font-bold" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>
          RSVP
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: "var(--event-muted)" }}>
          Let us know if you'll be joining us.
        </p>

        <div className="mt-6 space-y-6">
          {subEvents.map((se) => {
            const form = forms[se.id] ?? { ...EMPTY_FORM };
            const mutationKey = `rsvp-${se.id}`;
            return (
              <div key={se.id} className="event-card">
                <h3 className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
                  {se.name}
                </h3>
                {se.date && (
                  <p className="text-sm" style={{ color: "var(--event-muted)" }}>
                    {formatDate(se.date)}
                  </p>
                )}

                {/* Status */}
                <div className="mt-4 flex gap-3">
                  <label className="flex items-center gap-2 text-sm" style={{ color: "var(--event-text)" }}>
                    <input
                      type="radio"
                      name={`status-${se.id}`}
                      checked={form.status === "attending"}
                      onChange={() => updateForm(se.id, { status: "attending" })}
                    />
                    Joyfully accepts
                  </label>
                  <label className="flex items-center gap-2 text-sm" style={{ color: "var(--event-text)" }}>
                    <input
                      type="radio"
                      name={`status-${se.id}`}
                      checked={form.status === "declined"}
                      onChange={() => updateForm(se.id, { status: "declined" })}
                    />
                    Regretfully declines
                  </label>
                </div>

                {form.status === "attending" && (
                  <>
                    <div className="mt-4">
                      <label className="block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                        Number of guests (including you)
                      </label>
                      <select
                        value={form.plus_ones + 1}
                        onChange={(e) => updateForm(se.id, { plus_ones: parseInt(e.target.value) - 1 })}
                        className="event-input mt-1"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                        Dietary requirements
                      </label>
                      <textarea
                        placeholder="Any allergies or dietary needs?"
                        value={form.dietary}
                        onChange={(e) => updateForm(se.id, { dietary: e.target.value })}
                        className="event-input mt-1"
                        rows={2}
                      />
                    </div>
                  </>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                    Message
                  </label>
                  <textarea
                    placeholder="Leave a message"
                    value={form.message}
                    onChange={(e) => updateForm(se.id, { message: e.target.value })}
                    className="event-input mt-1"
                    rows={3}
                  />
                </div>

                {upsertMutation.isError && upsertMutation.variables === se.id && (
                  <p className="mt-2 text-sm text-red-600">
                    {upsertMutation.error instanceof Error ? upsertMutation.error.message : "Failed to submit"}
                  </p>
                )}
                {upsertMutation.isSuccess && upsertMutation.variables === se.id && (
                  <p className="mt-2 text-sm text-green-600">RSVP submitted!</p>
                )}

                <button
                  onClick={() => upsertMutation.mutate(se.id)}
                  disabled={upsertMutation.isPending || !form.status}
                  className="event-btn-primary mt-4 w-full disabled:opacity-50"
                >
                  {upsertMutation.isPending && upsertMutation.variables === se.id ? "Submitting…" : "Submit RSVP"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
