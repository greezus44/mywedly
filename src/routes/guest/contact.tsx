import { useOutletContext, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDate, formatTime } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { MapPin, Calendar, Clock, Send, Mail } from "lucide-react";
import type { FormEvent } from "react";
import type { GuestLayoutContext } from "./guest-layout";

export default function Contact() {
  const { eventId } = useParams<{ eventId: string }>();
  const { event } = useOutletContext<GuestLayoutContext>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const theme = event.theme;

  const [name, setName] = useState(guestName || "");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const mapsUrl = event.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`
    : null;

  const submitMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) throw new Error("Event not found");
      const payload = {
        event_id: eventId,
        guest_name: name.trim() || guestName || "Anonymous",
        message: message.trim(),
      };
      const { error } = await supabase.from("event_messages").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["event-messages", eventId] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submitMutation.mutate();
  };

  return (
    <div className="min-h-screen px-6 py-12" style={{ backgroundColor: theme.bgColor, color: theme.bodyColor, fontFamily: theme.bodyFont }}>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${theme.accentColor}20` }}
          >
            <MapPin className="w-7 h-7" style={{ color: theme.primaryColor }} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: theme.headingFont, color: theme.headingColor }}>
            Contact & Venue
          </h1>
          <p className="text-sm opacity-70" style={{ color: theme.bodyColor }}>
            Event details and how to reach us
          </p>
        </div>

        <div className="p-6 mb-8 bg-white border rounded-xl" style={{ borderColor: `${theme.accentColor}30`, backgroundColor: theme.bgColor }}>
          <div className="space-y-5">
            {event.event_date && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-50" style={{ color: theme.accentColor }} />
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-50 mb-1" style={{ color: theme.bodyColor }}>
                    Date
                  </p>
                  <p className="text-sm font-medium" style={{ color: theme.headingColor }}>
                    {formatDate(event.event_date)}
                  </p>
                </div>
              </div>
            )}

            {event.event_time && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-50" style={{ color: theme.accentColor }} />
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-50 mb-1" style={{ color: theme.bodyColor }}>
                    Time
                  </p>
                  <p className="text-sm font-medium" style={{ color: theme.headingColor }}>
                    {formatTime(event.event_time)}
                  </p>
                </div>
              </div>
            )}

            {event.venue && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-50" style={{ color: theme.accentColor }} />
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-50 mb-1" style={{ color: theme.bodyColor }}>
                    Venue
                  </p>
                  <p className="text-sm font-medium" style={{ color: theme.headingColor }}>
                    {event.venue}
                  </p>
                </div>
              </div>
            )}

            {event.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-0" style={{ color: theme.accentColor }} />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider opacity-50 mb-1" style={{ color: theme.bodyColor }}>
                    Address
                  </p>
                  <p className="text-sm mb-2" style={{ color: theme.bodyColor }}>
                    {event.address}
                  </p>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                      style={{ color: theme.primaryColor }}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      View on Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: theme.headingFont, color: theme.headingColor }}>
            Send a Message
          </h2>
          <div className="p-5 bg-white border rounded-xl" style={{ borderColor: `${theme.accentColor}30`, backgroundColor: theme.bgColor }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.headingColor }}>
                  Your Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  style={{
                    borderColor: `${theme.accentColor}30`,
                    color: theme.bodyColor,
                    backgroundColor: theme.bgColor,
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.headingColor }}>
                  Email {`(optional)`}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    borderColor: `${theme.accentColor}30`,
                    color: theme.bodyColor,
                    backgroundColor: theme.bgColor,
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.headingColor }}>
                  Message
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your message..."
                  rows={4}
                  required
                  style={{
                    borderColor: `${theme.accentColor}30`,
                    color: theme.bodyColor,
                    backgroundColor: theme.bgColor,
                  }}
                />
              </div>

              {(submitMutation as any).error && (
                <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
                  {(submitMutation as any).error.message || "Could not send message."}
                </div>
              )}

              {submitMutation.isSuccess && !submitMutation.isPending && (
                <div className="px-3 py-2 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: `${theme.accentColor}15`, color: theme.primaryColor }}>
                  <Mail className="w-4 h-4" />
                  Message sent successfully!
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                loading={submitMutation.isPending}
                disabled={!message.trim()}
                className="w-full"
                style={{
                  backgroundColor: theme.buttonBgColor,
                  color: theme.buttonTextColor,
                  borderRadius: `${theme.buttonRadius}px`,
                }}
              >
                <Send className="w-4 h-4" />
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
