import { useMemo, type CSSProperties } from "react";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { resolveTypography } from "../../lib/typography";
import { ButtonColors, buttonColorsToStyle, buttonColorsToHoverStyle } from "../ui/ButtonColourEditor";

export interface CoverConfig {
  background?: { image?: string | null; color?: string; position?: string; fit?: string };
  overlayOpacity?: number;
  eyebrow?: unknown;
  heading?: unknown;
  subheading?: unknown;
  bodyHtml?: string;
  ctaText?: string;
  buttonColors?: ButtonColors;
  logo?: { url?: string | null; size?: number; maxWidth?: number; maxHeight?: number; marginTop?: number; marginBottom?: number; } | null;
}
export interface LogoConfig { url?: string | null; size?: number; align?: string; marginTop?: number; marginBottom?: number; }
export interface LoginConfig { heading?: unknown; subheading?: unknown; placeholder?: string; buttonLabel?: string; buttonColors?: ButtonColors; }
export interface HomeLogo { url?: string | null; size?: number; marginTop?: number; marginBottom?: number; }
export interface HomeSection { heading?: unknown; body?: string; }
export interface EventContent {
  logo?: HomeLogo | null;
  heading?: unknown;
  body?: string;
  sections?: HomeSection[];
  rsvpButtonText?: string;
  rsvpButtonColors?: ButtonColors;
}

interface CoverPreviewProps { config: CoverConfig; theme: unknown; eventName?: string; }
export function CoverPreview({ config, theme, eventName }: CoverPreviewProps) {
  const t = jsonToTheme(theme);
  const bg = config.background ?? {};
  const overlay = (typeof config.overlayOpacity === "number" ? config.overlayOpacity : 30) / 100;
  const bgStyle: CSSProperties = {};
  if (bg.image) { bgStyle.backgroundImage = `url(${bg.image})`; bgStyle.backgroundSize = bg.fit === "fill" ? "100% 100%" : (bg.fit as "cover" | "contain") || "cover"; bgStyle.backgroundPosition = bg.position || "center"; bgStyle.backgroundRepeat = "no-repeat"; }
  else if (bg.color) bgStyle.backgroundColor = bg.color;
  else bgStyle.backgroundColor = t.colors.bg;
  const eyebrow = resolveTypography(config.eyebrow, "");
  const heading = resolveTypography(config.heading, eventName ?? "");
  const subheading = resolveTypography(config.subheading, "");
  const cta = config.ctaText || "Enter";
  const logo = config.logo;
  return (
    <EventThemeProvider theme={theme}>
      <div className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden p-8 text-center" style={bgStyle}>
        {bg.image && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />}
        <div className="relative z-10 flex max-w-md flex-col items-center">
          {logo?.url && <div style={{ marginTop: logo.marginTop ? `${logo.marginTop}px` : undefined, marginBottom: logo.marginBottom != null ? `${logo.marginBottom}px` : "2rem", display: "flex", justifyContent: "center", width: "100%" }}><img src={logo.url} alt="Logo" style={{ height: logo.size ? `${logo.size}px` : "120px", width: "auto", maxWidth: logo.maxWidth ? `${logo.maxWidth}px` : undefined, maxHeight: logo.maxHeight ? `${logo.maxHeight}px` : "40vh", objectFit: "contain", background: "transparent" }} /></div>}
          {eyebrow.text && <p className="guest-eyebrow mb-2" style={{ whiteSpace: "pre-wrap", ...eyebrow.style }}>{eyebrow.text}</p>}
          {heading.text && <h1 className="guest-title mb-3" style={{ whiteSpace: "pre-wrap", ...heading.style }}>{heading.text}</h1>}
          {subheading.text && <p className="guest-subtitle mb-3" style={{ whiteSpace: "pre-wrap", ...subheading.style }}>{subheading.text}</p>}
          {config.bodyHtml && <div className="rich-content mb-6" dangerouslySetInnerHTML={{ __html: config.bodyHtml }} />}
          <button type="button" className="event-btn-primary" style={buttonColorsToStyle(config.buttonColors)} onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonColorsToHoverStyle(config.buttonColors))} onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonColorsToStyle(config.buttonColors))}>{cta}</button>
        </div>
      </div>
    </EventThemeProvider>
  );
}

interface LoginPreviewProps { config: LoginConfig; theme: unknown; eventName?: string; }
export function LoginPreview({ config, theme, eventName }: LoginPreviewProps) {
  const heading = resolveTypography(config.heading, (eventName ?? "") || "Welcome");
  const subheading = resolveTypography(config.subheading, "Please sign in to view your invitation");
  const placeholder = config.placeholder || "Enter your username";
  const buttonLabel = config.buttonLabel || "Sign In";
  return (
    <EventThemeProvider theme={theme}>
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            {heading.text && <h1 className="guest-title mb-2" style={heading.style}>{heading.text}</h1>}
            {subheading.text && <p className="guest-subtitle" style={subheading.style}>{subheading.text}</p>}
          </div>
          <div className="event-card space-y-3">
            <label className="block text-center text-sm font-medium" style={{ color: "var(--event-text)" }}>{placeholder}</label>
            <input type="text" className="event-input" placeholder={placeholder} style={{ textAlign: "center" }} disabled />
            <button type="button" className="event-btn-primary w-full" style={buttonColorsToStyle(config.buttonColors)} onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonColorsToHoverStyle(config.buttonColors))} onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonColorsToStyle(config.buttonColors))}>{buttonLabel}</button>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}

interface HomePreviewProps { content: EventContent; theme: unknown; }
export function HomePreview({ content, theme }: HomePreviewProps) {
  const logo = content.logo;
  const sections = content.sections ?? ((content.heading !== undefined || content.body !== undefined) ? [{ heading: content.heading, body: content.body }] : []);
  return (
    <EventThemeProvider theme={theme}>
      <div className="min-h-[400px]">
        {logo?.url && (
          <div style={{ paddingTop: logo.marginTop ? `${logo.marginTop}px` : undefined, paddingBottom: logo.marginBottom != null ? `${Math.min(logo.marginBottom, 8)}px` : "0.5rem", display: "flex", justifyContent: "center" }}>
            <img src={logo.url} alt="" className="home-logo" style={{ maxWidth: logo.size ? `${logo.size}px` : "140px", height: "auto", width: "auto" }} />
          </div>
        )}
        {sections.map((section, i) => {
          const heading = resolveTypography(section.heading, "");
          return (
            <section key={i} className="guest-section">
              <div className="mx-auto max-w-3xl">
                {heading.text && <h2 className="guest-title mb-4" style={heading.style}>{heading.text}</h2>}
                {section.body && <div className="rich-content" dangerouslySetInnerHTML={{ __html: section.body }} />}
              </div>
            </section>
          );
        })}
        {sections.length === 0 && !logo?.url && (
          <section className="guest-section text-center"><div className="mx-auto max-w-md"><p className="guest-subtitle">No content yet.</p></div></section>
        )}
        <section className="rsvp-section text-center" style={{ paddingTop: "1.5rem", paddingBottom: "2.5rem" }}>
          <button type="button" className="event-btn-primary" style={buttonColorsToStyle(content.rsvpButtonColors)} onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonColorsToHoverStyle(content.rsvpButtonColors))} onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonColorsToStyle(content.rsvpButtonColors))}>{content.rsvpButtonText || "RSVP Now"}</button>
        </section>
      </div>
    </EventThemeProvider>
  );
}

interface RsvpPreviewProps { theme: unknown; content?: Record<string, unknown> | null; }
export function RsvpPreview({ theme, content }: RsvpPreviewProps) {
  const c = content as { title?: string; subtitle?: string; attendingText?: string; declinedText?: string; contactMessage?: string } | null;
  return (
    <EventThemeProvider theme={theme}>
      <div className="guest-section">
        <div className="mx-auto max-w-md text-center">
          <h1 className="guest-title mb-2">{c?.title || "RSVP"}</h1>
          {c?.subtitle && <p className="guest-subtitle mb-6">{c.subtitle}</p>}
          <div className="event-card space-y-3">
            <p className="guest-subtitle" style={{ fontSize: "1rem" }}>Guest Name</p>
            <div className="flex justify-center gap-3">
              <button type="button" className="event-btn-primary" style={{ opacity: 0.6 }}>{c?.attendingText || "Attending"}</button>
              <button type="button" className="event-btn-secondary" style={{ opacity: 0.6 }}>{c?.declinedText || "Decline"}</button>
            </div>
          </div>
          {c?.contactMessage?.trim() && (
            <p className="mt-8" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)", whiteSpace: "pre-wrap" }}>{c.contactMessage}</p>
          )}
        </div>
      </div>
    </EventThemeProvider>
  );
}
