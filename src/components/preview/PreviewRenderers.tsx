import { type CSSProperties, type ReactNode } from "react";
import type { Json } from "../../lib/supabase";
import { resolveTypography, getTypographyText } from "../../lib/typography";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown, isRsvpClosed } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface CoverConfig {
  layout?: "full" | "split" | "minimal";
  overlay?: number; // 0-1 opacity
  title?: Json; // TypographyStyle
  subtitle?: Json; // TypographyStyle
  showDate?: boolean;
  showVenue?: boolean;
  showCountdown?: boolean;
}

export interface LogoConfig {
  enabled?: boolean;
  src?: string;
  width?: number;
  shape?: "circle" | "square" | "none";
  alt?: string;
}

export interface LoginConfig {
  heading?: Json; // TypographyStyle
  subheading?: Json; // TypographyStyle
  placeholder?: string;
  buttonText?: string;
  showLogo?: boolean;
}

export interface EventContent {
  // Home page content
  eyebrow?: Json;
  title?: Json;
  subtitle?: Json;
  body?: Json; // rich HTML
  logo?: LogoConfig;
  // Cover
  cover?: CoverConfig;
  coverImage?: string;
  // Login
  login?: LoginConfig;
  // RSVP
  rsvpHeading?: Json;
  rsvpBody?: Json;
  rsvpDeadline?: string;
  // Schedule / sub-events
  schedule?: ScheduleItem[];
  // Custom sections
  sections?: CustomSection[];
}

interface ScheduleItem {
  id: string;
  title: string;
  date?: string;
  time?: string;
  venue?: string;
  description?: string;
}

interface CustomSection {
  id: string;
  title?: Json;
  body?: Json;
}

// ---------------------------------------------------------------------------
// Cover Preview
// ---------------------------------------------------------------------------

interface CoverPreviewProps {
  coverImage?: string | null;
  config: CoverConfig | null;
  eventName?: string;
  eventDate?: string | null;
  eventTime?: string | null;
  venue?: string | null;
}

export function CoverPreview({
  coverImage,
  config,
  eventName = "Our Wedding",
  eventDate,
  eventTime,
  venue,
}: CoverPreviewProps) {
  const cfg = config ?? {};
  const layout = cfg.layout ?? "full";
  const overlay = cfg.overlay ?? 0.4;

  const titleTypography = resolveTypography(cfg.title, eventName);
  const subtitleTypography = resolveTypography(cfg.subtitle, "");

  const countdown = eventDate ? getCountdown(eventDate) : null;
  const showCountdown = cfg.showCountdown && countdown && !countdown.isPast;

  const bgStyle: CSSProperties = coverImage
    ? {
        backgroundImage: `url(${coverImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { backgroundColor: "var(--event-surface-alt)" };

  if (layout === "minimal") {
    return (
      <div className="guest-section text-center" style={bgStyle}>
        <div className="mx-auto max-w-2xl">
          <h1 className="guest-title" style={titleTypography.style}>
            {titleTypography.text}
          </h1>
          {cfg.showDate && eventDate && (
            <p className="guest-subtitle">{formatDate(eventDate)}</p>
          )}
          {cfg.showVenue && venue && (
            <p className="guest-subtitle">{venue}</p>
          )}
        </div>
      </div>
    );
  }

  if (layout === "split") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ minHeight: "50vh" }}>
        <div className="flex items-center justify-center p-8" style={bgStyle} />
        <div className="flex items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <h1 className="guest-title" style={titleTypography.style}>
              {titleTypography.text}
            </h1>
            {subtitleTypography.text && (
              <p className="guest-subtitle" style={subtitleTypography.style}>
                {subtitleTypography.text}
              </p>
            )}
            {cfg.showDate && eventDate && (
              <p className="mt-4 text-lg" style={{ color: "var(--event-muted)" }}>
                {formatDate(eventDate)}
                {eventTime && ` · ${formatTime12(eventTime)}`}
              </p>
            )}
            {cfg.showVenue && venue && (
              <p className="mt-1" style={{ color: "var(--event-muted)" }}>{venue}</p>
            )}
            {showCountdown && (
              <CountdownDisplay countdown={countdown!} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full layout (default)
  return (
    <div
      className="relative flex min-h-[50vh] items-center justify-center text-center"
      style={bgStyle}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0)", opacity: overlay }}
      />
      <div className="relative z-10 max-w-2xl px-6 py-12">
        <h1 className="guest-title" style={titleTypography.style}>
          {titleTypography.text}
        </h1>
        {subtitleTypography.text && (
          <p className="guest-subtitle" style={subtitleTypography.style}>
            {subtitleTypography.text}
          </p>
        )}
        {cfg.showDate && eventDate && (
          <p className="mt-4 text-lg" style={{ color: "var(--event-muted)" }}>
            {formatDate(eventDate)}
            {eventTime && ` · ${formatTime12(eventTime)}`}
          </p>
        )}
        {cfg.showVenue && venue && (
          <p className="mt-1" style={{ color: "var(--event-muted)" }}>{venue}</p>
        )}
        {showCountdown && <CountdownDisplay countdown={countdown!} />}
      </div>
    </div>
  );
}

function CountdownDisplay({ countdown }: { countdown: NonNullable<ReturnType<typeof getCountdown>> }) {
  const items = [
    { label: "Days", value: countdown.days },
    { label: "Hours", value: countdown.hours },
    { label: "Minutes", value: countdown.minutes },
    { label: "Seconds", value: countdown.seconds },
  ];
  return (
    <div className="mt-8 flex justify-center gap-4">
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-3xl font-bold" style={{ color: "var(--event-primary)" }}>
            {String(item.value).padStart(2, "0")}
          </div>
          <div className="text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login Preview
// ---------------------------------------------------------------------------

interface LoginPreviewProps {
  config: LoginConfig | null;
  logoConfig?: LogoConfig | null;
}

export function LoginPreview({ config, logoConfig }: LoginPreviewProps) {
  const cfg = config ?? {};
  const headingTypography = resolveTypography(cfg.heading, "Welcome");
  const subheadingTypography = resolveTypography(cfg.subheading, "Enter your username to continue");

  return (
    <div className="guest-section text-center">
      <div className="mx-auto max-w-md">
        {cfg.showLogo && logoConfig?.enabled && logoConfig?.src && (
          <img
            src={logoConfig.src}
            alt={logoConfig.alt ?? ""}
            className="home-logo mb-6"
            style={{ maxWidth: logoConfig.width ?? 80 }}
          />
        )}
        <h1 className="guest-title" style={headingTypography.style}>
          {headingTypography.text}
        </h1>
        <p className="guest-subtitle mx-auto" style={subheadingTypography.style}>
          {subheadingTypography.text}
        </p>
        <div className="mt-8 space-y-3">
          <input
            type="text"
            className="event-input text-center"
            placeholder={cfg.placeholder ?? "Enter your username"}
            disabled
            readOnly
          />
          <button type="button" className="event-btn-primary w-full" disabled>
            {cfg.buttonText ?? "Enter Site"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home Preview
// ---------------------------------------------------------------------------

interface HomePreviewProps {
  content: EventContent | null;
}

export function HomePreview({ content }: HomePreviewProps) {
  const eyebrowTypography = resolveTypography(content?.eyebrow, "");
  const titleTypography = resolveTypography(content?.title, "Our Wedding");
  const subtitleTypography = resolveTypography(content?.subtitle, "");
  const bodyText = getTypographyText(content?.body, "");

  return (
    <div className="guest-section text-center">
      <div className="mx-auto max-w-2xl">
        {/* Logo — rendered above all text, centered, transparent */}
        {content?.logo?.enabled && content?.logo?.src && (
          <img
            src={content.logo.src}
            alt={content.logo.alt ?? ""}
            className="home-logo mb-8"
            style={{ maxWidth: content.logo.width ?? 100 }}
          />
        )}
        {eyebrowTypography.text && (
          <p className="guest-eyebrow" style={eyebrowTypography.style}>
            {eyebrowTypography.text}
          </p>
        )}
        <h1 className="guest-title" style={titleTypography.style}>
          {titleTypography.text}
        </h1>
        {subtitleTypography.text && (
          <p className="guest-subtitle mx-auto" style={subtitleTypography.style}>
            {subtitleTypography.text}
          </p>
        )}
        {bodyText && (
          <div className="mt-6 text-left">
            <RichTextContent html={bodyText} />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RSVP Preview
// ---------------------------------------------------------------------------

interface RsvpPreviewProps {
  content: EventContent | null;
}

export function RsvpPreview({ content }: RsvpPreviewProps) {
  const headingTypography = resolveTypography(content?.rsvpHeading, "RSVP");
  const bodyTypography = resolveTypography(content?.rsvpBody, "Let us know if you can make it!");
  const deadline = content?.rsvpDeadline;
  const closed = isRsvpClosed(deadline);

  return (
    <div className="guest-section text-center">
      <div className="mx-auto max-w-lg">
        <h1 className="guest-title" style={headingTypography.style}>
          {headingTypography.text}
        </h1>
        <p className="guest-subtitle mx-auto" style={bodyTypography.style}>
          {bodyTypography.text}
        </p>

        {closed ? (
          <div className="event-card mt-8">
            <p style={{ color: "var(--event-muted)" }}>
              RSVP is now closed.
            </p>
          </div>
        ) : (
          <div className="event-card mt-8 space-y-4 text-left">
            <div>
              <label className="guest-eyebrow block">Will you attend?</label>
              <div className="mt-2 flex gap-3">
                <button type="button" className="event-btn-primary flex-1" disabled>
                  Joyfully Accept
                </button>
                <button type="button" className="event-btn-secondary flex-1" disabled>
                  Regretfully Decline
                </button>
              </div>
            </div>
            <div>
              <label className="guest-eyebrow block">Number of guests</label>
              <select className="event-input mt-1" disabled>
                <option>1</option>
                <option>2</option>
              </select>
            </div>
            <div>
              <label className="guest-eyebrow block">Message</label>
              <textarea
                className="event-input mt-1"
                rows={3}
                placeholder="Leave a message for the couple…"
                disabled
                readOnly
              />
            </div>
            <button type="button" className="event-btn-primary w-full" disabled>
              Submit RSVP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
