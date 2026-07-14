import { resolveTypography } from "../../lib/typography";
import { jsonToTheme, themeToEventCssVars } from "../../lib/theme";
import { EventThemeProvider } from "../../lib/theme-context";
import { RichTextContent } from "../../lib/sanitize";
import type { UserEvent, Json } from "../../lib/supabase";

// ---- Config Interfaces ----

export interface CoverConfig {
  eyebrow?: TypographyValue;
  heading?: TypographyValue;
  subheading?: TypographyValue;
  layout?: string;
  overlay?: number;
  overlayColor?: string;
}

export interface LogoConfig {
  image?: string | null;
  width?: number;
  height?: number;
  borderRadius?: string;
  position?: string;
  background?: string;
}

export interface LoginConfig {
  heading?: TypographyValue;
  subheading?: TypographyValue;
  buttonText?: string;
  placeholder?: string;
}

export interface EventContent {
  home?: {
    heading?: TypographyValue;
    body?: string;
  };
  story?: {
    heading?: TypographyValue;
    body?: string;
  };
  [key: string]: unknown;
}

type TypographyValue = Parameters<typeof resolveTypography>[0];

// ---- CoverPreview ----

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
  const fullTheme = jsonToTheme(theme ?? event.theme);
  const cssVars = themeToEventCssVars(fullTheme) as React.CSSProperties;
  const cfg = coverConfig ?? (event.cover_config as CoverConfig | undefined);
  const logo = logoConfig ?? (event.logo_config as LogoConfig | undefined);
  const image = coverImage ?? event.cover_image;

  const eyebrow = resolveTypography(cfg?.eyebrow, event.event_type || "");
  const heading = resolveTypography(cfg?.heading, event.name || "");
  const subheading = resolveTypography(cfg?.subheading, "");

  return (
    <EventThemeProvider theme={theme ?? event.theme}>
      <div
        className="event-themed relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-lg"
        style={cssVars}
      >
        {image && (
          <>
            <img
              src={image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: cfg?.overlayColor ?? "rgba(0,0,0,0.4)",
                opacity: cfg?.overlay ?? 0.5,
              }}
            />
          </>
        )}
        <div className="relative z-10 flex flex-col items-center px-6 py-12 text-center">
          {logo?.image && (
            <img
              src={logo.image}
              alt="Logo"
              style={{
                width: logo.width ? `${logo.width}px` : "80px",
                height: logo.height ? `${logo.height}px` : "80px",
                borderRadius: logo.borderRadius ?? "0",
                background: "transparent",
                marginBottom: "1.5rem",
                objectFit: "contain",
              }}
            />
          )}
          {eyebrow.text && (
            <p
              className="guest-eyebrow"
              style={eyebrow.style}
            >
              {eyebrow.text}
            </p>
          )}
          {heading.text && (
            <h1
              className="guest-title"
              style={heading.style}
            >
              {heading.text}
            </h1>
          )}
          {subheading.text && (
            <p
              className="guest-subtitle"
              style={subheading.style}
            >
              {subheading.text}
            </p>
          )}
        </div>
      </div>
    </EventThemeProvider>
  );
}

// ---- LoginPreview ----

interface LoginPreviewProps {
  event: UserEvent;
  theme?: Json | null;
  loginConfig?: LoginConfig;
}

export function LoginPreview({ event, theme, loginConfig }: LoginPreviewProps) {
  const fullTheme = jsonToTheme(theme ?? event.theme);
  const cssVars = themeToEventCssVars(fullTheme) as React.CSSProperties;
  // Use loginConfig prop or fall back to event.login_config (PUBLISHED, NOT draft)
  const cfg = loginConfig ?? (event.login_config as LoginConfig | undefined);

  const heading = resolveTypography(cfg?.heading, "Welcome");
  const subheading = resolveTypography(cfg?.subheading, "Please sign in to continue");
  const buttonText = cfg?.buttonText ?? "Sign In";
  const placeholder = cfg?.placeholder ?? "Enter your username";

  return (
    <EventThemeProvider theme={theme ?? event.theme}>
      <div
        className="event-themed flex min-h-[400px] flex-col items-center justify-center rounded-lg guest-section-tight"
        style={cssVars}
      >
        <div className="w-full max-w-sm text-center">
          {heading.text && (
            <h2 className="guest-title" style={heading.style}>
              {heading.text}
            </h2>
          )}
          {subheading.text && (
            <p className="guest-subtitle mb-6" style={subheading.style}>
              {subheading.text}
            </p>
          )}
          <input
            type="text"
            placeholder={placeholder}
            className="event-input mb-4"
            style={{ textAlign: "center" }}
            readOnly
          />
          <button type="button" className="event-btn-primary w-full">
            {buttonText}
          </button>
        </div>
      </div>
    </EventThemeProvider>
  );
}

// ---- HomePreview ----

interface HomePreviewProps {
  event: UserEvent;
  theme?: Json | null;
  content?: EventContent;
}

export function HomePreview({ event, theme, content }: HomePreviewProps) {
  const fullTheme = jsonToTheme(theme ?? event.theme);
  const cssVars = themeToEventCssVars(fullTheme) as React.CSSProperties;
  const cfg = content ?? (event.content as EventContent | undefined);
  const home = cfg?.home;

  const heading = resolveTypography(home?.heading, event.name || "Welcome");

  return (
    <EventThemeProvider theme={theme ?? event.theme}>
      <div
        className="event-themed flex min-h-[400px] flex-col items-center justify-center rounded-lg guest-section-tight"
        style={cssVars}
      >
        <div className="w-full max-w-2xl text-center">
          {heading.text && (
            <h2 className="guest-title mb-4" style={heading.style}>
              {heading.text}
            </h2>
          )}
          {home?.body && (
            <RichTextContent html={home.body} className="guest-subtitle" />
          )}
        </div>
      </div>
    </EventThemeProvider>
  );
}

// ---- RsvpPreview ----

interface RsvpPreviewProps {
  event: UserEvent;
  theme?: Json | null;
}

export function RsvpPreview({ event, theme }: RsvpPreviewProps) {
  const fullTheme = jsonToTheme(theme ?? event.theme);
  const cssVars = themeToEventCssVars(fullTheme) as React.CSSProperties;

  return (
    <EventThemeProvider theme={theme ?? event.theme}>
      <div
        className="event-themed flex min-h-[400px] flex-col items-center justify-center rounded-lg guest-section-tight"
        style={cssVars}
      >
        <div className="w-full max-w-sm text-center">
          <h2 className="guest-title mb-2">RSVP</h2>
          <p className="guest-subtitle mb-6">
            Will you be joining us to celebrate?
          </p>
          <div className="flex flex-col gap-3">
            <button type="button" className="event-btn-primary">
              Joyfully Accepts
            </button>
            <button type="button" className="event-btn-secondary">
              Regretfully Declines
            </button>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}
