import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  MapPin,
  Calendar,
  Clock,
  Phone,
  Mail,
  Loader2,
  Send,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Input, Textarea } from "../../components/ui/Input";
import type { GuestLayoutContext } from "./guest-layout";
import { formatDate, formatTime } from "../../lib/utils";

export default function Contact() {
  const { event } = useOutletContext<GuestLayoutContext>();
  const { guestName } = useGuestAuth();
  const theme = event.theme;
  const content = event.content;

  const [name, setName] = useState(guestName || "");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const mapsUrl = event.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${event.venue} ${event.address}`
      )}`
    : null;

  const mutation = useMutation({
    mutationFn: async () => {
      const emailPart = email.trim() ? ` (email: ${email.trim()})` : "";
      const fullMessage = `[Contact]${emailPart} ${message.trim()}`;
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: name.trim() || guestName || "Anonymous",
        message: fullMessage,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSent(true);
      setMessage("");
      setEmail("");
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    mutation.mutate();
  };

  const contactPhone = content.contact_phone;
  const contactEmail = content.contact_email;
  const contactAddress = content.contact_address || event.address;

  return (
    <div className="w-full pb-20" style={{ backgroundColor: theme.bgColor }}>
      <div
        className="text-center py-12 px-6"
        style={{ padding: `${theme.sectionPadding}px 24px` }}
      >
        <p
          className="text-base mb-2 opacity-70"
          style={{ fontFamily: `var(--wed-script-font)` }}
        >
          Get in touch
        </p>
        <h1
          className="text-4xl font-bold mb-4"
          style={{
            fontFamily: `var(--wed-heading-font)`,
            color: theme.headingColor,
          }}
        >
          Contact
        </h1>
        <div
          className="w-12 h-px mx-auto"
          style={{ backgroundColor: theme.primaryColor, opacity: 0.5 }}
        />
      </div>

      <div
        className="px-6 pb-12 space-y-8"
        style={{ maxWidth: `${theme.maxWidth}px`, margin: "0 auto" }}
      >
        <div
          className="p-6 rounded-xl space-y-5"
          style={{
            backgroundColor: `color-mix(in srgb, ${theme.bgColor} 60%, #ffffff)`,
            border: `1px solid color-mix(in srgb, ${theme.accentColor} 20%, transparent)`,
          }}
        >
          {event.event_date && (
            <div className="flex items-start gap-3">
              <Calendar
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: theme.primaryColor }}
              />
              <div>
                <p
                  className="text-xs uppercase tracking-wider opacity-60 mb-0.5"
                  style={{ color: theme.bodyColor }}
                >
                  Date
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: theme.headingColor }}
                >
                  {formatDate(event.event_date)}
                </p>
              </div>
            </div>
          )}

          {event.event_time && (
            <div className="flex items-start gap-3">
              <Clock
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: theme.primaryColor }}
              />
              <div>
                <p
                  className="text-xs uppercase tracking-wider opacity-60 mb-0.5"
                  style={{ color: theme.bodyColor }}
                >
                  Time
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: theme.headingColor }}
                >
                  {formatTime(event.event_time)}
                </p>
              </div>
            </div>
          )}

          {(event.venue || contactAddress) && (
            <div className="flex items-start gap-3">
              <MapPin
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: theme.primaryColor }}
              />
              <div className="flex-1">
                <p
                  className="text-xs uppercase tracking-wider opacity-60 mb-0.5"
                  style={{ color: theme.bodyColor }}
                >
                  Venue
                </p>
                {event.venue && (
                  <p
                    className="text-sm font-medium"
                    style={{ color: theme.headingColor }}
                  >
                    {event.venue}
                  </p>
                )}
                {contactAddress && (
                  <p
                    className="text-sm mt-0.5"
                    style={{ color: theme.bodyColor }}
                  >
                    {contactAddress}
                  </p>
                )}
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs mt-2 underline hover:opacity-80 transition-opacity"
                    style={{ color: theme.primaryColor }}
                  >
                    View on map
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {contactPhone && (
            <div className="flex items-start gap-3">
              <Phone
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: theme.primaryColor }}
              />
              <div>
                <p
                  className="text-xs uppercase tracking-wider opacity-60 mb-0.5"
                  style={{ color: theme.bodyColor }}
                >
                  Phone
                </p>
                <a
                  href={`tel:${contactPhone}`}
                  className="text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ color: theme.headingColor }}
                >
                  {contactPhone}
                </a>
              </div>
            </div>
          )}

          {contactEmail && (
            <div className="flex items-start gap-3">
              <Mail
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: theme.primaryColor }}
              />
              <div>
                <p
                  className="text-xs uppercase tracking-wider opacity-60 mb-0.5"
                  style={{ color: theme.bodyColor }}
                >
                  Email
                </p>
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-sm font-medium hover:opacity-80 transition-opacity break-all"
                  style={{ color: theme.headingColor }}
                >
                  {contactEmail}
                </a>
              </div>
            </div>
          )}
        </div>

        <div>
          <h2
            className="text-2xl font-bold text-center mb-6"
            style={{
              fontFamily: `var(--wed-heading-font)`,
              color: theme.headingColor,
            }}
          >
            Send us a message
          </h2>

          {sent ? (
            <div
              className="p-6 rounded-xl text-center"
              style={{
                backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 12%, transparent)`,
                border: `1px solid color-mix(in srgb, ${theme.primaryColor} 30%, transparent)`,
              }}
            >
              <CheckCircle2
                className="w-10 h-10 mx-auto mb-3"
                style={{ color: theme.primaryColor }}
              />
              <p
                className="text-sm font-medium mb-1"
                style={{ color: theme.headingColor }}
              >
                Message sent!
              </p>
              <p className="text-xs opacity-60" style={{ color: theme.bodyColor }}>
                We'll get back to you soon.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-xs underline opacity-70 hover:opacity-100 transition-opacity"
                style={{ color: theme.primaryColor }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              style={{
                maxWidth: `${Math.min(theme.maxWidth, 480)}px`,
                margin: "0 auto",
              }}
            >
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={{
                  borderColor: `color-mix(in srgb, ${theme.accentColor} 30%, transparent)`,
                  backgroundColor: theme.bgColor,
                  color: theme.bodyColor,
                }}
              />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email (optional)"
                style={{
                  borderColor: `color-mix(in srgb, ${theme.accentColor} 30%, transparent)`,
                  backgroundColor: theme.bgColor,
                  color: theme.bodyColor,
                }}
              />
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your message..."
                rows={4}
                required
                style={{
                  borderColor: `color-mix(in srgb, ${theme.accentColor} 30%, transparent)`,
                  backgroundColor: theme.bgColor,
                  color: theme.bodyColor,
                }}
              />
              {mutation.isError && (
                <p className="text-sm text-red-600">
                  {(mutation.error as Error)?.message}
                </p>
              )}
              <button
                type="submit"
                disabled={mutation.isPending || !message.trim()}
                className="w-full py-3.5 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  backgroundColor: theme.buttonBgColor,
                  color: theme.buttonTextColor,
                  borderRadius: `${theme.buttonRadius}px`,
                }}
              >
                {mutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
