import React from "react";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";
import type { UserEvent, SubEvent } from "../../lib/supabase";

export function CoverPreview({ event }: { event: Partial<UserEvent> }) {
  const coverConfig = (event.cover_config || {}) as Record<string, any>;
  const heroImage = event.cover_image;
  const title = event.name || "Your Event Title";
  const subtitle = coverConfig.subtitle || "";

  return (
    <div className="relative min-h-[400px] rounded-lg overflow-hidden bg-event-bg">
      {heroImage ? (
        <div className="absolute inset-0">
          <img src={heroImage} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-event-bg to-event-surface" />
      )}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <h1 className="font-event text-3xl md:text-4xl text-white drop-shadow-lg mb-2">{title}</h1>
        {subtitle && <p className="font-event-body text-lg text-white/90 drop-shadow">{subtitle}</p>}
        {event.event_date && (
          <p className="font-event-body text-sm text-white/80 mt-3">{formatDate(event.event_date)}</p>
        )}
      </div>
    </div>
  );
}

export function LoginPreview({ event }: { event: Partial<UserEvent> }) {
  const loginConfig = (event.login_config || {}) as Record<string, any>;
  const hasPassword = loginConfig.passwordMode && loginConfig.passwordMode !== "none";

  return (
    <div className="event-themed min-h-[300px] rounded-lg p-8 flex flex-col items-center justify-center">
      <h2 className="font-event text-xl text-event-heading mb-4">Enter your username to continue</h2>
      <div className="w-full max-w-xs space-y-3">
        <input
          type="text"
          placeholder="Enter your username"
          className="event-input"
          disabled
        />
        {hasPassword && (
          <input
            type="password"
            placeholder="Enter password"
            className="event-input"
            disabled
          />
        )}
        <button className="event-btn-primary w-full" disabled>Enter</button>
      </div>
    </div>
  );
}

export function HomePreview({ event }: { event: Partial<UserEvent> }) {
  const content = (event.content || {}) as Record<string, any>;
  const countdown = getCountdown(event.event_date);

  return (
    <div className="event-themed min-h-[300px] rounded-lg p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-event text-2xl text-event-heading mb-4 text-center">{event.name}</h1>
        {!countdown.isPast && event.event_date && (
          <div className="flex justify-center gap-4 mb-6">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Min", value: countdown.minutes },
              { label: "Sec", value: countdown.seconds },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-2xl font-bold text-event-primary">{item.value}</div>
                <div className="text-xs text-event-muted">{item.label}</div>
              </div>
            ))}
          </div>
        )}
        {content.section1 && <RichTextContent html={content.section1} className="mb-4" />}
        {content.section2 && <RichTextContent html={content.section2} className="mb-4" />}
        {content.section3 && <RichTextContent html={content.section3} />}
      </div>
    </div>
  );
}

export function RsvpPreview({ event }: { event: Partial<UserEvent> }) {
  return (
    <div className="event-themed min-h-[300px] rounded-lg p-8">
      <div className="max-w-md mx-auto">
        <h2 className="font-event text-xl text-event-heading mb-4 text-center">RSVP</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button className="event-btn-primary flex-1" disabled>Attending</button>
            <button className="event-btn-secondary flex-1" disabled>Not Attending</button>
          </div>
          <textarea placeholder="Message" className="event-input" rows={3} disabled />
          <button className="event-btn-primary w-full" disabled>Submit RSVP</button>
        </div>
      </div>
    </div>
  );
}
