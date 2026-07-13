import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui";
import { Check, X, Minus, Plus } from "lucide-react";

export default function GuestRsvp() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestName } = useGuestAuth();
  const [attending, setAttending] = useState<boolean | null>(null);
  const [plusOnes, setPlusOnes] = useState(0);
  const [message, setMessage] = useState("");
  const [dietary, setDietary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attending === null) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("event_rsvps").insert({
        event_id: event.id,
        guest_name: guestName || "Anonymous",
        attending,
        plus_ones: attending ? plusOnes : 0,
        message,
        dietary,
      });
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      alert("Failed to submit RSVP: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <h2 className="text-2xl font-serif mb-2" style={{ color: "var(--event-primary)" }}>Thank You!</h2>
          <p style={{ color: "var(--event-muted)" }}>Your RSVP has been submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-serif text-center mb-6" style={{ color: "var(--event-primary)" }}>RSVP</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-3">
            <button type="button" onClick={() => setAttending(true)} className={`flex-1 p-4 rounded-lg border-2 transition-colors ${attending === true ? "border-green-500 bg-green-50" : "border-slate-200"}`}>
              <Check className="w-6 h-6 mx-auto mb-1" /> Joyfully Accept
            </button>
            <button type="button" onClick={() => setAttending(false)} className={`flex-1 p-4 rounded-lg border-2 transition-colors ${attending === false ? "border-red-500 bg-red-50" : "border-slate-200"}`}>
              <X className="w-6 h-6 mx-auto mb-1" /> Regretfully Decline
            </button>
          </div>
          {attending === true && (
            <div className="flex items-center justify-between p-4 rounded-lg border" style={{ borderColor: "var(--event-border)" }}>
              <span>Number of Guests</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setPlusOnes(Math.max(0, plusOnes - 1))} className="p-1 rounded"><Minus className="w-4 h-4" /></button>
                <span className="w-8 text-center">{plusOnes + 1}</span>
                <button type="button" onClick={() => setPlusOnes(plusOnes + 1)} className="p-1 rounded"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          )}
          {attending === true && (
            <Textarea placeholder="Dietary requirements" value={dietary} onChange={(e) => setDietary(e.target.value)} rows={2} />
          )}
          <Textarea placeholder="Leave a message for the host" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
          <Button type="submit" loading={submitting} disabled={attending === null} className="w-full py-3">Submit RSVP</Button>
        </form>
      </div>
    </div>
  );
}
