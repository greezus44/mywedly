import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase, type UserEvent, type SubEvent, type EventRsvp,
  type SubEventGroupAssignment, type GuestInvitationOverride, type Json,
} from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDate, formatTime12, isRsvpClosed } from "../../lib/utils";

interface RsvpFormState { status: string; plus_ones: number; dietary: string; message: string; }

export default function GuestRsvpPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const auth = useGuestAuth();
  const queryClient = useQueryClient();
  const guestId = auth.guestId ?? "";
  const guestName = auth.guestName ?? "";
  const [forms, setForms] = useState<Record<string, RsvpFormState>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const rsvpClosed = isRsvpClosed(event.rsvp_deadline);

  const { data: subEvents, isLoading } = useQuery({
    queryKey: ["guest-sub-events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_events").select("*")
        .eq("parent_event_id", event.id).order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const { data: guestGroups } = useQuery({
    queryKey: ["guest-groups-for-guest", guestId], enabled: !!guestId,
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_group_members")
        .select("group_id").eq("guest_id", guestId);
      if (error) throw error;
      return data.map((d) => d.group_id) as string[];
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["guest-sub-event-assignments", event.id],
    enabled: !!subEvents && subEvents.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_event_group_assignments")
        .select("*, sub_events!inner(parent_event_id)").eq("sub_events.parent_event_id", event.id);
      if (error) throw error;
      return data as (SubEventGroupAssignment & { sub_events: { parent_event_id: string } })[];
    },
  });

  const { data: overrides } = useQuery({
    queryKey: ["guest-overrides", guestId], enabled: !!guestId,
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_invitation_overrides")
        .select("*").eq("guest_id", guestId);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
  });

  const { data: existingRsvps } = useQuery({
    queryKey: ["guest-rsvps", guestId, event.id], enabled: !!guestId,
    queryFn: async () => {
      const { data, error } = await supabase.from("event_rsvps").select("*")
        .eq("guest_id", guestId).eq("event_id", event.id);
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const invitedSubEvents = useMemo(() => {
    if (!subEvents) return [];
    return subEvents.filter((sub) => {
      const override = overrides?.find((o) => o.sub_event_id === sub.id);
      if (override) return override.is_invited;
      const assignedGroupIds = (assignments ?? []).filter((a) => a.sub_event_id === sub.id).map((a) => a.group_id);
      if (assignedGroupIds.length === 0) return true;
      return (guestGroups ?? []).some((gid) => assignedGroupIds.includes(gid));
    });
  }, [subEvents, overrides, assignments, guestGroups]);

  function getForm(subEventId: string): RsvpFormState {
    if (forms[subEventId]) return forms[subEventId];
    const existing = existingRsvps?.find((r) => r.sub_event_id === subEventId || (!r.sub_event_id && subEventId === "__main__"));
    return { status: existing?.status ?? "pending", plus_ones: existing?.plus_ones ?? 0, dietary: existing?.dietary ?? "", message: existing?.message ?? "" };
  }
  function updateForm(subEventId: string, updates: Partial<RsvpFormState>) {
    setForms((prev) => ({ ...prev, [subEventId]: { ...getForm(subEventId), ...updates } }));
  }

  const upsertMutation = useMutation({
    mutationFn: async (toSubmit: { subEventId: string; form: RsvpFormState }[]) => {
      const rows = toSubmit.map(({ subEventId, form }) => ({
        event_id: event.id, guest_id: guestId, guest_name: guestName,
        status: form.status, plus_ones: form.plus_ones, dietary: form.dietary || null,
        message: form.message || null, answers: {} as Json,
        submitted_at: new Date().toISOString(), sub_event_id: subEventId === "__main__" ? null : subEventId,
      }));
      for (const row of rows) {
        const { error } = await supabase.from("event_rsvps").upsert(row, { onConflict: "event_id,guest_id,sub_event_id" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", guestId, event.id] });
      setSubmitted(true); setSubmitError(null);
    },
    onError: (err) => setSubmitError(err instanceof Error ? err.message : "Failed to submit RSVP."),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitError(null);
    const toSubmit: { subEventId: string; form: RsvpFormState }[] = [
      { subEventId: "__main__", form: getForm("__main__") },
    ];
    for (const sub of invitedSubEvents) if (sub.rsvp_enabled) toSubmit.push({ subEventId: sub.id, form: getForm(sub.id) });
    upsertMutation.mutate(toSubmit);
  }

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 rounded-full border-2 border-event-primary border-t-transparent" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold text-event-heading">RSVP</h1>
      <p className="mb-6 text-event-muted">
        {event.event_date && formatDate(event.event_date)}{event.event_time && ` at ${formatTime12(event.event_time)}`}
      </p>
      {rsvpClosed && <div className="event-card mb-6 border-l-4 border-red-400 bg-red-50/50"><p className="text-sm text-red-700">RSVP for this event is now closed.</p></div>}
      {submitted && <div className="event-card mb-6 border-l-4 border-green-400 bg-green-50/50"><p className="text-sm text-green-700">Thank you! Your RSVP has been submitted.</p></div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <RsvpCard title={event.name} subtitle="Main event" form={getForm("__main__")} disabled={rsvpClosed} onChange={(u) => updateForm("__main__", u)} />
        {invitedSubEvents.filter((s) => s.rsvp_enabled).map((sub) => (
          <RsvpCard key={sub.id} title={sub.name} subtitle={sub.date ? `${formatDate(sub.date)}${sub.start_time ? ` at ${formatTime12(sub.start_time)}` : ""}` : undefined}
            form={getForm(sub.id)} disabled={rsvpClosed} onChange={(u) => updateForm(sub.id, u)} />
        ))}
        {submitError && <p className="text-sm text-red-600" role="alert">{submitError}</p>}
        <button type="submit" disabled={rsvpClosed || upsertMutation.isPending} className="event-btn-primary w-full disabled:opacity-60">
          {upsertMutation.isPending ? "Submitting…" : "Submit RSVP"}
        </button>
      </form>
    </div>
  );
}

function RsvpCard({ title, subtitle, form, disabled, onChange }: {
  title: string; subtitle?: string; form: RsvpFormState; disabled?: boolean;
  onChange: (updates: Partial<RsvpFormState>) => void;
}) {
  return (
    <div className="event-card space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-event-heading">{title}</h2>
        {subtitle && <p className="text-sm text-event-muted">{subtitle}</p>}
      </div>
      <div className="flex gap-2">
        <button type="button" disabled={disabled} onClick={() => onChange({ status: "attending" })}
          className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${form.status === "attending" ? "border-event-primary bg-event-primary text-event-primary-fg" : "border-event-border text-event-text hover:bg-event-surface-alt"}`}>✓ Accept</button>
        <button type="button" disabled={disabled} onClick={() => onChange({ status: "not_attending" })}
          className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${form.status === "not_attending" ? "border-red-500 bg-red-500 text-white" : "border-event-border text-event-text hover:bg-event-surface-alt"}`}>✗ Decline</button>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-event-text">Plus ones</label>
        <input type="number" min={0} value={form.plus_ones} disabled={disabled} onChange={(e) => onChange({ plus_ones: Number(e.target.value) })} className="event-input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-event-text">Dietary requirements</label>
        <textarea value={form.dietary} disabled={disabled} onChange={(e) => onChange({ dietary: e.target.value })} className="event-input min-h-[60px]" placeholder="Any dietary needs…" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-event-text">Message</label>
        <textarea value={form.message} disabled={disabled} onChange={(e) => onChange({ message: e.target.value })} className="event-input min-h-[60px]" placeholder="Leave a message…" />
      </div>
    </div>
  );
}
