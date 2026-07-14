import React from "react";
import type { UserEvent, Json } from "../../lib/supabase";
import { resolveTypography } from "../../lib/typography";
import { jsonToTheme } from "../../lib/theme";
import { EventThemeProvider } from "../../lib/theme-context";
import { RichTextContent } from "../../lib/sanitize";
import { cn } from "../../lib/utils";
import type { TypographyStyle } from "../../lib/typography";

export interface CoverConfig {
  eyebrow?: TypographyStyle | string;
  heading?: TypographyStyle | string;
  subheading?: TypographyStyle | string;
  body?: TypographyStyle | string;
  ctaLabel?: string;
  overlay?: number;
  layout?: string;
}

export interface LogoConfig {
  imageUrl?: string | null;
  shape?: string;
  size?: number;
  position?: string;
}

export interface LoginConfig {
  heading?: TypographyStyle | string;
  subheading?: TypographyStyle | string;
  placeholder?: string;
  buttonLabel?: string;
}

interface EventContent {
  heading?: string;
  body?: string;
  sections?: Array<{ heading?: string; headingFont?: string; headingColor?: string; body?: string }>;
}

export function CoverPreview({
  event,
  theme,
  coverConfig,
  logoConfig,
  coverImage,
}: {
  event: UserEvent;
  theme?: Json | null;
  coverConfig?: CoverConfig;
  logoConfig?: LogoConfig;
  coverImage?: string | null;
}) {
  const cfg = coverConfig ?? (event.cover_config as CoverConfig | undefined);
  const logo = logoConfig ?? (event.logo_config as LogoConfig | undefined);
  const img = coverImage ?? event.cover_image;
  const overlayOpacity = cfg?.overlay ?? 0.3;

  const eyebrow = resolveTypography(cfg?.eyebrow, "");
  const heading = resolveTypography(cfg?.heading, event.name);
  const subheading = resolveTypography(cfg?.subheading, "");
  const body = resolveTypography(cfg?.body, "");

  return (
    <EventThemeProvider theme={theme ?? event.theme}>
      <div className="relative w-full min-h-[400px] overflow-hidden rounded-lg">
        {img ? (
          <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200" />
        )}
        <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlayOpacity})` }} />
        <div className="relative flex flex-col items-center justify-center text-center px-6 py-16 min-h-[400px]">
          {logo?.imageUrl && (
            <img
              src={logo.imageUrl}
              alt="Logo"
              style={{
                background: "transparent",
                maxWidth: `${logo.size ?? 80}px`,
                maxHeight: `${logo.size ?? 80}px`,
              }}
              className="mb-4 object-contain"
            />
          )}
          {eyebrow.text && (
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ ...eyebrow.style, color: "#ffffff" }}>
              {eyebrow.text}
            </p>
          )}
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ ...heading.style, color: "#ffffff" }}>
            {heading.text}
          </h1>
          {subheading.text && (
            <p className="text-lg mb-4" style={{ ...subheading.style, color: "rgba(255,255,255,0.9)" }}>
              {subheading.text}
            </p>
          )}
          {body.text && (
            <div className="max-w-md">
              <RichTextContent html={body.text} />
            </div>
          )}
          {cfg?.ctaLabel && (
            <button className="event-btn-primary mt-6" type="button">
              {cfg.ctaLabel}
            </button>
          )}
        </div>
      </div>
    </EventThemeProvider>
  );
}

export function LoginPreview({
  event,
  theme,
  loginConfig,
}: {
  event: UserEvent;
  theme?: Json | null;
  loginConfig?: LoginConfig;
}) {
  const cfg = loginConfig ?? (event.login_config as LoginConfig | undefined);
  const heading = resolveTypography(cfg?.heading, "Welcome");
  const subheading = resolveTypography(cfg?.subheading, "Please sign in to continue.");
  const placeholder = cfg?.placeholder ?? "Enter your username";

  return (
    <EventThemeProvider theme={theme ?? event.theme}>
      <div className="guest-section-tight flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <h2 className="guest-title" style={heading.style}>
          {heading.text}
        </h2>
        <p className="guest-subtitle mb-6" style={subheading.style}>
          {subheading.text}
        </p>
        <input
          type="text"
          className="event-input mb-4"
          placeholder={placeholder}
          readOnly
        />
        <button className="event-btn-primary" type="button">
          {cfg?.buttonLabel ?? "Sign In"}
        </button>
      </div>
    </EventThemeProvider>
  );
}

export function HomePreview({
  event,
  theme,
  content,
}: {
  event: UserEvent;
  theme?: Json | null;
  content?: EventContent;
}) {
  const cnt = content ?? (event.content as EventContent | undefined);
  const sections = cnt?.sections ?? (cnt?.heading || cnt?.body ? [{ heading: cnt.heading, body: cnt.body }] : []);

  return (
    <EventThemeProvider theme={theme ?? event.theme}>
      <div className="guest-section">
        {sections.length === 0 && (
          <div className="text-center text-dash-muted">
            <p>No content yet.</p>
          </div>
        )}
        {sections.map((section, i) => {
          const heading = resolveTypography(section.heading, "");
          return (
            <div key={i} className="max-w-3xl mx-auto mb-12 last:mb-0">
              {heading.text && (
                <h2 className="guest-title" style={heading.style}>
                  {heading.text}
                </h2>
              )}
              {section.body && <RichTextContent html={section.body} />}
            </div>
          );
        })}
      </div>
    </EventThemeProvider>
  );
}

export function RsvpPreview({
  event,
  theme,
}: {
  event: UserEvent;
  theme?: Json | null;
}) {
  return (
    <EventThemeProvider theme={theme ?? event.theme}>
      <div className="guest-section-tight max-w-2xl mx-auto">
        <h2 className="guest-title text-center">RSVP</h2>
        <p className="guest-subtitle text-center mb-6">Let us know if you'll be joining us.</p>
        <div className="event-card space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Will you attend?</label>
            <div className="flex gap-2">
              <button className="event-btn-primary flex-1" type="button">Yes</button>
              <button className="event-btn-secondary flex-1" type="button">No</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Plus ones</label>
            <input className="event-input" type="number" defaultValue={0} readOnly />
          </div>
          <button className="event-btn-primary w-full" type="button">Submit RSVP</button>
        </div>
      </div>
    </EventThemeProvider>
  );
}
