import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, ExternalLink, Check } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { GuestLayoutContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDate, formatTime } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";

export default function Contact() {
  const { event } = useOutletContext<GuestLayoutContext>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState(guestName || "");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const mapsUrl = event.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${event.venue || ""} ${event.address}`.trim()
      )}`
    : null;

  const submitMutation = useMutation<void, Error>({
    mutationFn: async () => {
      const payload = {
        event_id: event.id,
        guest_name: name.trim(),
        message: message.trim(),
      };
      const { error } = await supabase.from("event_messages").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setSent(true);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["event-messages", event.id] });
      setTimeout(() => setSent(false), 4000);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    submitMutation.mutate();
  };

  return (
    <div className="animate-fade-in py-6">
      <div className="text-center mb-8">
        <h1
          className="text-3xl mb-1"
          style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
        >
          Contact
        </h1>
        <p
          className="text-sm italic"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-script)" }}
        >
          Get in touch with us
        </p>
      </div>

      <div className="space-y-5 mb-8">
        {event.event_date && (
          <div className="flex items-center gap-3">
            <Calendar
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "var(--color-accent)" }}
            />
            <div>
              <p
                className="text-[10px] tracking-[0.2em] uppercase"
                style={{ color: "var(--color-text-muted)" }}
              >
                Date
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-text)" }}
              >
                {formatDate(event.event_date)}
              </p>
            </div>
          </div>
        )}

        {event.event_time && (
          <div className="flex items-center gap-3">
            <Clock
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "var(--color-accent)" }}
            />
            <div>
              <p
                className="text-[10px] tracking-[0.2em] uppercase"
                style={{ color: "var(--color-text-muted)" }}
              >
                Time
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-text)" }}
              >
                {formatTime(event.event_time)}
              </p>
            </div>
          </div>
        )}

        {event.venue && (
          <div className="flex items-start gap-3">
            <MapPin
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              style={{ color: "var(--color-accent)" }}
            />
            <div>
              <p
                className="text-[10px] tracking-[0.2em] uppercase"
                style={{ color: "var(--color-text-muted)" }}
              >
                Venue
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-text)" }}
              >
                {event.venue}
              </p>
              {event.address && (
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {event.address}
                </p>
              )}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs mt-1.5 hover:underline"
                  style={{ color: "var(--color-accent)" }}
                >
                  <ExternalLink className="w-3 h-3" />
                  View on Google Maps
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {sent && (
        <div
          className="mb-6 p-4 rounded-lg border flex items-center gap-2.5 animate-fade-in-up"
          style={{
            backgroundColor: "var(--color-bg-subtle)",
            borderColor: "var(--color-border)",
          }}
        >
          <Check
            className="w-4 h-4 flex-shrink-0"
            style={{ color: "var(--color-accent)" }}
          />
          <p
            className="text-xs"
            style={{ color: "var(--color-text)" }}
          >
            Your message has been sent. Thank you!
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border p-6"
        style={{
          backgroundColor: "var(--color-bg-subtle)",
          borderColor: "var(--color-border)",
        }}
      >
        <div>
          <label
            className="block text-xs tracking-[0.15em] uppercase mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Your Name
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label
            className="block text-xs tracking-[0.15em] uppercase mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label
            className="block text-xs tracking-[0.15em] uppercase mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Message
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message..."
            rows={4}
            required
          />
        </div>

        {(submitMutation as any).error && (
          <p className="text-xs text-red-600 text-center">
            {(submitMutation as any).error.message}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          loading={submitMutation.isPending}
          disabled={!name.trim() || !message.trim()}
          className="w-full"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "#ffffff",
            borderRadius: "var(--radius)",
          }}
        >
          Send Message
        </Button>
      </form>
    </div>
  );
}
