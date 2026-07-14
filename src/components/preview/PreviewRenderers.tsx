import type React from "react";
import { getTypographyText, getTypographyStyle, resolveTypography } from "../../lib/typography";

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface LogoConfig {
  url?: string | null;
  size?: number;
  align?: "left" | "center" | "right";
}

export interface CoverConfig {
  background?: { image?: string | null; color?: string; position?: string; fit?: string };
  overlayOpacity?: number;
  eyebrow?: unknown;
  heading?: unknown;
  subheading?: unknown;
  bodyHtml?: string;
  ctaText?: string;
}

export interface LoginConfig {
  heading?: unknown;
  subheading?: unknown;
  placeholder?: string;
  buttonLabel?: string;
}

export interface HomeLogo {
  url?: string;
  size?: number;
  marginTop?: number;
  marginBottom?: number;
}

export interface HomeSection {
  heading?: unknown;
  body?: string;
}

export interface EventContent {
  logo?: HomeLogo;
  sections?: HomeSection[];
  heading?: unknown;
  body?: string;
}

// ─── CoverPreview ────────────────────────────────────────────────────────────

interface CoverPreviewProps {
  config: CoverConfig;
  logo?: LogoConfig;
  themeBg?: string;
}

export function CoverPreview({ config, logo, themeBg }: CoverPreviewProps) {
  const bg = config.background ?? {};
  const overlay = (typeof config.overlayOpacity === "number" ? config.overlayOpacity : 30) / 100;
  const bgStyle: React.CSSProperties = {};
  if (bg.image) {
    bgStyle.backgroundImage = `url(${bg.image})`;
    bgStyle.backgroundSize = bg.fit === "fill" ? "100% 100%" : (bg.fit as "cover" | "contain") || "cover";
    bgStyle.backgroundPosition = bg.position || "center";
    bgStyle.backgroundRepeat = "no-repeat";
  } else if (bg.color) {
    bgStyle.backgroundColor = bg.color;
  } else {
    bgStyle.backgroundColor = themeBg || "var(--event-bg)";
  }

  const eyebrow = resolveTypography(config.eyebrow, "");
  const heading = resolveTypography(config.heading, "");
  const subheading = resolveTypography(config.subheading, "");
  const cta = config.ctaText || "Enter";
  const logoSize = typeof logo?.size === "number" ? logo.size : 120;
  const logoAlign = logo?.align || "center";

  return (
    <div className="relative flex min-h-full w-full flex-col items-center justify-center overflow-hidden" style={bgStyle}>
      {bg.image && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />}
      <div className="relative z-10 flex w-full flex-col items-center px-6 py-12 text-center">
        {logo?.url && (
          <div className="mb-6 flex w-full" style={{ justifyContent: logoAlign === "left" ? "flex-start" : logoAlign === "right" ? "flex-end" : "center" }}>
            <img src={logo.url} alt="Logo" style={{ height: `${logoSize}px`, width: "auto", maxHeight: "30vh", background: "transparent" }} className="object-contain" />
          </div>
        )}
        {eyebrow.text && <p className="guest-eyebrow mb-2" style={eyebrow.style}>{eyebrow.text}</p>}
        {heading.text && <h1 className="guest-title mb-3" style={heading.style}>{heading.text}</h1>}
        {subheading.text && <p className="guest-subtitle mb-4" style={subheading.style}>{subheading.text}</p>}
        {config.bodyHtml && <div className="rich-content mb-6 max-w-md text-sm" dangerouslySetInnerHTML={{ __html: config.bodyHtml }} />}
        <button className="event-btn-primary">{cta}</button>
      </div>
    </div>
  );
}

// ─── LoginPreview ─────────────────────────────────────────────────────────────

interface LoginPreviewProps {
  config: LoginConfig;
}

export function LoginPreview({ config }: LoginPreviewProps) {
  const heading = resolveTypography(config.heading, "");
  const subheading = resolveTypography(config.subheading, "");
  const placeholder = config.placeholder || "Enter your username";
  const buttonLabel = config.buttonLabel || "Sign In";

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {heading.text && <h1 className="guest-title mb-2 text-center" style={heading.style}>{heading.text}</h1>}
        {subheading.text && <p className="guest-subtitle mb-6 text-center" style={subheading.style}>{subheading.text}</p>}
        <div className="event-card space-y-4">
          <input type="text" placeholder={placeholder} className="event-input" style={{ textAlign: "center" }} readOnly />
          <button className="event-btn-primary w-full">{buttonLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── HomePreview ─────────────────────────────────────────────────────────────
// FIX #1: No fallback/default content injected. If a field is empty, nothing is rendered.
// FIX #2: Body text is rendered as raw HTML so font-family/color/alignment styles applied
//         via execCommand are preserved in the output.

interface HomePreviewProps {
  content: EventContent;
}

export function HomePreview({ content }: HomePreviewProps) {
  const logo = content.logo;
  const sections = content.sections ?? (
    (content.heading !== undefined || content.body !== undefined)
      ? [{ heading: content.heading, body: content.body }]
      : []
  );

  return (
    <div className="min-h-full w-full">
      {/* Logo */}
      {logo?.url && (
        <div
          style={{
            paddingTop: logo.marginTop ? `${logo.marginTop}px` : undefined,
            paddingBottom: logo.marginBottom ? `${logo.marginBottom}px` : "1.5rem",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <img
            src={logo.url}
            alt=""
            className="home-logo"
            style={{ maxWidth: logo.size ? `${logo.size}px` : "140px", height: "auto" }}
          />
        </div>
      )}

      {sections.map((section, i) => {
        const headingText = getTypographyText(section.heading, "");
        const headingStyle = getTypographyStyle(section.heading);

        return (
          <section key={i} className="guest-section">
            <div className="mx-auto max-w-3xl">
              {/* Only render heading if non-empty */}
              {headingText && (
                <h2 className="guest-title mb-4" style={headingStyle}>
                  {headingText}
                </h2>
              )}
              {/* FIX #2: render raw HTML so execCommand styles (font-family, color, text-align) are preserved */}
              {section.body && (
                <div
                  className="rich-content"
                  dangerouslySetInnerHTML={{ __html: section.body }}
                />
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ─── RsvpPreview ─────────────────────────────────────────────────────────────

export function RsvpPreview() {
  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <h2 className="guest-title mb-4">RSVP</h2>
        <div className="event-card">
          <p className="mb-4" style={{ color: "var(--event-muted)" }}>Will you be attending?</p>
          <div className="flex gap-3 justify-center">
            <button className="event-btn-primary">Attending</button>
            <button className="event-btn-secondary">Declined</button>
          </div>
        </div>
      </div>
    </div>
  );
}
