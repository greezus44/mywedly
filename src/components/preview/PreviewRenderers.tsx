import React, { useMemo } from "react";
import type { Json, UserEvent } from "../../lib/supabase";
import { jsonToTheme, type ThemeConfig } from "../../lib/theme";
import {
  type TypographyStyle,
  isTypographyObject,
  getTypographyText,
  getTypographyStyle,
  resolveTypography,
} from "../../lib/typography";
import { RichTextContent } from "../../lib/sanitize";
import { cn } from "../../lib/utils";

// ---------- Interfaces ----------
export interface CoverConfig {
  layout?: "centered" | "split" | "minimal";
  overlayColor?: string;
  overlayOpacity?: number;
  showDate?: boolean;
  showVenue?: boolean;
  heading?: TypographyStyle;
  subheading?: TypographyStyle;
  logo?: { url: string; size?: number; marginTop?: number; marginBottom?: number };
}

export interface LogoConfig {
  url?: string;
  size?: number;
  marginTop?: number;
  marginBottom?: number;
}

export interface LoginConfig {
  heading?: TypographyStyle;
  placeholder?: string;
  buttonText?: string;
  helperText?: string;
}

export interface EventContentSection {
  id?: string;
  heading?: TypographyStyle;
  body?: string; // rich text HTML
}

export interface EventContent {
  sections?: EventContentSection[];
  logo?: { url: string; size?: number; marginTop?: number; marginBottom?: number };
}

// ---------- Helpers ----------
function parseContent(content: Json | null | undefined): EventContent {
  if (!content || typeof content !== "object") return {};
  return content as EventContent;
}

function parseCoverConfig(config: Json | null | undefined): CoverConfig {
  if (!config || typeof config !== "object") return {};
  return config as CoverConfig;
}

function parseLoginConfig(config: Json | null | undefined): LoginConfig {
  if (!config || typeof config !== "object") return {};
  return config as LoginConfig;
}

// ---------- CoverPreview ----------
export interface CoverPreviewProps {
  coverImage?: string | null;
  coverConfig?: Json | null;
  name?: string;
  theme?: Json | null;
  logoConfig?: Json | null;
}

export function CoverPreview({ coverImage, coverConfig, name, theme, logoConfig }: CoverPreviewProps) {
  const cfg = useMemo(() => parseCoverConfig(coverConfig), [coverConfig]);
  const resolvedTheme = useMemo<ThemeConfig>(() => jsonToTheme(theme), [theme]);
  const logo = useMemo<LogoConfig>(() => {
    if (!logoConfig || typeof logoConfig !== "object") return {};
    return logoConfig as LogoConfig;
  }, [logoConfig]);

  const headingStyle = useMemo(() => getTypographyStyle(cfg.heading), [cfg.heading]);
  const headingText = useMemo(() => getTypographyText(cfg.heading, name || ""), [cfg.heading, name]);
  const subheadingStyle = useMemo(() => getTypographyStyle(cfg.subheading), [cfg.subheading]);
  const subheadingText = useMemo(() => getTypographyText(cfg.subheading, ""), [cfg.subheading]);

  return (
    <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden">
      {coverImage && (
        <img
          src={coverImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: cfg.overlayColor || "rgba(0,0,0,0.35)",
          opacity: cfg.overlayOpacity ?? 0.35,
        }}
      />
      <div className="relative z-10 flex flex-col items-center px-6 py-12 text-center">
        {logo.url && (
          <img
            src={logo.url}
            alt="Logo"
            className="home-logo mb-4"
            style={{
              maxWidth: logo.size ? `${logo.size}px` : "120px",
              width: "auto",
              maxHeight: "120px",
              marginTop: logo.marginTop ? `${logo.marginTop}px` : undefined,
              marginBottom: logo.marginBottom ? `${logo.marginBottom}px` : "1rem",
            }}
          />
        )}
        {headingText && (
          <h1
            className="text-3xl md:text-4xl"
            style={{ color: "#ffffff", ...headingStyle }}
          >
            {headingText}
          </h1>
        )}
        {subheadingText && (
          <p
            className="mt-2 text-base md:text-lg"
            style={{ color: "#ffffff", opacity: 0.9, ...subheadingStyle }}
          >
            {subheadingText}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------- LoginPreview ----------
export interface LoginPreviewProps {
  event: UserEvent;
  loginConfig?: Json | null;
  theme?: Json | null;
}

export function LoginPreview({ event, loginConfig, theme }: LoginPreviewProps) {
  const cfg = useMemo<LoginConfig>(() => {
    const fromProp = parseLoginConfig(loginConfig);
    const fromEvent = parseLoginConfig(event.login_config);
    return {
      heading: fromProp.heading ?? fromEvent.heading,
      placeholder: fromProp.placeholder ?? fromEvent.placeholder,
      buttonText: fromProp.buttonText ?? fromEvent.buttonText,
      helperText: fromProp.helperText ?? fromEvent.helperText,
    };
  }, [loginConfig, event.login_config]);

  const heading = useMemo(() => resolveTypography(cfg.heading, "Enter your username"), [cfg.heading]);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12" style={{ textAlign: "center" }}>
      <h2 className="mb-2 text-xl md:text-2xl" style={heading.style}>
        {heading.text}
      </h2>
      {cfg.helperText && (
        <p className="mb-6 text-sm" style={{ color: "var(--event-muted)" }}>
          {cfg.helperText}
        </p>
      )}
      <input
        type="text"
        placeholder={cfg.placeholder || "Your username"}
        className="event-input mb-4"
        style={{ maxWidth: "20rem", textAlign: "center" }}
        readOnly
      />
      <button type="button" className="event-btn-primary">
        {cfg.buttonText || "Enter"}
      </button>
    </div>
  );
}

// ---------- HomePreview ----------
export interface HomePreviewProps {
  event: UserEvent;
  theme?: Json | null;
  content?: EventContent;
}

export function HomePreview({ event, theme, content }: HomePreviewProps) {
  const resolvedContent = useMemo<EventContent>(() => {
    if (content) return content;
    return parseContent(event.content);
  }, [content, event.content]);

  const sections = resolvedContent.sections ?? [];

  return (
    <div className="guest-section">
      {/* Logo at the top, transparent, centered, no container */}
      {resolvedContent.logo?.url && (
        <img
          src={resolvedContent.logo.url}
          alt="Event logo"
          className="home-logo mb-6"
          style={{
            maxWidth: resolvedContent.logo.size ? `${resolvedContent.logo.size}px` : "140px",
            width: "auto",
            maxHeight: "160px",
            marginTop: resolvedContent.logo.marginTop ? `${resolvedContent.logo.marginTop}px` : undefined,
            marginBottom: resolvedContent.logo.marginBottom ? `${resolvedContent.logo.marginBottom}px` : "1.5rem",
          }}
        />
      )}

      {/* Sections */}
      {sections.map((section, idx) => {
        const heading = resolveTypography(section.heading, "");
        return (
          <div key={section.id ?? idx} className="mb-8 last:mb-0">
            {heading.text && (
              <h2 className="guest-title mb-3" style={heading.style}>
                {heading.text}
              </h2>
            )}
            {section.body && (
              <div className="rich-content" style={{ maxWidth: "42rem", margin: "0 auto" }}>
                <RichTextContent html={section.body} />
              </div>
            )}
          </div>
        );
      })}

      {sections.length === 0 && !resolvedContent.logo?.url && (
        <p className="text-center text-sm" style={{ color: "var(--event-muted)" }}>
          No content yet. Add sections to your event home page.
        </p>
      )}
    </div>
  );
}

// ---------- RsvpPreview ----------
export interface RsvpPreviewProps {
  event: UserEvent;
  theme?: Json | null;
}

export function RsvpPreview({ event, theme }: RsvpPreviewProps) {
  return (
    <div className="guest-section">
      <div className="mx-auto max-w-xl">
        <h2 className="guest-title mb-2">RSVP</h2>
        <p className="guest-subtitle mb-6">
          Let us know if you'll be joining us.
        </p>
        <div className="event-card space-y-4">
          <div>
            <label className="guest-eyebrow mb-1 block">Your name</label>
            <input type="text" className="event-input" placeholder="Your name" readOnly />
          </div>
          <div>
            <label className="guest-eyebrow mb-1 block">Will you attend?</label>
            <div className="flex gap-2">
              <button type="button" className="event-btn-primary flex-1">Yes</button>
              <button type="button" className="event-btn-secondary flex-1">No</button>
            </div>
          </div>
          <div>
            <label className="guest-eyebrow mb-1 block">Message (optional)</label>
            <textarea className="event-input min-h-[80px]" placeholder="Leave a message…" readOnly />
          </div>
          <button type="button" className="event-btn-primary w-full">Submit RSVP</button>
        </div>
      </div>
    </div>
  );
}
