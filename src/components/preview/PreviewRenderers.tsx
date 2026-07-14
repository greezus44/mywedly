import React from "react";
import type { Json, UserEvent } from "../../lib/supabase";
import { resolveTypography } from "../../lib/typography";
import { jsonToTheme } from "../../lib/theme";
import { EventThemeProvider } from "../../lib/theme-context";
import { RichTextContent } from "../../lib/sanitize";
import { cn } from "../../lib/utils";

export interface CoverConfig {
  eyebrow?: unknown;
  heading?: unknown;
  subheading?: unknown;
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

export function CoverPreview({
  event,
  theme,
  coverConfig,
  logoConfig,
  coverImage,
}: CoverPreviewProps) {
  const config: CoverConfig = coverConfig ?? {};
  const logo: LogoConfig = logoConfig ?? {};

  const eyebrow = resolveTypography(config.eyebrow, "");
  const heading = resolveTypography(config.heading, event.name || "Event Title");
  const subheading = resolveTypography(config.subheading, "");

  const bgImage = coverImage ?? config.background?.image ?? null;
  const bgColor = config.background?.color ?? null;
  const bgPosition = config.background?.position ?? "center center";
  const bgFit = config.background?.fit ?? "cover";
  const overlayOpacity = config.overlayOpacity ?? 0.4;

  const logoUrl = logo.url ?? null;
  const logoSize = logo.size ?? 80;
  const logoAlign = logo.align ?? "center";

  const alignClass =
    logoAlign === "left" ? "justify-start" : logoAlign === "right" ? "justify-end" : "justify-center";

  return (
    <EventThemeProvider theme={theme}>
      <div
        className="relative flex min-h-[420px] flex-col items-center overflow-hidden px-6 py-12"
        style={{
          background: bgImage
            ? `url(${bgImage}) ${bgPosition} / ${bgFit} no-repeat`
            : bgColor || "var(--event-bg)",
        }}
      >
        {/* Overlay */}
        {bgImage && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0)", opacity: overlayOpacity, background: `rgba(0,0,0,${overlayOpacity})` }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
          {/* Logo — NO background, NO padding, NO border, NO shadow, transparent container */}
          {logoUrl && (
            <div className={cn("flex w-full mb-6", alignClass)}>
              <img
                src={logoUrl}
                alt="Logo"
                style={{
                  height: `${logoSize}px`,
                  width: "auto",
                  background: "transparent",
                }}
                className="object-contain"
              />
            </div>
          )}

          {/* Eyebrow */}
          {eyebrow.text && (
            <p
              className="guest-eyebrow"
              style={eyebrow.style}
            >
              {eyebrow.text}
            </p>
          )}

          {/* Heading */}
          <h1
            className="guest-title"
            style={heading.style}
          >
            {heading.text}
          </h1>

          {/* Subheading */}
          {subheading.text && (
            <p
              className="guest-subtitle"
              style={subheading.style}
            >
              {subheading.text}
            </p>
          )}

          {/* Body HTML */}
          {config.bodyHtml && (
            <div className="mt-6 w-full">
              <RichTextContent html={config.bodyHtml} />
            </div>
          )}

          {/* CTA Button — static, no navigation */}
          {config.ctaText && (
            <button
              type="button"
              className="event-btn-primary mt-8"
              onClick={(e) => e.preventDefault()}
            >
              {config.ctaText}
            </button>
          )}
        </div>
      </div>
    </EventThemeProvider>
  );
}

interface LoginPreviewProps {
  event: UserEvent;
  theme?: Json | null;
  coverImage?: string | null;
}

export function LoginPreview({ event, theme, coverImage }: LoginPreviewProps) {
  return (
    <EventThemeProvider theme={theme}>
      <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {coverImage && (
            <div className="mb-6 overflow-hidden rounded-t-xl">
              <img src={coverImage} alt="" className="h-32 w-full object-cover" />
            </div>
          )}
          <div className="event-card">
            <h2 className="guest-title text-center">{event.name || "Event Title"}</h2>
            <p className="guest-subtitle text-center mb-6">Enter your username to continue</p>
            <input
              type="text"
              placeholder="Username"
              className="event-input mb-3"
              readOnly
            />
            <button type="button" className="event-btn-primary w-full" onClick={(e) => e.preventDefault()}>
              Continue
            </button>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}

interface HomePreviewProps {
  event: UserEvent;
  theme?: Json | null;
  coverImage?: string | null;
}

export function HomePreview({ event, theme, coverImage }: HomePreviewProps) {
  return (
    <EventThemeProvider theme={theme}>
      <div className="flex min-h-[420px] flex-col items-center px-6 py-12">
        {coverImage && (
          <div className="mb-6 w-full max-w-2xl overflow-hidden rounded-xl">
            <img src={coverImage} alt="" className="h-48 w-full object-cover" />
          </div>
        )}
        <h1 className="guest-title text-center">{event.name || "Event Title"}</h1>
        {event.venue && <p className="guest-subtitle text-center">{event.venue}</p>}
        <div className="mt-6 flex gap-3">
          <button type="button" className="event-btn-primary" onClick={(e) => e.preventDefault()}>
            View Details
          </button>
          <button type="button" className="event-btn-secondary" onClick={(e) => e.preventDefault()}>
            RSVP
          </button>
        </div>
      </div>
    </EventThemeProvider>
  );
}

interface RsvpPreviewProps {
  event: UserEvent;
  theme?: Json | null;
}

export function RsvpPreview({ event, theme }: RsvpPreviewProps) {
  return (
    <EventThemeProvider theme={theme}>
      <div className="flex min-h-[420px] flex-col items-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="guest-title text-center">RSVP</h1>
          <p className="guest-subtitle text-center mb-6">
            Will you attend {event.name || "this event"}?
          </p>
          <div className="event-card space-y-4">
            <div>
              <label className="guest-eyebrow mb-1 block">Name</label>
              <input type="text" className="event-input" readOnly placeholder="Your name" />
            </div>
            <div>
              <label className="guest-eyebrow mb-1 block">Email</label>
              <input type="email" className="event-input" readOnly placeholder="you@example.com" />
            </div>
            <div>
              <label className="guest-eyebrow mb-1 block">Attending?</label>
              <div className="flex gap-2">
                <button type="button" className="event-btn-primary flex-1" onClick={(e) => e.preventDefault()}>
                  Yes
                </button>
                <button type="button" className="event-btn-secondary flex-1" onClick={(e) => e.preventDefault()}>
                  No
                </button>
              </div>
            </div>
            <button type="button" className="event-btn-primary w-full" onClick={(e) => e.preventDefault()}>
              Submit RSVP
            </button>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}
