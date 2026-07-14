import { useEffect, useState } from "react";
import { EventThemeProvider } from "../../lib/theme-context";
import { resolveTypography } from "../../lib/typography";
import { getCountdown } from "../../lib/utils";

export interface CoverConfig {
  eyebrow?: unknown;
  heading?: unknown;
  subheading?: unknown;
  bodyHtml?: string;
  ctaText?: string;
  background?: { image?: string | null; color?: string; position?: string; fit?: string };
  overlayOpacity?: number;
}

export interface LogoConfig {
  url?: string | null;
  size?: number;
  align?: string;
  marginTop?: number;
  marginBottom?: number;
}

export interface LoginConfig {
  heading?: unknown;
  subheading?: unknown;
  placeholder?: string;
  buttonLabel?: string;
}

export interface HomeLogo {
  url?: string | null;
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
  heading?: unknown;
  body?: string;
  sections?: HomeSection[];
}

function CoverPreview({ config, eventName, logo }: { config: CoverConfig; eventName?: string; logo?: LogoConfig | null }) {
  const eyebrow = resolveTypography(config.eyebrow, "");
  const heading = resolveTypography(config.heading, eventName ?? "");
  const subheading = resolveTypography(config.subheading, "");
  const bg = config.background ?? {};
  const overlay = (typeof config.overlayOpacity === "number" ? config.overlayOpacity : 30) / 100;
  const ctaText = config.ctaText || "Enter";

  const bgStyle: React.CSSProperties = {};
  if (bg.image) {
    bgStyle.backgroundImage = `url(${bg.image})`;
    bgStyle.backgroundSize = bg.fit === "fill" ? "100% 100%" : (bg.fit as "cover" | "contain") || "cover";
    bgStyle.backgroundPosition = bg.position || "center";
    bgStyle.backgroundRepeat = "no-repeat";
  } else if (bg.color) {
    bgStyle.backgroundColor = bg.color;
  }

  return (
    <EventThemeProvider theme={null}>
      <div className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden" style={bgStyle}>
        {bg.image && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />}
        <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6 py-12 text-center">
          {logo?.url && (
            <div className="mb-6 flex justify-center">
              <img src={logo.url} alt="" style={{ height: `${logo.size ?? 120}px`, width: "auto" }} className="object-contain" />
            </div>
          )}
          {eyebrow.text && <p className="guest-eyebrow mb-2" style={eyebrow.style}>{eyebrow.text}</p>}
          {heading.text && <h1 className="guest-title mb-3" style={heading.style}>{heading.text}</h1>}
          {subheading.text && <p className="guest-subtitle mb-3" style={subheading.style}>{subheading.text}</p>}
          {config.bodyHtml && <div className="rich-content mb-6 max-w-sm" dangerouslySetInnerHTML={{ __html: config.bodyHtml }} />}
          <button type="button" className="event-btn-primary">{ctaText}</button>
        </div>
      </div>
    </EventThemeProvider>
  );
}

function LoginPreview({ config, eventName }: { config: LoginConfig; eventName?: string }) {
  const heading = resolveTypography(config.heading, (eventName ?? "") || "Welcome");
  const subheading = resolveTypography(config.subheading, "Please sign in to view your invitation");
  const placeholder = config.placeholder || "Enter your username";
  const buttonLabel = config.buttonLabel || "Sign In";

  return (
    <EventThemeProvider theme={null}>
      <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            {heading.text && <h1 className="guest-title mb-2" style={heading.style}>{heading.text}</h1>}
            {subheading.text && <p className="guest-subtitle" style={subheading.style}>{subheading.text}</p>}
          </div>
          <div className="event-card space-y-3">
            <label className="block text-center text-sm font-medium" style={{ color: "var(--event-text)" }}>{placeholder}</label>
            <input type="text" className="event-input" placeholder={placeholder} style={{ textAlign: "center" }} readOnly />
            <button type="button" className="event-btn-primary w-full">{buttonLabel}</button>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}

function HomePreview({ content, eventName }: { content: EventContent; eventName?: string }) {
  const sections = content.sections ?? ((content.heading !== undefined || content.body !== undefined) ? [{ heading: content.heading, body: content.body }] : []);
  const logo = content.logo;

  return (
    <EventThemeProvider theme={null}>
      <div>
        {logo?.url && (
          <div style={{ paddingTop: logo.marginTop ? `${logo.marginTop}px` : undefined, paddingBottom: logo.marginBottom ? `${logo.marginBottom}px` : "1.5rem", display: "flex", justifyContent: "center" }}>
            <img src={logo.url} alt="" className="home-logo" style={{ maxWidth: logo.size ? `${logo.size}px` : "140px", height: "auto", width: "auto" }} />
          </div>
        )}
        {sections.length === 0 && !logo?.url && (
          <section className="guest-section text-center">
            <div className="mx-auto max-w-md">
              <p className="guest-subtitle">{eventName ? `Welcome to ${eventName}` : ""}</p>
            </div>
          </section>
        )}
        {sections.map((section, i) => {
          const headingText = resolveTypography(section.heading, "").text;
          const headingStyle = resolveTypography(section.heading, "").style;
          return (
            <section key={i} className="guest-section">
              <div className="mx-auto max-w-3xl">
                {headingText && <h2 className="guest-title mb-4" style={headingStyle}>{headingText}</h2>}
                {section.body && <div className="rich-content" dangerouslySetInnerHTML={{ __html: section.body }} />}
              </div>
            </section>
          );
        })}
      </div>
    </EventThemeProvider>
  );
}

function RsvpPreview({ eventName }: { eventName?: string }) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    const tick = () => setCountdown(getCountdown(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <EventThemeProvider theme={null}>
      <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <h1 className="guest-title mb-2">RSVP</h1>
          {eventName && <p className="guest-subtitle mb-6">{eventName}</p>}
          <div className="event-card space-y-4">
            <div className="flex justify-center gap-3">
              {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
                <div key={unit} className="flex flex-col items-center">
                  <span className="text-2xl font-bold" style={{ color: "var(--event-primary)" }}>
                    {String(countdown[unit]).padStart(2, "0")}
                  </span>
                  <span className="text-xs uppercase" style={{ color: "var(--event-muted)" }}>{unit}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <button type="button" className="event-btn-primary w-full">Will Attend</button>
              <button type="button" className="event-btn-secondary w-full">Cannot Attend</button>
            </div>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}

export { CoverPreview, LoginPreview, HomePreview, RsvpPreview };
