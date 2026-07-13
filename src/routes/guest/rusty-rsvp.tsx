import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase, type UserEvent, type SubEvent,
  type SubEventGroupAssignment, type GuestInvitationOverride, type Json,
} from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { isRsvpClosed, formatDateTime } from "../../lib/utils";

interface RsvpFormState { status: string; plus_ones: number; dietary: string; message: string }

export default function RustyRsvp() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestId, guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);

  const closed = isRsvpClosed(event.rsvp_deadline);

  const { data: subEvents } = useQuery({
    queryKey: ["rusty_sub_events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const { data: groupAssignments } = useQuery({
    queryKey: ["rusty_group_assignments", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_event_group_assignments").select("*");
      if (error) throw error;
      return data as SubEventGroupAssignment[];
    },
  });

  const { data: overrides } = useQuery({
    queryKey: ["rusty_invitation_overrides", event.id, guestId],
    enabled: !!guestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("guest_id", guestId || "");
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
  });

  const invitedSubEvents = useMemo(() => {
    if (!subEvents || !groupAssignments) return [];
    const invitedIds = new Set((overrides || []).filter((o) => o.is_invited).map((o) => o.sub_event_id));
    const removedIds = new Set((overrides || []).filter((o) => !o.is_invited).map((o) => o.sub_event_id));
    return subEvents.filter((se) => {
      if (removedIds.has(se.id)) return false;
      if (invitedIds.has(se.id)) return true;
      return groupAssignments.some((a) => a.sub_event_id === se.id);
    });
  }, [subEvents, groupAssignments, overrides]);

  const [forms, setForms] = useState<Record<string, RsvpFormState>>({});

  function getForm(id: string): RsvpFormState {
    return forms[id] || { status: "", plus_ones: 0, dietary: "", message: "" };
  }
  function updateForm(id: string, patch: Partial<RsvpFormState>) {
    setForms((prev) => ({ ...prev, [id]: { ...getForm(id), ...patch } }));
  }

  const submitMutation = useMutation({
    mutationFn: async (subEventId: string) => {
      const form = getForm(subEventId);
      const payload = {
        event_id: event.id, guest_id: guestId || null, guest_name: guestName || "Guest",
        status: form.status, plus_ones: form.plus_ones, dietary: form.dietary, message: form.message,
        answers: {} as Json, submitted_at: new Date().toISOString(), sub_event_id: subEventId,
      };
      const { data: existing } = await supabase
        .from("event_rsvps").select("id")
        .eq("event_id", event.id).eq("guest_id", guestId || "").eq("sub_event_id", subEventId).maybeSingle();
      if (existing) {
        const { error } = await supabase.from("event_rsvps").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_rsvps", event.id] });
      setSubmitted(true);
    },
  });

  if (closed) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="font-event text-2xl text-event-heading mb-2">RSVP Closed</h2>
        <p className="text-event-muted">The RSVP deadline ({event.rsvp_deadline ? formatDateTime(event.rsvp_deadline) : ""}) has passed.</p>
      </div>
    );
  }

  if (!invitedSubEvents || invitedSubEvents.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="font-event text-2xl text-event-heading mb-2">RSVP</h2>
        <p className="text-event-muted">There are no events requiring an RSVP at this time.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="font-event text-2xl text-event-heading">RSVP</h2>
        <p className="mt-1 text-event-muted">Let us know if you'll be attending.</p>
      </div>

      {submitted && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Thank you! Your RSVP has been submitted.
        </div>
      )}

      {invitedSubEvents.map((se) => {
        const form = getForm(se.id);
        return (
          <div key={se.id} className="event-card border-2 border-event-border space-y-4">
            <h3 className="font-event text-xl text-event-heading">{se.name}</h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => updateForm(se.id, { status: "attending" })} className={`event-btn-primary flex-1 ${form.status === "attending" ? "" : "opacity-50"}`}>Accept</button>
              <button type="button" onClick={() => updateForm(se.id, { status: "not_attending" })} className={`event-btn-secondary flex-1 ${form.status === "not_attending" ? "" : "opacity-50"}`}>Decline</button>
            </div>
            {form.status === "attending" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-event-text mb-1">Plus Ones</label>
                  <input type="number" min={0} value={form.plus_ones} onChange={(e) => updateForm(se.id, { plus_ones: parseInt(e.target.value) || 0 })} className="event-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-event-text mb-1">Dietary Requirements</label>
                  <input type="text" value={form.dietary} onChange={(e) => updateForm(se.id, { dietary: e.target.value })} className="event-input" placeholder="Any dietary needs?" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-event-text mb-1">Message</label>
              <textarea rows={3} value={form.message} onChange={(e) => updateForm(se.id, { message: e.target.value })} className="event-input" placeholder="Leave a message (optional)" />
            </div>
            <button type="button" disabled={!form.status || submitMutation.isPending} onClick={() => submitMutation.mutate(se.id)} className="event-btn-primary w-full">
              {submitMutation.isPending ? "Submitting…" : "Submit RSVP"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
