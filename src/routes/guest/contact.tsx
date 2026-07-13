import { useState } from "react";
import type { CSSProperties } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useOutletContext } from "react-router-dom";
import { Calendar, Clock, MapPin, Send, ExternalLink } from "lucide-react";
import type { GuestLayoutContext } from "./guest-layout";
import { supabase } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { DEFAULT_THEME, themeToCssVars } from "../../lib/theme";
import { formatDate, formatTime } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";

export default function GuestContact() {
  const { event } = useOutletContext<GuestLayoutContext>();
  const { eventId } = useParams<{ eventId: string }>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState(guestName || "");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const theme = event.theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;

  const mapsLink = event.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`
    : null;

  const submitMutation = useMutation<void, Error>({
    mutationFn: async () => {
      const { error } = await supabase.from("event_messages").insert({
        event_id: eventId!,
        guest_name: name.trim() || guestName || "Anonymous",
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-messages", eventId] });
      setMessage("");
      setEmail("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submitMutation.mutate();
  };

  return (
    <div
      style={{ ...cssVars, backgroundColor: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}
      className="min-h-screen px-4 py-8"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-medium mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Contact
          </h1>
          <p className="text-sm opacity-70">Get in touch with the host</p>
        </div>

        <div className="space-y-4 mb-10">
          {event.event_date && (
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
              <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--color-accent)" }} />
              <div>
                <p className="text-xs uppercase tracking-wider opacity-60 mb-0.5">Date</p>
                <p className="text-base font-medium">{formatDate(event.event_date)}</p>
              </div>
            </div>
          )}
          {event.event_time && (
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
              <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--color-accent)" }} />
              <div>
                <p className="text-xs uppercase tracking-wider opacity-60 mb-0.5">Time</p>
                <p className="text-base font-medium">{formatTime(event.event_time)}</p>
              </div>
            </div>
          )}
          {event.venue && (
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--color-accent)" }} />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider opacity-60 mb-0.5">Venue</p>
                <p className="text-base font-medium">{event.venue}</p>
                {event.address && <p className="text-sm opacity-70 mt-0.5">{event.address}</p>}
              </div>
              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm transition-colors hover:opacity-80 mt-1"
                  style={{ color: "var(--color-accent)" }}
                >
                  Map <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email (optional)</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message"
              rows={4}
              required
            />
          </div>
          {(submitMutation as any).error && (
            <p className="text-sm text-red-600">{(submitMutation as any).error.message}</p>
          )}
          {submitMutation.isSuccess && (
            <p className="text-sm" style={{ color: "var(--color-accent)" }}>
              Message sent successfully
            </p>
          )}
          <Button
            type="submit"
            loading={submitMutation.isPending}
            disabled={!message.trim() || submitMutation.isPending}
            style={{ backgroundColor: "var(--color-primary)", color: "#ffffff" }}
          >
            <Send className="w-4 h-4" />
            Send message
          </Button>
        </form>
      </div>
    </div>
  );
}
