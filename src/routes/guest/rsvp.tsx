import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase, type UserEvent, type SubEvent, type EventRsvp,
  type GuestGroupMember, type SubEventGroupAssignment, type GuestInvitationOverride,
} from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDate, formatTime12, isRsvpClosed } from "../../lib/utils";

interface RsvpState {
  status: "accepted" | "declined" | "pending";
  plus_ones: number;
  dietary: string;
  message: string;
}

const cardStyle: React.CSSProperties = { backgroundColor: "var(--event-surface)", border: "1px solid var(--event-border)" };

function Spinner() {
  return <div className="animate-spin h-8 w-8 border-2 rounded-full" style={{ borderColor: "var(--event-primary)", borderTopColor: "transparent" }} />;
}

export default function GuestRsvp() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestId, guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [rsvpStates, setRsvpStates] = useState<Record<string, RsvpState>>({});
  const [submitted, setSubmitted] = useState(false);

  const deadlineClosed = isRsvpClosed(event.rsvp_deadline);

  const { data: subEvents, isLoading } = useQuery({
    queryKey: ["guest_rsvp_sub_events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events").select("*").eq("parent_event_id", event.id).order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const { data: groupMemberships } = useQuery({
    queryKey: ["guest_group_memberships", guestId],
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_group_members").select("*").eq("guest_id", guestId!);
      if (error) throw error;
      return data as GuestGroupMember[];
    },
    enabled: !!guestId,
  });

  const { data: groupAssignments } = useQuery({
    queryKey: ["sub_event_group_assignments", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments").select("*")
        .in("sub_event_id", (subEvents || []).map((se) => se.id));
      if (error) throw error;
      return data as SubEventGroupAssignment[];
    },
    enabled: !!subEvents?.length,
  });

  const { data: overrides } = useQuery({
    queryKey: ["guest_invitation_overrides", guestId],
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_invitation_overrides").select("*").eq("guest_id", guestId!);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
    enabled: !!guestId,
  });

  const { data: existingRsvps } = useQuery({
    queryKey: ["guest_existing_rsvps", event.id, guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps").select("*").eq("event_id", event.id).eq("guest_id", guestId!);
      if (error) throw error;
      return data as EventRsvp[];
    },
    enabled: !!guestId,
  });

  // Determine which sub-events the guest is invited to
  const guestGroupIds = new Set((groupMemberships || []).map((gm) => gm.group_id));
  const invitedSubEvents = (subEvents || []).filter((se) => {
    const override = (overrides || []).find((o) => o.sub_event_id === se.id);
    if (override) return override.is_invited;
    const assignments = (groupAssignments || []).filter((ga) => ga.sub_event_id === se.id);
    if (assignments.length === 0) return true;
    return assignments.some((ga) => guestGroupIds.has(ga.group_id));
  });

  useEffect(() => {
    if (!invitedSubEvents.length) return;
    const states: Record<string, RsvpState> = {};
    for (const se of invitedSubEvents) {
      const existing = (existingRsvps || []).find((r) => r.sub_event_id === se.id);
      states[se.id] = {
        status: (existing?.status as RsvpState["status"]) || "pending",
        plus_ones: existing?.plus_ones ?? 0,
        dietary: existing?.dietary ?? "",
        message: existing?.message ?? "",
      };
    }
    setRsvpStates(states);
  }, [invitedSubEvents, existingRsvps]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      for (const se of invitedSubEvents) {
        const state = rsvpStates[se.id];
        if (!state) continue;
        const existing = (existingRsvps || []).find((r) => r.sub_event_id === se.id);
        const payload = {
          event_id: event.id, guest_id: guestId, guest_name: guestName || "Guest",
          status: state.status, plus_ones: state.plus_ones, dietary: state.dietary,
          message: state.message, submitted_at: new Date().toISOString(), sub_event_id: se.id,
        };
        if (existing) {
          const { error } = await supabase.from("event_rsvps").update(payload).eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("event_rsvps").insert(payload);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_existing_rsvps", event.id, guestId] });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    },
  });

  function updateState(id: string, patch: Partial<RsvpState>) {
    setRsvpStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  if (deadlineClosed) return (
    <div className="max-w-lg mx-auto text-center py-12">
      <h2 className="font-event text-2xl mb-3" style={{ color: "var(--event-heading)" }}>RSVP Closed</h2>
      <p style={{ color: "var(--event-muted)" }}>The RSVP deadline has passed. Please contact the host if you need to make changes.</p>
    </div>
  );

  if (!invitedSubEvents.length) return (
    <div className="max-w-lg mx-auto text-center py-12">
      <h2 className="font-event text-2xl mb-3" style={{ color: "var(--event-heading)" }}>RSVP</h2>
      <p style={{ color: "var(--event-muted)" }}>There are no events requiring an RSVP at this time.</p>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="font-event text-2xl mb-2 text-center" style={{ color: "var(--event-heading)" }}>RSVP</h2>
      <p className="text-sm text-center mb-8" style={{ color: "var(--event-muted)" }}>Please let us know if you'll be attending each event.</p>

      {submitted && (
        <div className="rounded-lg p-4 mb-6 text-center" style={cardStyle}>
          <p className="text-sm" style={{ color: "var(--event-primary)" }}>✓ Thank you! Your RSVP has been submitted.</p>
        </div>
      )}

      <div className="space-y-6">
        {invitedSubEvents.map((se) => {
          const state = rsvpStates[se.id] || { status: "pending" as const, plus_ones: 0, dietary: "", message: "" };
          const eventClosed = isRsvpClosed(se.rsvp_deadline);
          return (
            <div key={se.id} className="rounded-xl p-5" style={cardStyle}>
              <h3 className="font-event text-lg mb-1" style={{ color: "var(--event-heading)" }}>{se.name}</h3>
              {se.date && (
                <p className="text-sm mb-4" style={{ color: "var(--event-muted)" }}>
                  {formatDate(se.date)}{se.start_time && ` at ${formatTime12(se.start_time)}`}
                </p>
              )}
              {eventClosed ? (
                <p className="text-sm" style={{ color: "var(--event-muted)" }}>RSVP for this event is closed.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {(["accepted", "declined"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateState(se.id, { status })}
                        className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        style={state.status === status
                          ? { backgroundColor: "var(--event-primary)", color: "var(--event-primary-fg)" }
                          : { backgroundColor: "transparent", color: "var(--event-primary)", border: "1px solid var(--event-border)" }
                        }
                      >
                        {status === "accepted" ? "Attending" : "Not Attending"}
                      </button>
                    ))}
                  </div>
                  {state.status === "accepted" && (
                    <>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: "var(--event-muted)" }}>Plus Ones</label>
                        <input type="number" min={0} value={state.plus_ones}
                          onChange={(e) => updateState(se.id, { plus_ones: Number(e.target.value) })} className="event-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: "var(--event-muted)" }}>Dietary Requirements</label>
                        <input type="text" value={state.dietary}
                          onChange={(e) => updateState(se.id, { dietary: e.target.value })}
                          placeholder="Any dietary restrictions?" className="event-input" />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--event-muted)" }}>Message (optional)</label>
                    <textarea rows={2} value={state.message}
                      onChange={(e) => updateState(se.id, { message: e.target.value })}
                      placeholder="Leave a message for the host..." className="event-input resize-none" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}
        className="event-btn-primary w-full mt-6 flex items-center justify-center gap-2">
        {submitMutation.isPending && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {submitMutation.isPending ? "Submitting..." : "Submit RSVP"}
      </button>

      {submitMutation.isError && (
        <p className="text-sm text-red-600 text-center mt-3">Failed to submit RSVP. Please try again.</p>
      )}
    </div>
  );
}
