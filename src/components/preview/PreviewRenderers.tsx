import { useMemo, type CSSProperties } from "react";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { resolveTypography } from "../../lib/typography";

export interface CoverConfig {
  background?: { image?: string | null; color?: string; position?: string; fit?: string };
  overlayOpacity?: number;
  eyebrow?: unknown;
  heading?: unknown;
  subheading?: unknown;
  bodyHtml?: string;
  ctaText?: string;
}
export interface LogoConfig { url?: string | null; size?: number; align?: string; marginTop?: number; marginBottom?: number; }
export interface LoginConfig { heading?: unknown; subheading?: unknown; placeholder?: string; buttonLabel?: string; }
export interface HomeLogo { url?: string | null; size?: number; marginTop?: number; marginBottom?: number; }
export interface HomeSection { heading?: unknown; body?: string; }
export interface EventContent {
  logo?: HomeLogo | null;
  heading?: unknown;
  body?: string;
  sections?: HomeSection[];
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
  return (
    <EventThemeProvider theme={theme}>
      <div className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden p-8 text-center" style={bgStyle}>
        {bg.image && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />}
        <div className="relative z-10 flex max-w-md flex-col items-center">
          {eyebrow.text && <p className="guest-eyebrow mb-2" style={eyebrow.style}>{eyebrow.text}</p>}
          {heading.text && <h1 className="guest-title mb-3" style={heading.style}>{heading.text}</h1>}
          {subheading.text && <p className="guest-subtitle mb-3" style={subheading.style}>{subheading.text}</p>}
          {config.bodyHtml && <div className="rich-content mb-6" dangerouslySetInnerHTML={{ __html: config.bodyHtml }} />}
          <button type="button" className="event-btn-primary">{cta}</button>
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
            <button type="button" className="event-btn-primary w-full">{buttonLabel}</button>
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
      </div>
    </EventThemeProvider>
  );
}

interface RsvpPreviewProps { theme: unknown; }
export function RsvpPreview({ theme }: RsvpPreviewProps) {
  return (
    <EventThemeProvider theme={theme}>
      <div className="guest-section">
        <div className="mx-auto max-w-md text-center">
          <h1 className="guest-title mb-2">RSVP</h1>
          <p className="guest-subtitle mb-6">Let us know if you'll be joining us</p>
          <div className="event-card space-y-3">
            <div className="flex justify-center gap-3">
              <button type="button" className="event-btn-primary" style={{ opacity: 0.6 }}>Attending</button>
              <button type="button" className="event-btn-secondary" style={{ opacity: 0.6 }}>Decline</button>
            </div>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}
