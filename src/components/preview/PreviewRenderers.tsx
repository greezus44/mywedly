import React from "react";
import type { UserEvent, Json } from "../../lib/supabase";
import { resolveTypography } from "../../lib/typography";
import { jsonToTheme } from "../../lib/theme";
import { EventThemeProvider } from "../../lib/theme-context";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12 } from "../../lib/utils";

export interface CoverConfig {
  eyebrow?: string | { text?: string; fontFamily?: string; fontSize?: number; fontWeight?: number; color?: string; align?: string; italic?: boolean; underline?: boolean };
  heading?: string | { text?: string; fontFamily?: string; fontSize?: number; fontWeight?: number; color?: string; align?: string; italic?: boolean; underline?: boolean };
  subheading?: string | { text?: string; fontFamily?: string; fontSize?: number; fontWeight?: number; color?: string; align?: string; italic?: boolean; underline?: boolean };
  bodyHtml?: string;
  ctaText?: string;
  overlayOpacity?: number;
  background?: {
    image?: string | null;
    color?: string;
    position?: string;
    fit?: string;
  };
}

export interface LogoConfig {
  url?: string | null;
  size?: number;
  align?: string;
}

interface CoverPreviewProps {
  event: UserEvent;
  theme?: Json | null;
  coverConfig?: CoverConfig;
  logoConfig?: LogoConfig;
  coverImage?: string | null;
}

export const CoverPreview: React.FC<CoverPreviewProps> = ({
  event,
  theme,
  coverConfig,
  logoConfig,
  coverImage,
}) => {
  const effectiveTheme = theme ?? event.theme;
  const effectiveCoverConfig = (coverConfig ?? (event.cover_config as CoverConfig | null)) ?? {};
  const effectiveLogoConfig = (logoConfig ?? (event.logo_config as LogoConfig | null)) ?? {};
  const effectiveCoverImage = coverImage ?? event.cover_image;

  const eyebrow = resolveTypography(effectiveCoverConfig.eyebrow, "You're Invited");
  const heading = resolveTypography(effectiveCoverConfig.heading, event.name || "Our Wedding");
  const subheading = resolveTypography(effectiveCoverConfig.subheading, "");

  const overlayOpacity = effectiveCoverConfig.overlayOpacity ?? 0.4;
  const bg = effectiveCoverConfig.background ?? {};
  const bgImage = bg.image ?? effectiveCoverImage;
  const bgPosition = bg.position ?? "center center";
  const bgFit = bg.fit ?? "cover";

  const logo = effectiveLogoConfig;
  const logoAlign = logo.align ?? "center";
  const logoSize = logo.size ?? 80;

  const ctaText = effectiveCoverConfig.ctaText ?? "View Invitation";

  const eventDate = event.event_date ? formatDate(event.event_date) : "";
  const eventTime = event.event_time ? formatTime12(event.event_time) : "";

  return (
    <EventThemeProvider theme={effectiveTheme}>
      <div
        className="relative flex min-h-[600px] flex-col items-center justify-center overflow-hidden px-6 py-16"
        style={{
          backgroundColor: bg.color || "var(--event-bg)",
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
          backgroundSize: bgFit,
          backgroundPosition: bgPosition,
        }}
      >
        {bgImage && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "black", opacity: overlayOpacity }}
          />
        )}

        {logo.url && (
          <div
            className="relative z-10 mb-8"
            style={{ textAlign: logoAlign as React.CSSProperties["textAlign"], width: "100%" }}
          >
            <img
              src={logo.url}
              alt="Event logo"
              style={{ width: `${logoSize}px`, height: "auto", margin: logoAlign === "center" ? "0 auto" : undefined }}
            />
          </div>
        )}

        <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
          {eyebrow.text && (
            <p
              className="guest-eyebrow mb-3"
              style={eyebrow.style}
            >
              {eyebrow.text}
            </p>
          )}

          <h1
            className="guest-title"
            style={heading.style}
          >
            {heading.text}
          </h1>

          {subheading.text && (
            <p
              className="guest-subtitle mt-2"
              style={subheading.style}
            >
              {subheading.text}
            </p>
          )}

          {(eventDate || eventTime) && (
            <div className="mt-6 flex items-center gap-3 text-sm" style={{ color: "var(--event-muted)" }}>
              {eventDate && <span>{eventDate}</span>}
              {eventDate && eventTime && <span>·</span>}
              {eventTime && <span>{eventTime}</span>}
            </div>
          )}

          {event.venue && (
            <p className="mt-2 text-sm" style={{ color: "var(--event-muted)" }}>
              {event.venue}
            </p>
          )}

          {effectiveCoverConfig.bodyHtml && (
            <div className="mt-6">
              <RichTextContent html={effectiveCoverConfig.bodyHtml} />
            </div>
          )}

          {ctaText && (
            <button
              type="button"
              className="event-btn-primary mt-8"
            >
              {ctaText}
            </button>
          )}
        </div>
      </div>
    </EventThemeProvider>
  );
};

export const LoginPreview: React.FC<{ event: UserEvent; theme?: Json | null }> = ({ event, theme }) => {
  const effectiveTheme = theme ?? event.theme;
  const loginConfig = (event.login_config as { heading?: string; body?: string; ctaText?: string } | null) ?? {};
  return (
    <EventThemeProvider theme={effectiveTheme}>
      <div className="guest-section flex min-h-[400px] flex-col items-center justify-center">
        <div className="event-card w-full max-w-md">
          <h2 className="guest-title text-center" style={{ fontSize: "1.5rem" }}>
            {resolveTypography(loginConfig.heading, "Enter Your Username").text}
          </h2>
          {loginConfig.body && (
            <p className="guest-subtitle mt-2 text-center">{loginConfig.body}</p>
          )}
          <div className="mt-6 space-y-3">
            <input
              type="text"
              placeholder="Your username"
              className="event-input"
              readOnly
            />
            <button type="button" className="event-btn-primary w-full">
              {loginConfig.ctaText ?? "Sign In"}
            </button>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
};

export const HomePreview: React.FC<{ event: UserEvent; theme?: Json | null }> = ({ event, theme }) => {
  const effectiveTheme = theme ?? event.theme;
  const content = (event.content as { intro?: string; body?: string } | null) ?? {};
  return (
    <EventThemeProvider theme={effectiveTheme}>
      <div className="guest-section">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="guest-title">{event.name}</h1>
          {content.intro && <p className="guest-subtitle mt-2">{content.intro}</p>}
          {content.body && (
            <div className="rich-content mt-6">
              <RichTextContent html={content.body} />
            </div>
          )}
          {event.event_date && (
            <p className="mt-6 text-sm" style={{ color: "var(--event-muted)" }}>
              {formatDate(event.event_date)}
            </p>
          )}
        </div>
      </div>
    </EventThemeProvider>
  );
};

export const RsvpPreview: React.FC<{ event: UserEvent; theme?: Json | null }> = ({ event, theme }) => {
  const effectiveTheme = theme ?? event.theme;
  return (
    <EventThemeProvider theme={effectiveTheme}>
      <div className="guest-section">
        <div className="mx-auto max-w-lg">
          <h1 className="guest-title text-center">RSVP</h1>
          <p className="guest-subtitle mt-2 text-center">
            Will you be joining us for {event.name}?
          </p>
          <div className="mt-6 flex gap-3">
            <button type="button" className="event-btn-primary flex-1">Joyfully Accepts</button>
            <button type="button" className="event-btn-secondary flex-1">Regretfully Declines</button>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
};
