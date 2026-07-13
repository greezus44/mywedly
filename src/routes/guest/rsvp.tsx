import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Loader2, Check, X } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useToast } from "../../components/ui";
import { Button } from "../../components/ui/Button";

export default function GuestRsvpPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const { guestName } = useGuestAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<"attending" | "declined" | null>(null);
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!guestName) {
    navigate("login");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status || !guestName) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("event_rsvps").insert({
        event_id: event.id,
        guest_name: guestName,
        status,
        plus_ones: status === "attending" ? plusOnes : 0,
        dietary: dietary || null,
        message: message || null,
      });
      if (error) throw error;
      toast("RSVP submitted! Thank you.", "success");
      navigate("home");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to submit RSVP", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-10" style={{ backgroundColor: "var(--event-bg)", color: "var(--event-text)" }}>
      <h1 className="text-3xl font-semibold" style={{ fontFamily: "var(--event-font-heading)" }}>
        RSVP
      </h1>
      <p style={{ color: "var(--event-text-muted)" }} className="text-sm">
        Hi {guestName}, will you be attending?
      </p>

      <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStatus("attending")}
            style={{
              backgroundColor: status === "attending" ? "var(--event-primary)" : "var(--event-surface)",
              color: status === "attending" ? "#fff" : "var(--event-text)",
              border: "1px solid var(--event-border)",
              borderRadius: "var(--event-radius)",
            }}
            className="flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
          >
            <Check className="h-4 w-4" />
            Attending
          </button>
          <button
            type="button"
            onClick={() => setStatus("declined")}
            style={{
              backgroundColor: status === "declined" ? "var(--event-primary)" : "var(--event-surface)",
              color: status === "declined" ? "#fff" : "var(--event-text)",
              border: "1px solid var(--event-border)",
              borderRadius: "var(--event-radius)",
            }}
            className="flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
          >
            <X className="h-4 w-4" />
            Decline
          </button>
        </div>

        {status === "attending" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: "var(--event-text)" }}>
                Plus ones: {plusOnes}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPlusOnes((n) => Math.max(0, n - 1))}
                  className="h-9 w-9 rounded-md border text-lg"
                  style={{ borderColor: "var(--event-border)", color: "var(--event-text)" }}
                >
                  −
                </button>
                <span className="text-lg font-semibold">{plusOnes}</span>
                <button
                  type="button"
                  onClick={() => setPlusOnes((n) => Math.min(10, n + 1))}
                  className="h-9 w-9 rounded-md border text-lg"
                  style={{ borderColor: "var(--event-border)", color: "var(--event-text)" }}
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: "var(--event-text)" }}>
                Dietary requirements
              </label>
              <input
                type="text"
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                placeholder="Vegetarian, allergies, etc."
                className="h-10 w-full rounded-md border px-3 text-sm"
                style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)", color: "var(--event-text)" }}
              />
            </div>
          </>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" style={{ color: "var(--event-text)" }}>
            Message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a message for the host..."
            className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)", color: "var(--event-text)" }}
          />
        </div>

        <Button type="submit" loading={loading} disabled={!status} className="w-full">
          Submit RSVP
        </Button>
      </form>
    </div>
  );
}
