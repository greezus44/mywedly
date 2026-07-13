import { useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card } from "../../components/ui/index";
import { formatDate, formatTime } from "../../lib/utils";
import { Calendar, Clock, MapPin, ExternalLink } from "lucide-react";
import type { FormEvent } from "react";
import type { GuestLayoutContext } from "./guest-layout";

export default function Contact() {
  const { eventId } = useParams<{ eventId: string }>();
  const outletCtx = useOutletContext<GuestLayoutContext | null>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState(guestName || "");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fallbackQuery = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    enabled: !!eventId && !outletCtx?.event,
    queryFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  const event = outletCtx?.event || fallbackQuery.data || null;

  const mutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId || !name.trim() || !message.trim()) throw new Error("Missing fields");
      const { error } = await supabase.from("event_messages").insert({
        event_id: eventId,
        guest_name: name.trim(),
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      setSubmitSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["guest-messages", eventId] });
      setTimeout(() => setSubmitSuccess(false), 5000);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !name.trim()) return;
    mutation.mutate();
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-slate-500">Event details unavailable.</p>
      </div>
    );
  }

  const eventDate = event.event_date || event.draft_event_date || null;
  const eventTime = event.event_time || event.draft_event_time || null;
  const venue = event.venue || event.draft_venue || null;
  const address = event.address || event.draft_address || null;

  const mapsLink = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue || ""} ${address}`.trim())}`
    : null;

  return (
    <div className="animate-fade-in px-6 py-10 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-light mb-2" style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>
          Contact
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Event details and how to reach us
        </p>
      </div>

      <div className="space-y-4 mb-12">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 mt-0.5" style={{ color: "var(--color-accent)" }} />
            <div>
              <p className="text-xs tracking-[0.15em] uppercase mb-1" style={{ color: "var(--color-text-muted)" }}>
                Date
              </p>
              <p className="text-base" style={{ color: "var(--color-text)" }}>
                {eventDate ? formatDate(eventDate) : "To be announced"}
              </p>
            </div>
          </div>
        </Card>

        {eventTime && (
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 mt-0.5" style={{ color: "var(--color-accent)" }} />
              <div>
                <p className="text-xs tracking-[0.15em] uppercase mb-1" style={{ color: "var(--color-text-muted)" }}>
                  Time
                </p>
                <p className="text-base" style={{ color: "var(--color-text)" }}>
                  {formatTime(eventTime)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {venue && (
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-0.5" style={{ color: "var(--color-accent)" }} />
              <div className="flex-1">
                <p className="text-xs tracking-[0.15em] uppercase mb-1" style={{ color: "var(--color-text-muted)" }}>
                  Venue
                </p>
                <p className="text-base" style={{ color: "var(--color-text)" }}>
                  {venue}
                </p>
                {address && (
                  <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                    {address}
                  </p>
                )}
                {mapsLink && (
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm mt-2 hover:underline"
                    style={{ color: "var(--color-accent)" }}
                  >
                    View on Google Maps
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      <section>
        <h2 className="text-xl font-light tracking-wide text-center mb-6" style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>
          Send a Message
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
              Your Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
              Email (optional)
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
              Message
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              required
              rows={5}
            />
          </div>

          {submitSuccess && (
            <div
              className="text-center py-4 px-4 rounded-lg border animate-fade-in"
              style={{ backgroundColor: "var(--color-bg-subtle)", borderColor: "var(--color-primary)" }}
            >
              <p className="text-lg" style={{ color: "var(--color-primary)" }}>
                Thank you! Your message has been sent.
              </p>
            </div>
          )}

          {(mutation as any).error && (
            <div
              className="text-center py-4 px-4 rounded-lg border"
              style={{ backgroundColor: "var(--color-bg-subtle)", borderColor: "#dc2626" }}
            >
              <p className="text-sm" style={{ color: "#dc2626" }}>
                Failed to send message. Please try again.
              </p>
            </div>
          )}

          <div className="text-center pt-2">
            <Button
              type="submit"
              disabled={!message.trim() || !name.trim() || mutation.isPending}
              loading={mutation.isPending}
              size="lg"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-bg)" }}
            >
              {mutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
