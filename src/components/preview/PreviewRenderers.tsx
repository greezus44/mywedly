import { resolveTypography, type TypographyStyle } from "../../lib/typography";
import { EventThemeProvider } from "../../lib/theme-context";
import { DEFAULT_THEME } from "../../lib/theme";

export interface CoverConfig {
  background?: { image?: string | null; color?: string; position?: string; fit?: string };
  overlayOpacity?: number;
  eyebrow?: TypographyStyle;
  heading?: TypographyStyle;
  subheading?: TypographyStyle;
  bodyHtml?: string;
  ctaText?: string;
}

export interface LogoConfig {
  url?: string | null;
  size?: number;
  align?: string;
  marginTop?: number;
  marginBottom?: number;
}

export interface LoginConfig {
  heading?: TypographyStyle;
  subheading?: TypographyStyle;
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
  heading?: TypographyStyle;
  body?: string;
}

export interface EventContent {
  logo?: HomeLogo | null;
  heading?: TypographyStyle;
  body?: string;
  sections?: HomeSection[];
}

export interface RsvpConfig {
  heading?: TypographyStyle;
  body?: string;
  buttonLabel?: string;
}

interface PreviewWrapperProps {
  children: React.ReactNode;
}

function PreviewWrapper({ children }: PreviewWrapperProps) {
  return <EventThemeProvider theme={DEFAULT_THEME}>{children}</EventThemeProvider>;
}

export function CoverPreview({ config, eventName, logo }: { config: CoverConfig; eventName?: string; logo?: LogoConfig | null }) {
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
  }
  const eyebrow = resolveTypography(config.eyebrow, "");
  const heading = resolveTypography(config.heading, eventName ?? undefined);
  const subheading = resolveTypography(config.subheading, "");
  const buttonText = config.ctaText || "Enter";
  const logoSize = typeof logo?.size === "number" ? logo.size : 120;
  const logoAlign = logo?.align || "center";

  return (
    <PreviewWrapper>
      <div className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-lg" style={bgStyle}>
        {bg.image && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />}
        <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 py-12 text-center">
          {logo?.url && (
            <div className="mb-6 flex w-full" style={{ justifyContent: logoAlign === "left" ? "flex-start" : logoAlign === "right" ? "flex-end" : "center" }}>
              <img src={logo.url} alt="Logo" style={{ height: `${logoSize}px`, width: "auto", maxHeight: "200px", background: "transparent" }} className="object-contain" />
            </div>
          )}
          {eyebrow.text && <p className="guest-eyebrow mb-2" style={eyebrow.style}>{eyebrow.text}</p>}
          {heading.text && <h1 className="guest-title mb-3" style={heading.style}>{heading.text}</h1>}
          {subheading.text && <p className="guest-subtitle mb-3" style={subheading.style}>{subheading.text}</p>}
          {config.bodyHtml && <div className="rich-content mb-8 max-w-md" dangerouslySetInnerHTML={{ __html: config.bodyHtml }} />}
          <button type="button" className="event-btn-primary pointer-events-none">{buttonText}</button>
        </div>
      </div>
    </PreviewWrapper>
  );
}

export function LoginPreview({ config, eventName }: { config: LoginConfig; eventName?: string }) {
  const heading = resolveTypography(config.heading, (eventName ?? undefined) || "Welcome");
  const subheading = resolveTypography(config.subheading, "Please sign in to view your invitation");
  const placeholder = config.placeholder || "Enter your username";
  const buttonLabel = config.buttonLabel || "Sign In";

  return (
    <PreviewWrapper>
      <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-12 rounded-lg">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            {heading.text && <h1 className="guest-title mb-2" style={heading.style}>{heading.text}</h1>}
            {subheading.text && <p className="guest-subtitle" style={subheading.style}>{subheading.text}</p>}
          </div>
          <div className="event-card space-y-4">
            <div>
              <label className="mb-1.5 block text-center text-sm font-medium" style={{ color: "var(--event-text)" }}>{placeholder}</label>
              <input type="text" className="event-input" placeholder={placeholder} style={{ textAlign: "center" }} readOnly />
            </div>
            <button type="button" className="event-btn-primary w-full pointer-events-none">{buttonLabel}</button>
          </div>
        </div>
      </div>
    </PreviewWrapper>
  );
}

export function HomePreview({ content }: { content: EventContent }) {
  const sections = content.sections ?? ((content.heading !== undefined || content.body !== undefined) ? [{ heading: content.heading, body: content.body }] : []);
  const logo = content.logo;

  return (
    <PreviewWrapper>
      <div className="min-h-[400px] rounded-lg">
        {logo?.url && (
          <div
            style={{
              paddingTop: logo.marginTop ? `${logo.marginTop}px` : undefined,
              paddingBottom: logo.marginBottom != null ? `${Math.min(logo.marginBottom, 8)}px` : "0.5rem",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img src={logo.url} alt="" className="home-logo" style={{ maxWidth: logo.size ? `${logo.size}px` : "140px", height: "auto", width: "auto" }} />
          </div>
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
    </PreviewWrapper>
  );
}

export function RsvpPreview({ config }: { config: RsvpConfig }) {
  const heading = resolveTypography(config.heading, "RSVP");
  const buttonLabel = config.buttonLabel || "Submit RSVP";

  return (
    <PreviewWrapper>
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            {heading.text && <h1 className="guest-title mb-2" style={heading.style}>{heading.text}</h1>}
          </div>
          {config.body && <div className="rich-content mb-6" dangerouslySetInnerHTML={{ __html: config.body }} />}
          <div className="event-card space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>Will you attend?</label>
              <div className="flex gap-2">
                <button type="button" className="event-btn-primary flex-1 pointer-events-none">Yes</button>
                <button type="button" className="event-btn-secondary flex-1 pointer-events-none">No</button>
              </div>
            </div>
            <button type="button" className="event-btn-primary w-full pointer-events-none">{buttonLabel}</button>
          </div>
        </div>
      </div>
    </PreviewWrapper>
  );
}
