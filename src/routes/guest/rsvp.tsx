import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { isRsvpClosed } from "../../lib/utils";

export default function GuestRsvp() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [attending, setAttending] = useState<boolean | null>(null);
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const closed = isRsvpClosed(event.rsvp_deadline);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_rsvps").insert({
        event_id: event.id, guest_name: guestName || "Guest",
        attending: attending!, plus_ones: plusOnes, dietary, message,
      });
      if (error) throw error;
    },
    onSuccess: () => { setSubmitted(true); queryClient.invalidateQueries({ queryKey: ["rsvps", event.id] }); },
    onError: (err: any) => alert("Failed to submit RSVP: " + (err.message || "Unknown error")),
  });

  if (closed) return <div className="text-center py-12"><h2 className="text-2xl font-serif mb-2" style={{ color: "var(--event-primary)" }}>RSVP Closed</h2><p className="event-muted-text">The RSVP deadline has passed.</p></div>;
  if (submitted) return <div className="text-center py-12"><h2 className="text-2xl font-serif mb-2" style={{ color: "var(--event-primary)" }}>Thank You!</h2><p className="event-muted-text">Your RSVP has been submitted.</p></div>;

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-serif text-center mb-6" style={{ color: "var(--event-primary)" }}>RSVP</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm mb-2 event-muted-text">Will you attend?</p>
          <div className="flex gap-3">
            <button onClick={() => setAttending(true)} className="flex-1 py-3 rounded-lg border transition-colors" style={{ borderColor: attending === true ? "var(--event-primary)" : "var(--event-border)", background: attending === true ? "var(--event-primary-light)" : "transparent", color: attending === true ? "var(--event-primary)" : "var(--event-text)" }}>Joyfully Accept</button>
            <button onClick={() => setAttending(false)} className="flex-1 py-3 rounded-lg border transition-colors" style={{ borderColor: attending === false ? "var(--event-primary)" : "var(--event-border)", background: attending === false ? "var(--event-primary-light)" : "transparent", color: attending === false ? "var(--event-primary)" : "var(--event-text)" }}>Regretfully Decline</button>
          </div>
        </div>
        {attending === true && (
          <>
            <div><label className="block text-sm mb-1 event-muted-text">Number of Plus Ones</label><input type="number" min={0} max={5} value={plusOnes} onChange={(e) => setPlusOnes(Math.max(0, Number(e.target.value)))} className="w-full px-4 py-2.5 rounded-lg border bg-white" style={{ borderColor: "var(--event-border)" }} /></div>
            <div><label className="block text-sm mb-1 event-muted-text">Dietary Requirements</label><input value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="e.g. Vegetarian, gluten-free" className="w-full px-4 py-2.5 rounded-lg border bg-white" style={{ borderColor: "var(--event-border)" }} /></div>
          </>
        )}
        <div><label className="block text-sm mb-1 event-muted-text">Message (optional)</label><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-lg border bg-white" style={{ borderColor: "var(--event-border)" }} /></div>
        <button onClick={() => submitMutation.mutate()} disabled={attending === null || submitMutation.isPending} className="w-full py-2.5 rounded-lg text-white font-medium disabled:opacity-50" style={{ background: "var(--event-primary)" }}>{submitMutation.isPending ? "Submitting..." : "Submit RSVP"}</button>
      </div>
    </div>
  );
}
