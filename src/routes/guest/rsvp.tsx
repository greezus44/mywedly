import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase, type SubEvent, type EventGuest,
  type SubEventGroupAssignment, type GuestInvitationOverride, type EventRsvp,
} from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDate, isRsvpClosed } from "../../lib/utils";

interface RsvpFormState {
  status: "attending" | "not_attending" | "pending";
  plus_ones: number;
  dietary: string;
  message: string;
}
const EMPTY_FORM: RsvpFormState = { status: "pending", plus_ones: 0, dietary: "", message: "" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-event-text">{label}</label>
      {children}
    </div>
  );
}

export default function Rsvp() {
  const { event } = useGuestOutletContext();
  const { guestId, guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  const { data: subEvents, isLoading: seLoading } = useQuery({
    queryKey: ["guest_sub_events", event.id],
    enabled: !!event.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_events").select("*")
        .eq("parent_event_id", event.id).order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const { data: guest } = useQuery({
    queryKey: ["guest_record", guestId],
    enabled: !!guestId,
    queryFn: async () => {
      const { data, error } = await supabase.from("event_guests").select("*")
        .eq("id", guestId!).maybeSingle();
      if (error) throw error;
      return data as EventGuest | null;
    },
  });

  const { data: existingRsvps } = useQuery({
    queryKey: ["guest_rsvps", guestId, event.id],
    enabled: !!guestId,
    queryFn: async () => {
      const { data, error } = await supabase.from("event_rsvps").select("*")
        .eq("guest_id", guestId!).eq("event_id", event.id);
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const invitedSubEvents = useMemo(
    () => (subEvents ?? []).filter((se) => se.rsvp_enabled), [subEvents]
  );
  const subEventIds = invitedSubEvents.map((s) => s.id);

  const { data: assignments } = useQuery({
    queryKey: ["guest_assignments_all", subEventIds],
    enabled: subEventIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_event_group_assignments")
        .select("*").in("sub_event_id", subEventIds);
      if (error) throw error;
      return data as SubEventGroupAssignment[];
    },
  });

  const { data: overrides } = useQuery({
    queryKey: ["guest_overrides_all", subEventIds, guestId],
    enabled: subEventIds.length > 0 && !!guestId,
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_invitation_overrides")
        .select("*").in("sub_event_id", subEventIds).eq("guest_id", guestId!);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
  });

  const actuallyInvited = useMemo(() => {
    const assignedGroupIds = new Set(assignments?.map((a) => a.group_id) ?? []);
    const overrideMap: Record<string, boolean> = {};
    overrides?.forEach((o) => { overrideMap[o.sub_event_id] = o.is_invited; });
    return invitedSubEvents.filter((se) => {
      if (se.id in overrideMap) return overrideMap[se.id];
      if (guest?.group_id && assignedGroupIds.has(guest.group_id)) return true;
      return false;
    });
  }, [invitedSubEvents, assignments, overrides, guest]);

  const [forms, setForms] = useState<Record<string, RsvpFormState>>({});

  useEffect(() => {
    if (!existingRsvps || !actuallyInvited.length) return;
    const next: Record<string, RsvpFormState> = {};
    for (const se of actuallyInvited) {
      const ex = existingRsvps.find((r) => r.sub_event_id === se.id);
      next[se.id] = ex
        ? { status: ex.status as RsvpFormState["status"], plus_ones: ex.plus_ones ?? 0,
            dietary: ex.dietary ?? "", message: ex.message ?? "" }
        : { ...EMPTY_FORM };
    }
    setForms(next);
  }, [existingRsvps, actuallyInvited]);

  const rsvpMutation = useMutation({
    mutationFn: async (subEventId: string) => {
      const form = forms[subEventId];
      if (!form) throw new Error("No form data");
      const payload = {
        event_id: event.id, guest_id: guestId!, guest_name: guestName ?? "",
        status: form.status, plus_ones: form.plus_ones,
        dietary: form.dietary || null, message: form.message || null,
        sub_event_id: subEventId, submitted_at: new Date().toISOString(),
      };
      const ex = existingRsvps?.find((r) => r.sub_event_id === subEventId);
      if (ex) {
        const { error } = await supabase.from("event_rsvps").update(payload).eq("id", ex.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert({ ...payload, answers: {} });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest_rsvps", guestId, event.id] }),
  });

  const eventClosed = isRsvpClosed(event.rsvp_deadline);
  const updateForm = (id: string, patch: Partial<RsvpFormState>) =>
    setForms((f) => ({ ...f, [id]: { ...(f[id] ?? EMPTY_FORM), ...patch } }));

  if (seLoading) {
    return <div className="flex h-64 items-center justify-center"><div className="animate-pulse text-event-muted">Loading…</div></div>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-center text-3xl font-bold text-event-heading">RSVP</h1>
      <p className="mb-6 text-center text-sm text-event-muted">
        {event.name}{event.event_date && ` · ${formatDate(event.event_date)}`}
      </p>
      {event.rsvp_deadline && (
        <p className="mb-4 text-center text-xs text-event-muted">
          Please respond by {formatDate(event.rsvp_deadline)}
        </p>
      )}
      {eventClosed && (
        <div className="mb-4 rounded-md border border-event-border bg-event-surface-alt p-4 text-center text-sm text-event-muted">
          RSVP for this event is now closed.
        </div>
      )}
      {actuallyInvited.length === 0 ? (
        <div className="event-card text-center text-event-muted">
          You are not invited to any specific events with RSVP enabled.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {actuallyInvited.map((se) => (
            <EventRsvpCard key={se.id} se={se} form={forms[se.id] ?? EMPTY_FORM}
              closed={isRsvpClosed(se.rsvp_deadline) || eventClosed}
              updateForm={updateForm} rsvpMutation={rsvpMutation} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventRsvpCard({
  se, form, closed, updateForm, rsvpMutation,
}: {
  se: SubEvent;
  form: RsvpFormState;
  closed: boolean;
  updateForm: (id: string, patch: Partial<RsvpFormState>) => void;
  rsvpMutation: ReturnType<typeof useMutation<void, Error, string>>;
}) {
  return (
    <div className="event-card flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-event-heading">{se.name}</h3>
        {se.date && <p className="text-sm text-event-muted">{formatDate(se.date)}</p>}
        {se.venue && <p className="text-sm text-event-muted">📍 {se.venue}</p>}
      </div>
      {closed ? (
        <p className="text-sm text-event-muted">RSVP is closed for this event.</p>
      ) : (
        <>
          <Field label="Will you attend?">
            <div className="flex gap-2">
              {(["attending", "not_attending"] as const).map((s) => (
                <button key={s} type="button"
                  onClick={() => updateForm(se.id, { status: s })}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    form.status === s
                      ? "bg-event-primary text-event-primary-fg"
                      : "border border-event-border text-event-text hover:bg-event-surface-alt"
                  }`}>
                  {s === "attending" ? "Accept" : "Decline"}
                </button>
              ))}
            </div>
          </Field>
          {form.status === "attending" && (
            <>
              <Field label="Plus ones">
                <input type="number" min={0} value={form.plus_ones}
                  onChange={(e) => updateForm(se.id, { plus_ones: parseInt(e.target.value) || 0 })}
                  className="event-input" />
              </Field>
              <Field label="Dietary requirements">
                <textarea value={form.dietary}
                  onChange={(e) => updateForm(se.id, { dietary: e.target.value })}
                  placeholder="Any allergies or preferences" className="event-input min-h-[60px]" />
              </Field>
            </>
          )}
          <Field label="Message">
            <textarea value={form.message}
              onChange={(e) => updateForm(se.id, { message: e.target.value })}
              placeholder="Leave a message" className="event-input min-h-[60px]" />
          </Field>
          {rsvpMutation.isError && rsvpMutation.variables === se.id && (
            <p className="text-sm text-red-600">
              {rsvpMutation.error instanceof Error ? rsvpMutation.error.message : "Failed to submit RSVP"}
            </p>
          )}
          <button type="button"
            onClick={() => rsvpMutation.mutate(se.id)}
            disabled={form.status === "pending" || rsvpMutation.isPending}
            className="event-btn-primary w-full disabled:opacity-50">
            {rsvpMutation.isPending && rsvpMutation.variables === se.id ? "Submitting…" : "Submit RSVP"}
          </button>
        </>
      )}
    </div>
  );
}
