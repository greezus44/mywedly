import React from "react";
import { cn } from "../../lib/utils";
import { resolveTypography } from "../../lib/typography";
import type { Json } from "../../lib/supabase";

// ── Cover Preview ──────────────────────────────────────────────

interface CoverPreviewProps {
  config: Json | null | undefined;
  className?: string;
}

export function CoverPreview({ config, className }: CoverPreviewProps) {
  const cfg = (config ?? {}) as Record<string, unknown>;
  const title = resolveTypography(cfg.title, "Our Wedding");
  const subtitle = resolveTypography(cfg.subtitle, "We're getting married");
  const date = resolveTypography(cfg.date, "December 31, 2025");
  const venue = resolveTypography(cfg.venue, "Garden Venue");
  const coverImage = cfg.coverImage as string | undefined;

  return (
    <div className={cn("event-themed relative overflow-hidden", className)}>
      {coverImage && (
        <div className="absolute inset-0">
          <img src={coverImage} alt="Cover" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}
      <div className="relative flex flex-col items-center justify-center text-center py-20 px-6 min-h-[300px]">
        <p className="guest-eyebrow" style={subtitle.style}>
          {subtitle.text}
        </p>
        <h1 className="guest-title" style={title.style}>
          {title.text}
        </h1>
        <p className="guest-subtitle" style={date.style}>
          {date.text}
        </p>
        {venue.text && (
          <p className="guest-subtitle mt-2" style={venue.style}>
            {venue.text}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Login Preview ──────────────────────────────────────────────

interface LoginPreviewProps {
  config: Json | null | undefined;
  className?: string;
}

export function LoginPreview({ config, className }: LoginPreviewProps) {
  const cfg = (config ?? {}) as Record<string, unknown>;
  const heading = resolveTypography(cfg.heading, "Welcome");
  const subheading = resolveTypography(cfg.subheading, "Enter your username to view the invitation");
  const placeholder = (cfg.placeholder as string) ?? "Your username";
  const ctaText = (cfg.ctaText as string) ?? "View Invitation";

  return (
    <div className={cn("event-themed", className)}>
      <div className="guest-section-tight flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <h2 className="guest-title" style={heading.style}>
          {heading.text}
        </h2>
        <p className="guest-subtitle mb-6" style={subheading.style}>
          {subheading.text}
        </p>
        <input
          type="text"
          placeholder={placeholder}
          className="event-input mb-4"
          disabled
        />
        <button className="event-btn-primary" disabled>
          {ctaText}
        </button>
      </div>
    </div>
  );
}

// ── Home Preview ───────────────────────────────────────────────

interface HomePreviewProps {
  config: Json | null | undefined;
  className?: string;
}

export function HomePreview({ config, className }: HomePreviewProps) {
  const cfg = (config ?? {}) as Record<string, unknown>;
  const welcome = resolveTypography(cfg.welcome, "Welcome to our wedding");
  const intro = resolveTypography(cfg.intro, "We invite you to celebrate with us on our special day.");
  const sections = (cfg.sections as Json[] | undefined) ?? [];

  return (
    <div className={cn("event-themed", className)}>
      <div className="guest-section">
        <div className="text-center mb-8">
          <p className="guest-eyebrow">Welcome</p>
          <h2 className="guest-title" style={welcome.style}>
            {welcome.text}
          </h2>
          <p className="guest-subtitle mx-auto" style={intro.style}>
            {intro.text}
          </p>
        </div>
        {sections.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {sections.map((sec, i) => {
              const section = sec as Record<string, unknown>;
              const title = resolveTypography(section.title, `Section ${i + 1}`);
              const body = resolveTypography(section.body, "");
              return (
                <div key={i} className="event-info-card event-card-hover">
                  <h3 className="text-lg font-semibold mb-2" style={title.style}>
                    {title.text}
                  </h3>
                  {body.text && (
                    <p className="text-sm" style={body.style}>
                      {body.text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── RSVP Preview ───────────────────────────────────────────────

interface RsvpPreviewProps {
  config: Json | null | undefined;
  className?: string;
}

export function RsvpPreview({ config, className }: RsvpPreviewProps) {
  const cfg = (config ?? {}) as Record<string, unknown>;
  const heading = resolveTypography(cfg.heading, "RSVP");
  const subheading = resolveTypography(cfg.subheading, "Will you be attending?");
  const showPlusOnes = cfg.showPlusOnes !== false;
  const showDietary = cfg.showDietary !== false;
  const showMessage = cfg.showMessage !== false;
  const ctaText = (cfg.ctaText as string) ?? "Submit RSVP";

  return (
    <div className={cn("event-themed", className)}>
      <div className="guest-section-tight max-w-lg mx-auto">
        <div className="text-center mb-6">
          <p className="guest-eyebrow">RSVP</p>
          <h2 className="guest-title" style={heading.style}>
            {heading.text}
          </h2>
          <p className="guest-subtitle mx-auto" style={subheading.style}>
            {subheading.text}
          </p>
        </div>
        <div className="event-card space-y-4">
          <div className="flex gap-2">
            <button className="event-btn-primary flex-1">Yes, I'll attend</button>
            <button className="event-btn-secondary flex-1">Can't make it</button>
          </div>
          {showPlusOnes && (
            <div>
              <label className="block text-sm font-medium mb-1">Plus ones</label>
              <input type="number" className="event-input" disabled placeholder="0" />
            </div>
          )}
          {showDietary && (
            <div>
              <label className="block text-sm font-medium mb-1">Dietary requirements</label>
              <input type="text" className="event-input" disabled placeholder="Any allergies or preferences?" />
            </div>
          )}
          {showMessage && (
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea className="event-input" disabled placeholder="Leave a message for the couple" rows={3} />
            </div>
          )}
          <button className="event-btn-primary w-full" disabled>
            {ctaText}
          </button>
        </div>
      </div>
    </div>
  );
}
