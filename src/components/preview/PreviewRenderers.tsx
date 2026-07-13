import React from "react";
import type { UserEvent, CoverConfig, LoginConfig, ThemeConfig, EventContent } from "../../lib/supabase";
import { themeToEventCssVars } from "../../lib/theme";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";
import { RichTextContent } from "../../lib/sanitize";

/* ── Helpers ─────────────────────────────────────── */

function getDraft<T>(draft: T | null | undefined, published: T | null | undefined): T | null {
  return draft != null ? draft : published != null ? published : null;
}

function getTheme(event: UserEvent): ThemeConfig | null {
  return getDraft<ThemeConfig>(event.draft_theme, event.theme);
}

function getCoverConfig(event: UserEvent): CoverConfig | null {
  return getDraft<CoverConfig>(event.draft_cover_config, event.cover_config);
}

function getLoginConfig(event: UserEvent): LoginConfig | null {
  return getDraft<LoginConfig>(event.draft_login_config, event.login_config);
}

function getContent(event: UserEvent): EventContent | null {
  return getDraft<EventContent>(event.draft_content, event.content);
}

function getCoverImage(event: UserEvent): string | null {
  return getDraft<string>(event.draft_cover_image, event.cover_image);
}

function getEventName(event: UserEvent): string {
  return getDraft<string>(event.draft_name, event.name) || "Our Event";
}

function getEventType(event: UserEvent): string {
  return getDraft<string>(event.draft_event_type, event.event_type) || "Event";
}

function getEventDate(event: UserEvent): string | null {
  return getDraft<string>(event.draft_event_date, event.event_date);
}

function getEventTime(event: UserEvent): string | null {
  return getDraft<string>(event.draft_event_time, event.event_time);
}

function getVenue(event: UserEvent): string | null {
  return getDraft<string>(event.draft_venue, event.venue);
}

function getAddress(event: UserEvent): string | null {
  return getDraft<string>(event.draft_address, event.address);
}

function themedStyle(event: UserEvent): React.CSSProperties {
  return themeToEventCssVars(getTheme(event)) as React.CSSProperties;
}

/* ── CoverPreview ─────────────────────────────────── */

export function CoverPreview({ event }: { event: UserEvent }) {
  const config = getCoverConfig(event);
  const image = getCoverImage(event);
  const name = getEventName(event);
  const date = getEventDate(event);
  const eventType = getEventType(event);

  const bgImage = config?.bgImage || image;
  const bgColor = config?.bgColor || "#1a1a2e";
  const overlayColor = config?.overlayColor || "#000000";
  const overlayOpacity = config?.overlayOpacity ?? 0.3;
  const textColor = config?.textColor || "#ffffff";
  const buttonColor = config?.buttonColor || "#ffffff";
  const buttonText = config?.buttonText || "Enter";
  const headingFont = config?.font || "Cormorant Garamond";
  const scriptFont = config?.scriptFont || "Dancing Script";
  const showDate = config?.showDate ?? true;
  const showCountdown = config?.showCountdown ?? false;

  const countdown = getCountdown(date);

  const containerStyle: React.CSSProperties = {
    ...themedStyle(event),
    backgroundImage: bgImage ? `url(${bgImage})` : undefined,
    backgroundColor: bgColor,
    color: textColor,
  };

  const overlayStyle: React.CSSProperties = {
    backgroundColor: overlayColor,
    opacity: overlayOpacity,
  };

  return (
    <div
      className="event-themed relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden p-8 text-center"
      style={containerStyle}
    >
      <div className="absolute inset-0" style={overlayStyle} />

      <div className="relative z-10 flex flex-col items-center gap-4">
        {config?.logo && (
          <img
            src={config.logo}
            alt="Logo"
            style={{ width: config.logoWidth || 120 }}
            className="mb-2 max-w-[60%] object-contain"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        )}

        <p
          className="text-sm uppercase tracking-[0.3em] opacity-80"
          style={{ fontFamily: `"${scriptFont}", cursive` }}
        >
          {eventType}
        </p>

        <h1
          className="text-4xl font-semibold md:text-5xl"
          style={{ fontFamily: `"${headingFont}", serif` }}
        >
          {name}
        </h1>

        {showDate && date && (
          <p
            className="text-lg opacity-90"
            style={{ fontFamily: `"${headingFont}", serif` }}
          >
            {formatDate(date)}
          </p>
        )}

        {showCountdown && !countdown.isPast && (
          <div className="mt-2 flex gap-4 text-center">
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <div key={unit} className="flex flex-col">
                <span className="text-2xl font-semibold">
                  {countdown[unit]}
                </span>
                <span className="text-[10px] uppercase tracking-wider opacity-70">
                  {unit}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          className="mt-4 rounded px-8 py-3 text-sm font-medium uppercase tracking-wider transition-opacity hover:opacity-90"
          style={{
            backgroundColor: buttonColor,
            color: textColor,
            borderRadius: "var(--event-button-radius, 6px)",
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

/* ── LoginPreview ─────────────────────────────────── */

export function LoginPreview({ event }: { event: UserEvent }) {
  const config = getLoginConfig(event);
  const name = getEventName(event);
  const eventType = getEventType(event);

  const bgImage = config?.bgImage;
  const bgColor = config?.bgColor || "#1a1a2e";
  const overlayColor = config?.overlayColor || "#000000";
  const overlayOpacity = config?.overlayOpacity ?? 0.2;
  const textColor = config?.textColor || "#ffffff";
  const buttonColor = config?.buttonColor || "#ffffff";
  const buttonText = config?.buttonText || "Continue";
  const heading = config?.heading || `Welcome to ${name}`;
  const subheading = config?.subheading || "Please enter your name to continue";
  const inputPlaceholder = config?.inputPlaceholder || "Your full name";

  const containerStyle: React.CSSProperties = {
    ...themedStyle(event),
    backgroundImage: bgImage ? `url(${bgImage})` : undefined,
    backgroundColor: bgColor,
    color: textColor,
  };

  const overlayStyle: React.CSSProperties = {
    backgroundColor: overlayColor,
    opacity: overlayOpacity,
  };

  return (
    <div
      className="event-themed relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden p-8 text-center"
      style={containerStyle}
    >
      <div className="absolute inset-0" style={overlayStyle} />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-4">
        {config?.logo && (
          <img
            src={config.logo}
            alt="Logo"
            style={{ width: config.logoWidth || 100 }}
            className="mb-2 max-w-[60%] object-contain"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        )}

        <h2
          className="text-3xl font-semibold"
          style={{ fontFamily: "var(--event-heading-font)" }}
        >
          {heading}
        </h2>

        <p className="text-sm opacity-80">{subheading}</p>

        <input
          type="text"
          placeholder={inputPlaceholder}
          className="w-full rounded-md border px-4 py-3 text-center text-sm text-gray-900 placeholder:text-gray-400"
          style={{ borderColor: "rgba(255,255,255,0.3)" }}
          readOnly
        />

        <button
          className="w-full rounded px-6 py-3 text-sm font-medium uppercase tracking-wider transition-opacity hover:opacity-90"
          style={{
            backgroundColor: buttonColor,
            color: textColor,
            borderRadius: "var(--event-button-radius, 6px)",
          }}
        >
          {buttonText}
        </button>

        <p className="text-xs opacity-60">{eventType}</p>
      </div>
    </div>
  );
}

/* ── HomePreview ──────────────────────────────────── */

export function HomePreview({ event }: { event: UserEvent }) {
  const content = getContent(event);
  const name = getEventName(event);
  const date = getEventDate(event);
  const time = getEventTime(event);
  const venue = getVenue(event);
  const address = getAddress(event);
  const eventType = getEventType(event);

  const invitationTitle = content?.invitation_title || "You're Invited";
  const invitationSubtitle = content?.invitation_subtitle || "";
  const invitationBody = content?.invitation_body || "";
  const invitationText = content?.invitation_text || "";
  const rsvpButtonText = content?.rsvp_button_text || "RSVP";
  const story = content?.story || "";
  const storyImage = content?.story_image || null;
  const sections = content?.sections || [];

  return (
    <div
      className="event-themed flex flex-col items-center"
      style={themedStyle(event)}
    >
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

        {content?.rich_title && (
          <RichTextContent
            html={content.rich_title}
            className="text-3xl font-semibold"
          />
        )}

        {content?.rich_subtitle && (
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

        {content?.rich_body && (
          <RichTextContent
            html={content.rich_body}
            className="mt-4 max-w-2xl text-left"
          />
        )}
      </div>

      {/* Invitation section */}
      <div className="flex w-full flex-col items-center gap-4 border-t px-6 py-12 text-center" style={{ borderColor: "var(--event-border)" }}>
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

        {invitationText && (
          <RichTextContent
            html={invitationText}
            className="max-w-xl text-left text-sm"
          />
        )}

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
      </div>

      {/* Story section */}
      {story && (
        <div className="flex w-full flex-col items-center gap-4 border-t px-6 py-12" style={{ borderColor: "var(--event-border)" }}>
          <h2
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--event-heading-font)" }}
          >
            Our Story
          </h2>
          {storyImage && (
            <img
              src={storyImage}
              alt="Story"
              className="max-w-md rounded-lg"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
          )}
          <RichTextContent
            html={story}
            className="max-w-xl text-left text-sm opacity-80"
          />
        </div>
      )}

      {/* Content sections */}
      {sections.length > 0 && (
        <div className="flex w-full flex-col gap-8 border-t px-6 py-12" style={{ borderColor: "var(--event-border)" }}>
          {sections
            .filter((s) => s.visible)
            .sort((a, b) => a.order_index - b.order_index)
            .map((section) => (
              <div key={section.id} className="flex flex-col gap-3">
                <h3
                  className="text-xl font-semibold"
                  style={{ fontFamily: "var(--event-heading-font)" }}
                >
                  {section.title}
                </h3>
                {section.image && (
                  <img
                    src={section.image}
                    alt={section.title}
                    className="max-w-md rounded-lg"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                )}
                <RichTextContent
                  html={section.body}
                  className="text-left text-sm opacity-80"
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

/* ── RsvpPreview ──────────────────────────────────── */

export function RsvpPreview({ event }: { event: UserEvent }) {
  const content = getContent(event);
  const name = getEventName(event);
  const date = getEventDate(event);
  const venue = getVenue(event);

  const rsvpButtonText = content?.rsvp_button_text || "Submit RSVP";

  return (
    <div
      className="event-themed flex min-h-[400px] flex-col items-center px-6 py-12"
      style={themedStyle(event)}
    >
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="text-center">
          <h1
            className="text-3xl font-semibold"
            style={{ fontFamily: "var(--event-heading-font)" }}
          >
            RSVP
          </h1>
          <p className="mt-1 text-sm opacity-70">
            {name}
          </p>
          {date && (
            <p className="text-xs opacity-60">
              {formatDate(date)}
            </p>
          )}
          {venue && (
            <p className="text-xs opacity-60">{venue}</p>
          )}
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--event-text)" }}>
            Full Name
          </label>
          <input
            type="text"
            readOnly
            placeholder="Your name"
            className="rounded-md border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--event-border)",
              backgroundColor: "var(--event-surface)",
              color: "var(--event-text)",
            }}
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" style={{ color: "var(--event-text)" }}>
            Will you attend?
          </label>
          <div className="flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm" style={{ borderColor: "var(--event-border)" }}>
              <input type="radio" name="rsvp-status" readOnly />
              <span>Joyfully Accepts</span>
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm" style={{ borderColor: "var(--event-border)" }}>
              <input type="radio" name="rsvp-status" readOnly />
              <span>Regretfully Declines</span>
            </label>
          </div>
        </div>

        {/* Plus ones */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--event-text)" }}>
            Number of Guests
          </label>
          <input
            type="number"
            readOnly
            defaultValue={0}
            className="rounded-md border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--event-border)",
              backgroundColor: "var(--event-surface)",
              color: "var(--event-text)",
            }}
          />
        </div>

        {/* Dietary */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--event-text)" }}>
            Dietary Requirements
          </label>
          <textarea
            readOnly
            placeholder="Any dietary restrictions?"
            className="min-h-[80px] rounded-md border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--event-border)",
              backgroundColor: "var(--event-surface)",
              color: "var(--event-text)",
            }}
          />
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--event-text)" }}>
            Message
          </label>
          <textarea
            readOnly
            placeholder="Leave a message for the host…"
            className="min-h-[80px] rounded-md border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--event-border)",
              backgroundColor: "var(--event-surface)",
              color: "var(--event-text)",
            }}
          />
        </div>

        <button
          className="rounded px-6 py-3 text-sm font-medium uppercase tracking-wider transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--event-primary)",
            color: "var(--event-bg)",
            borderRadius: "var(--event-button-radius, 6px)",
          }}
        >
          {rsvpButtonText}
        </button>
      </div>
    </div>
  );
}
