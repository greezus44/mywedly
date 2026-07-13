import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { DEFAULT_THEME } from "../../lib/theme";
import { formatDate, formatTime } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import type { FormEvent } from "react";
import { MapPin, Calendar, Clock, Mail, Send, Phone } from "lucide-react";

export default function Contact() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestName } = useGuestAuth();
  const theme = { ...DEFAULT_THEME, ...event.theme };
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [sent, setSent] = useState(false);

  const mutation = useMutation<void, Error>({
    mutationFn: async () => {
      const name = guestName || "Guest";
      const fullMessage = contactInfo.trim()
        ? `${message.trim()}\n\nContact: ${contactInfo.trim()}`
        : message.trim();
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: name,
        message: fullMessage,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSent(true);
      setMessage("");
      setContactInfo("");
      queryClient.invalidateQueries({ queryKey: ["event-messages", event.id] });
      setTimeout(() => setSent(false), 4000);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    mutation.mutate();
  };

  const mutationError = (mutation as any).error as Error | undefined;

  const mapsUrl = event.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${event.venue || ""} ${event.address}`.trim()
      )}`
    : null;

  return (
    <div style={{ background: theme.bgColor, color: theme.bodyColor, fontFamily: theme.bodyFont }}>
      <section
        className="px-6 py-12 text-center"
        style={{ maxWidth: theme.maxWidth, margin: "0 auto" }}
      >
        <div
          className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4"
          style={{ background: `${theme.primaryColor}15` }}
        >
          <Phone className="w-7 h-7" style={{ color: theme.primaryColor }} />
        </div>
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: theme.headingColor, fontFamily: theme.headingFont }}
        >
          Contact
        </h2>
        <p className="text-sm" style={{ color: theme.bodyColor }}>
          Event details and inquiries
        </p>
      </section>

      <section
        className="px-6 pb-8"
        style={{ maxWidth: theme.maxWidth, margin: "0 auto" }}
      >
        <div className="space-y-3">
          {event.event_date && (
            <div
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: `${theme.accentColor}10`, border: `1px solid ${theme.accentColor}20` }}
            >
              <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.primaryColor }} />
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Date</p>
                <p className="text-sm font-medium" style={{ color: theme.headingColor }}>
                  {formatDate(event.event_date)}
                </p>
              </div>
            </div>
          )}

          {event.event_time && (
            <div
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: `${theme.accentColor}10`, border: `1px solid ${theme.accentColor}20` }}
            >
              <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.primaryColor }} />
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Time</p>
                <p className="text-sm font-medium" style={{ color: theme.headingColor }}>
                  {formatTime(event.event_time)}
                </p>
              </div>
            </div>
          )}

          {(event.venue || event.address) && (
            <div
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: `${theme.accentColor}10`, border: `1px solid ${theme.accentColor}20` }}
            >
              <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.primaryColor }} />
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Venue</p>
                {event.venue && (
                  <p className="text-sm font-medium" style={{ color: theme.headingColor }}>
                    {event.venue}
                  </p>
                )}
                {event.address && (
                  <p className="text-xs mt-0.5 opacity-70">{event.address}</p>
                )}
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs mt-2 font-medium transition-colors hover:opacity-70"
                    style={{ color: theme.primaryColor }}
                  >
                    <MapPin className="w-3 h-3" />
                    View on Google Maps
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        className="px-6 pb-12"
        style={{ maxWidth: theme.maxWidth, margin: "0 auto" }}
      >
        <div className="mb-6">
          <h3
            className="text-lg font-semibold mb-1"
            style={{ color: theme.headingColor, fontFamily: theme.headingFont }}
          >
            Send a Message
          </h3>
          <p className="text-xs opacity-70" style={{ color: theme.bodyColor }}>
            Have a question? Reach out to the host.
          </p>
        </div>

        {sent ? (
          <div
            className="rounded-xl p-6 text-center space-y-2"
            style={{ background: `${theme.primaryColor}10`, border: `1px solid ${theme.primaryColor}25` }}
          >
            <div
              className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
              style={{ background: `${theme.primaryColor}20` }}
            >
              <Mail className="w-6 h-6" style={{ color: theme.primaryColor }} />
            </div>
            <p className="text-sm font-medium" style={{ color: theme.headingColor }}>
              Message sent!
            </p>
            <p className="text-xs opacity-70" style={{ color: theme.bodyColor }}>
              The host will get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.headingColor }}
              >
                Your Email or Phone
              </label>
              <Input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="email@example.com or +1 234 567 8900"
                style={{
                  background: theme.bgColor,
                  color: theme.bodyColor,
                  borderColor: `${theme.accentColor}40`,
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.headingColor }}
              >
                Message
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                rows={4}
                style={{
                  background: theme.bgColor,
                  color: theme.bodyColor,
                  borderColor: `${theme.accentColor}40`,
                  borderRadius: theme.buttonRadius,
                }}
              />
            </div>

            {mutationError && (
              <p className="text-sm text-red-500">{mutationError.message}</p>
            )}

            <Button
              type="submit"
              loading={mutation.isPending}
              disabled={!message.trim()}
              className="w-full"
              style={{
                background: theme.buttonBgColor,
                color: theme.buttonTextColor,
                borderRadius: theme.buttonRadius,
                border: `1px solid ${theme.buttonBgColor}`,
              }}
            >
              <Send className="w-4 h-4" />
              Send Message
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
