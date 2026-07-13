import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type EventGuest, type EventRsvp, type Json } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDate, formatTime12, isRsvpClosed } from "../../lib/utils";

interface RsvpFormState {
  status: "accept" | "decline" | "";
  plus_ones: number;
  dietary: string;
  message: string;
}

export default function RustyRsvp() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestId, guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  const deadlineClosed = isRsvpClosed(event.rsvp_deadline);

  const { data: guest } = useQuery({
    queryKey: ["event_guests", guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("id", guestId!)
        .maybeSingle();
      if (error) throw error;
      return data as EventGuest | null;
    },
    enabled: !!guestId,
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub_events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
  });

  const { data: invitedEventIds } = useQuery({
    queryKey: ["invited_events", event.id, guestId],
    queryFn: async () => {
      if (!guest) return new Set<string>();
      const allEvents = subEvents ?? [];
      const { data: memberships } = await supabase.from("guest_group_members").select("group_id").eq("guest_id", guest.id);
      const groupIds = (memberships ?? []).map((m) => m.group_id);
      let assignedSubEventIds = new Set<string>();
      if (groupIds.length > 0) {
        const { data: assignments } = await supabase.from("sub_event_group_assignments").select("sub_event_id").in("group_id", groupIds);
        assignedSubEventIds = new Set((assignments ?? []).map((a) => a.sub_event_id));
      }
      const { data: overrides } = await supabase.from("guest_invitation_overrides").select("sub_event_id, is_invited").eq("guest_id", guest.id);
      const overrideMap = new Map<string, boolean>();
      (overrides ?? []).forEach((o) => overrideMap.set(o.sub_event_id, o.is_invited));
      const invited = new Set<string>();
      for (const ev of allEvents) {
        if (overrideMap.has(ev.id)) { if (overrideMap.get(ev.id)) invited.add(ev.id); }
        else if (assignedSubEventIds.has(ev.id)) invited.add(ev.id);
        else if (groupIds.length === 0 && allEvents.length > 0) invited.add(ev.id);
      }
      return invited;
    },
    enabled: !!guest && !!subEvents,
  });

  const { data: existingRsvps } = useQuery({
    queryKey: ["event_rsvps", event.id, guestId],
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

  const eventsList = (subEvents ?? []).filter((ev) => (invitedEventIds ?? new Set<string>()).has(ev.id));
  const [forms, setForms] = useState<Record<string, RsvpFormState>>({});
  const [submitted, setSubmitted] = useState(false);

  function getForm(evId: string): RsvpFormState {
    if (forms[evId]) return forms[evId];
    const existing = (existingRsvps ?? []).find((r) => r.sub_event_id === evId);
    return {
      status: (existing?.status as RsvpFormState["status"]) || "",
      plus_ones: existing?.plus_ones ?? 0,
      dietary: existing?.dietary ?? "",
      message: existing?.message ?? "",
    };
  }

  function updateForm(evId: string, patch: Partial<RsvpFormState>) {
    setForms((prev) => ({ ...prev, [evId]: { ...getForm(evId), ...patch } }));
  }

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!guestId || !guestName) throw new Error("Not signed in");
      const rows = eventsList
        .filter((ev) => getForm(ev.id).status !== "")
        .map((ev) => {
          const f = getForm(ev.id);
          return {
            event_id: event.id,
            guest_id: guestId,
            guest_name: guestName,
            sub_event_id: ev.id,
            status: f.status,
            plus_ones: f.plus_ones,
            dietary: f.dietary,
            message: f.message,
            answers: {} as Json,
          };
        });
      if (rows.length === 0) throw new Error("Please respond to at least one event");
      const { error } = await supabase.from("event_rsvps").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_rsvps", event.id, guestId] });
      setSubmitted(true);
    },
  });

  if (deadlineClosed) {
    return (
      <div className="mx-auto max-w-md">
        <div className="event-card text-center">
          <h2 className="text-xl font-semibold">RSVP Closed</h2>
          <p className="mt-2 text-sm opacity-70">
            The RSVP deadline has passed. Please contact the host if you need to update your response.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md">
        <div className="event-card text-center">
          <h2 className="text-xl font-semibold">Thank you!</h2>
          <p className="mt-2 text-sm opacity-70">Your RSVP has been submitted successfully.</p>
          <button onClick={() => setSubmitted(false)} className="event-btn-secondary mt-4">Edit response</button>
        </div>
      </div>
    );
  }

  if (eventsList.length === 0) {
    return (
      <div className="mx-auto max-w-md">
        <div className="event-card text-center">
          <h2 className="text-xl font-semibold">RSVP</h2>
          <p className="mt-2 text-sm opacity-70">There are no events requiring your RSVP at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">RSVP</h1>
        <p className="mt-1 opacity-70">Please respond to each event below.</p>
      </div>

      {eventsList.map((ev) => {
        const f = getForm(ev.id);
        const evClosed = isRsvpClosed(ev.rsvp_deadline);
        return (
          <div key={ev.id} className="event-card space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{ev.name}</h3>
              {ev.date && <p className="text-sm">{formatDate(ev.date)}</p>}
              {ev.time && <p className="text-sm opacity-70">{formatTime12(ev.time)}</p>}
              {ev.venue && <p className="text-sm font-medium">{ev.venue}</p>}
            </div>
            {evClosed ? (
              <p className="text-sm opacity-70">RSVP for this event is closed.</p>
            ) : (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateForm(ev.id, { status: "accept" })}
                    className={f.status === "accept" ? "event-btn-primary flex-1" : "event-btn-secondary flex-1"}
                  >
                    Joyfully Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => updateForm(ev.id, { status: "decline" })}
                    className={f.status === "decline" ? "event-btn-primary flex-1" : "event-btn-secondary flex-1"}
                  >
                    Regretfully Decline
                  </button>
                </div>
                {f.status === "accept" && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Number of guests (including you)</label>
                    <select
                      className="event-input"
                      value={f.plus_ones}
                      onChange={(e) => updateForm(ev.id, { plus_ones: parseInt(e.target.value, 10) })}
                    >
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n + 1}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Dietary requirements</label>
                  <textarea
                    className="event-input min-h-[60px]"
                    placeholder="Any allergies or dietary needs?"
                    value={f.dietary}
                    onChange={(e) => updateForm(ev.id, { dietary: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Message</label>
                  <textarea
                    className="event-input min-h-[60px]"
                    placeholder="Leave a message…"
                    value={f.message}
                    onChange={(e) => updateForm(ev.id, { message: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
        );
      })}

      {submitMutation.isError && (
        <p className="text-center text-sm text-red-500">
          {submitMutation.error instanceof Error ? submitMutation.error.message : "Failed to submit"}
        </p>
      )}
      <button
        onClick={() => submitMutation.mutate()}
        disabled={submitMutation.isPending}
        className="event-btn-primary w-full disabled:opacity-50"
      >
        {submitMutation.isPending ? "Submitting…" : "Submit RSVP"}
      </button>
    </div>
  );
}
