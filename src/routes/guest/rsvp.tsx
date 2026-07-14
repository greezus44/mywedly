import { useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase,
  type UserEvent,
  type SubEvent,
  type EventGuest,
} from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { LoadingSpinner, ErrorState } from "../../components/ui";
import { formatDate, formatTime12, isRsvpClosed } from "../../lib/utils";

interface RsvpFormState {
  status: "attending" | "declined" | "pending";
  plus_ones: number;
  dietary: string;
  message: string;
}

export default function Rsvp() {
  const { slug } = useParams<{ slug: string }>();
  const { guestId } = useGuestAuth();
  const queryClient = useQueryClient();
  const [forms, setForms] = useState<Record<string, RsvpFormState>>({});
  const [submitStatus, setSubmitStatus] = useState<Record<string, "ok" | "err" | null>>({});

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!slug,
  });

  const { data: guest } = useQuery({
    queryKey: ["guest-rsvp-guest", guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests").select("*").eq("id", guestId).maybeSingle();
      if (error) throw error;
      return data as EventGuest | null;
    },
    enabled: !!guestId,
  });

  const { data: subEvents } = useQuery({
    queryKey: ["guest-sub-events", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_events").select("*")
        .eq("parent_event_id", event!.id).eq("rsvp_enabled", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: !!event?.id,
  });

  const subEventIds = (subEvents ?? []).map((s) => s.id);

  const { data: assignments } = useQuery({
    queryKey: ["guest-group-assignments", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_event_group_assignments")
        .select("*").in("sub_event_id", subEventIds);
      if (error) throw error;
      return data;
    },
    enabled: subEventIds.length > 0,
  });

  const { data: overrides } = useQuery({
    queryKey: ["guest-invitation-overrides", event?.id, guestId],
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_invitation_overrides")
        .select("*").in("sub_event_id", subEventIds).eq("guest_id", guestId!);
      if (error) throw error;
      return data;
    },
    enabled: subEventIds.length > 0 && !!guestId,
  });

  const { data: existingRsvps } = useQuery({
    queryKey: ["guest-existing-rsvps", event?.id, guestId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_rsvps").select("*")
        .eq("guest_id", guestId!).in("sub_event_id", subEventIds);
      if (error) throw error;
      return data;
    },
    enabled: subEventIds.length > 0 && !!guestId,
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ subEvent, formState }: { subEvent: SubEvent; formState: RsvpFormState }) => {
      const existing = existingRsvps?.find((r) => r.sub_event_id === subEvent.id);
      const payload = {
        event_id: event!.id, guest_id: guestId!, guest_name: guest?.name ?? "Guest",
        status: formState.status, plus_ones: formState.plus_ones,
        dietary: formState.dietary || null, message: formState.message || null,
        sub_event_id: subEvent.id,
      };
      if (existing) {
        const { error } = await supabase.from("event_rsvps").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["guest-existing-rsvps"] });
      setSubmitStatus((p) => ({ ...p, [v.subEvent.id]: "ok" }));
    },
    onError: (_e, v) => setSubmitStatus((p) => ({ ...p, [v.subEvent.id]: "err" })),
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>;
  }
  if (isError || !event) {
    return <ErrorState title="This invitation website could not be found or is no longer available." />;
  }

  const assignedGroupIds = new Set(assignments?.map((a) => a.group_id) ?? []);
  const overrideMap = new Map(overrides?.map((o) => [o.sub_event_id, o.is_invited]) ?? []);
  const invitedSubEvents = (subEvents ?? []).filter((sub) => {
    if (overrideMap.has(sub.id)) return overrideMap.get(sub.id);
    return guest?.group_id ? assignedGroupIds.has(guest.group_id) : true;
  });

  const getFormState = (id: string): RsvpFormState => {
    if (forms[id]) return forms[id];
    const ex = existingRsvps?.find((r) => r.sub_event_id === id);
    return {
      status: (ex?.status as RsvpFormState["status"]) ?? "pending",
      plus_ones: ex?.plus_ones ?? 0, dietary: ex?.dietary ?? "", message: ex?.message ?? "",
    };
  };
  const setField = (id: string, field: keyof RsvpFormState, value: string | number) =>
    setForms((p) => ({ ...p, [id]: { ...getFormState(id), [field]: value } }));

  const handleSubmit = (e: FormEvent, sub: SubEvent) => {
    e.preventDefault();
    setSubmitStatus((p) => ({ ...p, [sub.id]: null }));
    upsertMutation.mutate({ subEvent: sub, formState: getFormState(sub.id) });
  };

  if (isRsvpClosed(event.rsvp_deadline)) {
    return (
      <div className="flex flex-col gap-6">
        <header className="text-center"><h2 className="text-2xl font-bold text-event-heading">RSVP</h2></header>
        <div className="event-card text-center text-event-muted">RSVP is now closed. Thank you!</div>
      </div>
    );
  }
  if (invitedSubEvents.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <header className="text-center"><h2 className="text-2xl font-bold text-event-heading">RSVP</h2></header>
        <div className="event-card text-center text-event-muted">
          You are not invited to any specific events with RSVP enabled.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h2 className="text-2xl font-bold text-event-heading" style={{ fontFamily: "var(--event-font-heading)" }}>RSVP</h2>
        <p className="mt-1 text-sm text-event-muted">{event.name}</p>
      </header>
      {invitedSubEvents.map((sub) => {
        const fs = getFormState(sub.id);
        const status = submitStatus[sub.id];
        const subClosed = isRsvpClosed(sub.rsvp_deadline);
        return (
          <form key={sub.id} onSubmit={(e) => handleSubmit(e, sub)} className="event-card flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-event-heading">{sub.name}</h3>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-event-muted">
                {sub.date && <span>📅 {formatDate(sub.date)}</span>}
                {sub.time && <span>⏰ {formatTime12(sub.time)}</span>}
                {sub.venue && <span>📍 {sub.venue}</span>}
              </div>
            </div>
            {subClosed ? (
              <p className="text-sm text-event-muted">RSVP is closed for this event.</p>
            ) : (
              <>
                <div className="flex gap-2">
                  {(["attending", "declined"] as const).map((opt) => (
                    <button key={opt} type="button" onClick={() => setField(sub.id, "status", opt)}
                      className={fs.status === opt ? "event-btn-primary flex-1" : "event-btn-secondary flex-1"}>
                      {opt === "attending" ? "Accept" : "Decline"}
                    </button>
                  ))}
                </div>
                {fs.status === "attending" && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-event-text">Number of plus ones</label>
                      <input type="number" min={0} value={fs.plus_ones}
                        onChange={(e) => setField(sub.id, "plus_ones", parseInt(e.target.value) || 0)}
                        className="event-input mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-event-text">Dietary requirements</label>
                      <textarea rows={2} value={fs.dietary}
                        onChange={(e) => setField(sub.id, "dietary", e.target.value)}
                        className="event-input mt-1" placeholder="Any dietary needs..." />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-sm font-medium text-event-text">Message</label>
                  <textarea rows={3} value={fs.message}
                    onChange={(e) => setField(sub.id, "message", e.target.value)}
                    className="event-input mt-1" placeholder="Leave a message for the hosts..." />
                </div>
                {status === "ok" && <p className="text-sm text-green-600">RSVP submitted successfully!</p>}
                {status === "err" && <p className="text-sm text-red-600">Failed to submit. Please try again.</p>}
                <button type="submit" disabled={upsertMutation.isPending} className="event-btn-primary">
                  {upsertMutation.isPending ? "Submitting..." : "Submit RSVP"}
                </button>
              </>
            )}
          </form>
        );
      })}
    </div>
  );
}
