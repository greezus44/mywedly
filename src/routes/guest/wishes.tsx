import { useState, type FormEvent } from "react";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";

export default function GuestWishes() {
  const { event } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!guest || !message.trim()) return;
    setSubmitting(true); setError(null); setSuccess(false);
    try {
      const { error } = await supabase.from("event_messages").insert({ event_id: event.id, guest_id: guest.id, message: message.trim() });
      if (error) throw error;
      setMessage(""); setSuccess(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to send"); }
    finally { setSubmitting(false); }
  };

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-2xl">
        <h2 className="guest-title mb-6 text-center">Leave a Wish</h2>
        {success && <p className="mb-4 text-center text-sm" style={{ color: "var(--event-primary)" }}>Thank you for your wish!</p>}
        {error && <p className="mb-4 text-center text-sm" style={{ color: "var(--event-primary)" }}>{error}</p>}
        <form onSubmit={handleSubmit} className="event-card space-y-4">
          <div>
            <label className="mb-1.5 block text-sm" style={{ color: "var(--event-text)" }}>Your message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="event-input" placeholder="Write your wish here..." required />
          </div>
          <div className="text-center">
            <Button type="submit" loading={submitting}>Send Wish</Button>
          </div>
        </form>
      </div>
    </section>
  );
}
