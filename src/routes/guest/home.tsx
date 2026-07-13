import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";
import { RichTextContent } from "../../lib/sanitize";

export default function GuestHomePage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const content = event.content || {};

  const name = event.name || "Our Event";
  const eventType = event.event_type || "Event";
  const date = event.event_date;
  const time = event.event_time;
  const venue = event.venue;
  const address = event.address;

  const invitationTitle = content.invitation_title || "You're Invited";
  const invitationSubtitle = content.invitation_subtitle || "";
  const invitationBody = content.invitation_body || "";
  const rsvpButtonText = content.rsvp_button_text || "RSVP";

  const countdown = getCountdown(date);

  // Live countdown timer
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!date || countdown.isPast) return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [date, countdown.isPast]);

  return (
    <div className="event-themed flex min-h-screen flex-col items-center">
      {/* Hero section */}
      <div className="flex w-full flex-col items-center gap-4 px-6 py-16 text-center">
        <p
          className="text-sm uppercase tracking-[0.3em] opacity-70"
          style={{ fontFamily: "var(--event-script-font)" }}
        >
          {eventType}
        </p>

        <h1
          className="text-4xl font-semibold md:text-5xl"
          style={{ fontFamily: "var(--event-heading-font)" }}
        >
          {name}
        </h1>

        {content.rich_title && (
          <RichTextContent
            html={content.rich_title}
            className="text-3xl font-semibold"
          />
        )}

        {content.rich_subtitle && (
          <RichTextContent
            html={content.rich_subtitle}
            className="text-lg opacity-80"
          />
        )}

        {date && (
          <p
            className="text-lg opacity-90"
            style={{ fontFamily: "var(--event-heading-font)" }}
          >
            {formatDate(date)}
            {time ? ` at ${formatTime12(time)}` : ""}
          </p>
        )}

        {venue && (
          <p className="text-sm opacity-70">
            {venue}
            {address ? `, ${address}` : ""}
          </p>
        )}

        {/* Countdown */}
        {date && !countdown.isPast && (
          <div className="mt-4 flex gap-6 text-center">
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <div key={unit} className="flex flex-col">
                <span
                  className="text-3xl font-semibold"
                  style={{ fontFamily: "var(--event-heading-font)" }}
                >
                  {countdown[unit]}
                </span>
                <span className="text-[10px] uppercase tracking-wider opacity-60">
                  {unit}
                </span>
              </div>
            ))}
          </div>
        )}

        {content.rich_body && (
          <RichTextContent
            html={content.rich_body}
            className="mt-4 max-w-2xl text-left"
          />
        )}
      </div>

      {/* Invitation section */}
      <div
        className="flex w-full flex-col items-center gap-4 border-t px-6 py-12 text-center"
        style={{ borderColor: "var(--event-border)" }}
      >
        <h2
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--event-heading-font)" }}
        >
          {invitationTitle}
        </h2>

        {invitationSubtitle && (
          <p className="text-sm opacity-80">{invitationSubtitle}</p>
        )}

        {invitationBody && (
          <p className="max-w-xl text-sm opacity-70">{invitationBody}</p>
        )}

        <Link to="rsvp">
          <button
            className="mt-4 rounded px-8 py-3 text-sm font-medium uppercase tracking-wider transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--event-primary)",
              color: "var(--event-bg)",
              borderRadius: "var(--event-button-radius, 6px)",
            }}
          >
            {rsvpButtonText}
          </button>
        </Link>
      </div>

      {/* Links */}
      <div
        className="flex w-full flex-wrap items-center justify-center gap-4 border-t px-6 py-8"
        style={{ borderColor: "var(--event-border)" }}
      >
        <Link
          to="rsvp"
          className="text-sm underline opacity-70 hover:opacity-100"
          style={{ color: "var(--event-text)" }}
        >
          RSVP
        </Link>
        <Link
          to="wishes"
          className="text-sm underline opacity-70 hover:opacity-100"
          style={{ color: "var(--event-text)" }}
        >
          Leave a Wish
        </Link>
        <Link
          to="contact"
          className="text-sm underline opacity-70 hover:opacity-100"
          style={{ color: "var(--event-text)" }}
        >
          Contact & Venue
        </Link>
      </div>
    </div>
  );
}
