import React from "react";
import { resolveTypography } from "../../lib/typography";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";
import type { Json } from "../../lib/supabase";

// ---- CoverPreview ----
interface CoverPreviewProps {
  eventName: unknown;
  eventDate: string | null;
  eventTime: string | null;
  venue: unknown;
  coverImage: string | null;
  coverConfig?: Json | null;
}

export function CoverPreview({
  eventName,
  eventDate,
  eventTime,
  venue,
  coverImage,
}: CoverPreviewProps) {
  const nameResolved = resolveTypography(eventName, "Our Wedding");
  const venueResolved = resolveTypography(venue, "Venue to be announced");

  return (
    <div className="event-themed min-h-[400px] flex flex-col items-center justify-center text-center relative overflow-hidden">
      {coverImage && (
        <div className="absolute inset-0">
          <img src={coverImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}
      <div className="relative z-10 px-6 py-12 max-w-2xl">
        <div className="guest-eyebrow text-white/80">We're getting married</div>
        <h1 className="guest-title text-white" style={nameResolved.style}>
          {nameResolved.text}
        </h1>
        <p className="guest-subtitle text-white/90" style={venueResolved.style}>
          {venueResolved.text}
        </p>
        {eventDate && (
          <p className="mt-4 text-white/80 text-sm">
            {formatDate(eventDate)}
            {eventTime && ` · ${formatTime12(eventTime)}`}
          </p>
        )}
      </div>
    </div>
  );
}

// ---- LoginPreview ----
interface LoginPreviewProps {
  eventName: unknown;
  loginMessage?: unknown;
}

export function LoginPreview({ eventName, loginMessage }: LoginPreviewProps) {
  const nameResolved = resolveTypography(eventName, "Our Wedding");
  const messageResolved = resolveTypography(loginMessage, "Please enter your email to view your invitation");

  return (
    <div className="event-themed min-h-[300px] flex items-center justify-center p-6">
      <div className="event-card max-w-md w-full text-center">
        <h2 className="guest-title mb-2" style={nameResolved.style}>
          {nameResolved.text}
        </h2>
        <p className="guest-subtitle mb-6" style={messageResolved.style}>
          {messageResolved.text}
        </p>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="your@email.com"
            className="event-input"
            readOnly
          />
          <button className="event-btn-primary w-full">View Invitation</button>
        </div>
      </div>
    </div>
  );
}

// ---- HomePreview ----
interface HomePreviewProps {
  eventName: unknown;
  eventDate: string | null;
  eventTime: string | null;
  venue: unknown;
  address: unknown;
  welcomeMessage?: unknown;
  coverImage?: string | null;
}

export function HomePreview({
  eventName,
  eventDate,
  eventTime,
  venue,
  address,
  welcomeMessage,
  coverImage,
}: HomePreviewProps) {
  const nameResolved = resolveTypography(eventName, "Our Wedding");
  const venueResolved = resolveTypography(venue, "Venue to be announced");
  const addressResolved = resolveTypography(address, "");
  const welcomeResolved = resolveTypography(welcomeMessage, "Welcome to our wedding website. We're so excited to celebrate with you!");
  const countdown = getCountdown(eventDate);

  return (
    <div className="event-themed">
      {coverImage && (
        <div className="h-48 overflow-hidden">
          <img src={coverImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <section className="guest-section text-center">
        <div className="guest-eyebrow">Save the date</div>
        <h1 className="guest-title mb-2" style={nameResolved.style}>
          {nameResolved.text}
        </h1>
        {eventDate && (
          <p className="text-lg mb-4" style={{ color: "var(--event-muted)" }}>
            {formatDate(eventDate)}
            {eventTime && ` · ${formatTime12(eventTime)}`}
          </p>
        )}
        {!countdown.expired && eventDate && (
          <div className="flex justify-center gap-4 mb-6">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Mins", value: countdown.minutes },
              { label: "Secs", value: countdown.seconds },
            ].map((item) => (
              <div key={item.label} className="event-info-card text-center px-3 py-2 min-w-[60px]">
                <div className="text-2xl font-bold" style={{ color: "var(--event-primary)" }}>
                  {item.value}
                </div>
                <div className="text-xs" style={{ color: "var(--event-muted)" }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="guest-section-tight text-center">
        <p className="guest-subtitle mx-auto" style={welcomeResolved.style}>
          {welcomeResolved.text}
        </p>
      </section>
      <section className="guest-section-tight">
        <div className="event-info-card max-w-md mx-auto text-center">
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--event-heading)" }}>
            {venueResolved.text}
          </h3>
          {addressResolved.text && (
            <p className="text-sm" style={{ color: "var(--event-muted)" }}>
              {addressResolved.text}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

// ---- RsvpPreview ----
interface RsvpPreviewProps {
  eventName: unknown;
  rsvpDeadline?: string | null;
}

export function RsvpPreview({ eventName, rsvpDeadline }: RsvpPreviewProps) {
  const nameResolved = resolveTypography(eventName, "Our Wedding");

  return (
    <div className="event-themed min-h-[300px] p-6">
      <section className="guest-section-tight text-center">
        <div className="guest-eyebrow">Kindly respond</div>
        <h2 className="guest-title mb-4" style={nameResolved.style}>
          {nameResolved.text}
        </h2>
        {rsvpDeadline && (
          <p className="guest-subtitle mx-auto mb-6">
            Please RSVP by {formatDate(rsvpDeadline)}
          </p>
        )}
        <div className="event-card max-w-md mx-auto text-left space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--event-heading)" }}>
              Will you attend?
            </label>
            <div className="flex gap-2">
              <button className="event-btn-primary flex-1">Joyfully Accept</button>
              <button className="event-btn-secondary flex-1">Regretfully Decline</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--event-heading)" }}>
              Number of guests
            </label>
            <select className="event-input" defaultValue="1">
              <option>1</option>
              <option>2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--event-heading)" }}>
              Dietary requirements
            </label>
            <textarea className="event-input" rows={2} placeholder="Any allergies or dietary needs?" readOnly />
          </div>
          <button className="event-btn-primary w-full">Submit RSVP</button>
        </div>
      </section>
    </div>
  );
}
