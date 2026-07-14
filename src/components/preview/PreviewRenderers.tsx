import type { CSSProperties } from "react";
import type { Json } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";
import { resolveTypography } from "../../lib/typography";
import { RichTextContent } from "../../lib/sanitize";

// --- Config Interfaces ---

export interface CoverConfig {
  layout?: "centered" | "split" | "minimal";
  heading?: TypographyLike;
  subheading?: TypographyLike;
  dateText?: TypographyLike;
  venueText?: TypographyLike;
  showCountdown?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
}

export interface LogoConfig {
  src?: string | null;
  width?: number;
  height?: number;
  borderRadius?: number;
  position?: "top-left" | "top-right" | "top-center" | "hidden";
}

export interface LoginConfig {
  heading?: TypographyLike;
  subheading?: TypographyLike;
  placeholder?: string;
  buttonText?: string;
  showUsernameHint?: boolean;
}

export interface EventContent {
  // Home page
  homeTitle?: TypographyLike;
  homeSubtitle?: TypographyLike;
  homeBody?: string;
  homeCtaText?: string;
  logo?: LogoConfig;
  // Schedule
  scheduleTitle?: TypographyLike;
  scheduleItems?: ScheduleItem[];
  // RSVP
  rsvpTitle?: TypographyLike;
  rsvpBody?: string;
  rsvpCtaText?: string;
  // Custom sections
  sections?: ContentSection[];
}

interface TypographyLike {
  text?: string;
  align?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  italic?: boolean;
  underline?: boolean;
}

interface ScheduleItem {
  title: string;
  time?: string;
  location?: string;
  description?: string;
}

interface ContentSection {
  id: string;
  title?: string;
  body?: string;
}

// --- Helper: convert config JSON to typed config ---

function asConfig<T>(json: Json | null | undefined, defaults: T): T {
  if (!json || typeof json !== "object" || Array.isArray(json)) return defaults;
  return { ...defaults, ...(json as Record<string, unknown>) } as T;
}

const defaultCover: CoverConfig = {
  layout: "centered",
  showCountdown: true,
  overlayOpacity: 0.3,
};

const defaultLogin: LoginConfig = {
  buttonText: "Enter",
  placeholder: "Enter your username",
  showUsernameHint: true,
};

const defaultContent: EventContent = {
  homeCtaText: "View Details",
  scheduleTitle: { text: "Schedule" },
  rsvpCtaText: "RSVP Now",
};

// --- CoverPreview ---

export interface CoverPreviewProps {
  coverImage: string | null;
  coverConfig: Json | null | undefined;
  eventName: string | null;
  eventDate: string | null;
  eventTime: string | null;
  venue: string | null;
  className?: string;
}

export function CoverPreview({
  coverImage,
  coverConfig,
  eventName,
  eventDate,
  eventTime,
  venue,
  className,
}: CoverPreviewProps) {
  const config = asConfig(coverConfig, defaultCover);
  const heading = resolveTypography(config.heading, eventName || "Our Wedding");
  const subheading = resolveTypography(config.subheading, "We invite you to celebrate with us");
  const dateText = resolveTypography(config.dateText, eventDate ? formatDate(eventDate) : "");
  const venueText = resolveTypography(config.venueText, venue || "");

  const countdown = getCountdown(eventDate);

  return (
    <div
      className={cn("relative flex min-h-[400px] items-center justify-center overflow-hidden rounded-lg", className)}
    >
      {coverImage ? (
        <img src={coverImage} alt="Cover" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-event-primary/20 to-event-accent/20" />
      )}
      {(config.overlayColor || coverImage) && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: config.overlayColor || "rgba(0,0,0,0.3)",
            opacity: config.overlayOpacity ?? 0.3,
          }}
        />
      )}
      <div className="relative z-10 px-6 py-12 text-center">
        <h1 className="guest-title" style={heading.style}>
          {heading.text}
        </h1>
        {subheading.text && (
          <p className="guest-subtitle mt-2" style={subheading.style}>
            {subheading.text}
          </p>
        )}
        {dateText.text && (
          <p className="mt-4 text-lg" style={dateText.style}>
            {dateText.text}
            {eventTime && <span> · {formatTime12(eventTime)}</span>}
          </p>
        )}
        {venueText.text && (
          <p className="mt-1 text-base" style={venueText.style}>
            {venueText.text}
          </p>
        )}
        {config.showCountdown && !countdown.isPast && eventDate && (
          <div className="mt-6 flex justify-center gap-4">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
              { label: "Seconds", value: countdown.seconds },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-2xl font-bold" style={{ color: "var(--event-heading)" }}>
                  {item.value}
                </div>
                <div className="text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- LoginPreview ---

export interface LoginPreviewProps {
  loginConfig: Json | null | undefined;
  className?: string;
}

export function LoginPreview({ loginConfig, className }: LoginPreviewProps) {
  const config = asConfig(loginConfig, defaultLogin);
  const heading = resolveTypography(config.heading, "Welcome");
  const subheading = resolveTypography(config.subheading, "Please enter your username to continue");

  return (
    <div className={cn("flex min-h-[300px] items-center justify-center", className)}>
      <div className="event-card w-full max-w-md text-center">
        <h2 className="guest-title" style={heading.style}>
          {heading.text}
        </h2>
        {subheading.text && (
          <p className="guest-subtitle mt-2" style={subheading.style}>
            {subheading.text}
          </p>
        )}
        <div className="mt-6">
          <input
            type="text"
            className="event-input"
            placeholder={config.placeholder || "Enter your username"}
            disabled
          />
        </div>
        <button type="button" className="event-btn-primary mt-4" disabled>
          {config.buttonText || "Enter"}
        </button>
        {config.showUsernameHint && (
          <p className="mt-3 text-xs" style={{ color: "var(--event-muted)" }}>
            Check your invitation for your unique username
          </p>
        )}
      </div>
    </div>
  );
}

// --- HomePreview ---

export interface HomePreviewProps {
  content: Json | null | undefined;
  logoConfig: Json | null | undefined;
  className?: string;
}

export function HomePreview({ content, logoConfig, className }: HomePreviewProps) {
  const config = asConfig(content, defaultContent);
  const title = resolveTypography(config.homeTitle, "Our Wedding");
  const subtitle = resolveTypography(config.homeSubtitle, "Join us as we celebrate our special day");

  // Resolve logo
  const logo = asConfig<LogoConfig>(logoConfig, {});
  const showLogo = logo.src && logo.position !== "hidden";

  return (
    <div className={cn("guest-section text-center", className)}>
      {showLogo && (
        <img
          src={logo.src!}
          alt="Logo"
          className="home-logo mb-6"
          style={{
            maxWidth: logo.width ? `${logo.width}px` : "120px",
            maxHeight: logo.height ? `${logo.height}px` : "120px",
            borderRadius: logo.borderRadius ? `${logo.borderRadius}px` : undefined,
          }}
        />
      )}
      <p className="guest-eyebrow">We invite you to</p>
      <h1 className="guest-title" style={title.style}>
        {title.text}
      </h1>
      {subtitle.text && (
        <p className="guest-subtitle mx-auto mt-2" style={subtitle.style}>
          {subtitle.text}
        </p>
      )}
      {config.homeBody && (
        <RichTextContent
          html={config.homeBody}
          className="mx-auto mt-6 max-w-2xl"
        />
      )}
      <button type="button" className="event-btn-primary mt-6" disabled>
        {config.homeCtaText || "View Details"}
      </button>
    </div>
  );
}

// --- RsvpPreview ---

export interface RsvpPreviewProps {
  content: Json | null | undefined;
  className?: string;
}

export function RsvpPreview({ content, className }: RsvpPreviewProps) {
  const config = asConfig(content, defaultContent);
  const title = resolveTypography(config.rsvpTitle, "RSVP");

  return (
    <div className={cn("guest-section text-center", className)}>
      <h2 className="guest-title" style={title.style}>
        {title.text}
      </h2>
      {config.rsvpBody && (
        <RichTextContent
          html={config.rsvpBody}
          className="mx-auto mt-4 max-w-2xl"
        />
      )}
      <div className="event-card mx-auto mt-6 max-w-md text-left">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-muted)" }}>
              Will you attend?
            </label>
            <div className="flex gap-2">
              <button type="button" className="event-btn-primary" disabled>Yes</button>
              <button type="button" className="event-btn-secondary" disabled>No</button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-muted)" }}>
              Number of guests
            </label>
            <input type="number" className="event-input" disabled defaultValue={1} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-muted)" }}>
              Message (optional)
            </label>
            <textarea className="event-input" disabled rows={3} placeholder="Leave a message for the host..." />
          </div>
        </div>
        <button type="button" className="event-btn-primary mt-4 w-full" disabled>
          {config.rsvpCtaText || "Submit RSVP"}
        </button>
      </div>
    </div>
  );
}
