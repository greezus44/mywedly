import { type CSSProperties } from "react";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { resolveTypography, getTypographyStyle, getTypographyText } from "../../lib/typography";
import { formatDateLong, formatTime12, cn } from "../../lib/utils";
import { ButtonColors, buttonColorsToStyle, buttonColorsToHoverStyle } from "../ui/ButtonColourEditor";
import { sanitizeHtml } from "../../lib/sanitize";

export interface CoverConfig {
  background?: { image?: string | null; color?: string; position?: string; fit?: string };
  overlayOpacity?: number;
  eyebrow?: unknown;
  heading?: unknown;
  subheading?: unknown;
  bodyHtml?: string;
  ctaText?: string;
  buttonColors?: ButtonColors;
  logo?: { url?: string | null; size?: number; maxWidth?: number; maxHeight?: number; marginTop?: number; marginBottom?: number; align?: string } | null;
  eyebrowBm?: string;
  headingBm?: string;
  subheadingBm?: string;
  ctaTextBm?: string;
}
export interface LogoConfig { url?: string | null; size?: number; align?: string; marginTop?: number; marginBottom?: number; }
export interface LoginConfig { heading?: unknown; subheading?: unknown; placeholder?: string; placeholderTypography?: import("../../lib/typography").TypographyStyle; buttonLabel?: string; buttonColors?: ButtonColors; headingBm?: string; subheadingBm?: string; placeholderBm?: string; buttonLabelBm?: string; }
export interface HomeLogo { url?: string | null; size?: number; marginTop?: number; marginBottom?: number; }
export interface HomeSection { heading?: unknown; body?: string; bodyBm?: string; bodyTypography?: import("../../lib/typography").TypographyStyle; headingBm?: string; }
export interface EventContent {
  logo?: HomeLogo | null;
  heading?: unknown;
  body?: string;
  sections?: HomeSection[];
  rsvpButtonText?: string;
  rsvpButtonTextBm?: string;
  rsvpButtonColors?: ButtonColors;
  rsvpButtonTypography?: import("../../lib/typography").TypographyStyle;
  wishes?: { heading?: string; subheading?: string; placeholder?: string; submitLabel?: string; buttonColors?: ButtonColors; headingBm?: string; subheadingBm?: string; placeholderBm?: string; submitLabelBm?: string; placeholderTypography?: import("../../lib/typography").TypographyStyle; };
  homeNavLabel?: string;
  homeNavLabelBm?: string;
}

/* ---------- Cover Preview ---------- */

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
  const logoAlign = logo?.align || "center";
  return (
    <EventThemeProvider theme={theme} compact>
      <div className="relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden text-center" style={{ minHeight: "40vh", ...bgStyle }}>
        {bg.image && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />}
        <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 py-10 text-center animate-fadeIn" style={{ whiteSpace: "pre-wrap" }}>
          {logo?.url && <div className="mb-4 flex w-full" style={{ justifyContent: logoAlign === "left" ? "flex-start" : logoAlign === "right" ? "flex-end" : "center" }}><img src={logo.url} alt="Logo" style={{ height: `${logo.size ?? 90}px`, width: "auto", maxHeight: "30vh", maxWidth: logo.maxWidth ? `${logo.maxWidth}px` : undefined, objectFit: "contain", background: "transparent" }} /></div>}
          {eyebrow.text && <p className="guest-eyebrow mb-2" style={{ whiteSpace: "pre-wrap", ...eyebrow.style }}>{eyebrow.text}</p>}
          {heading.text && <h1 className="guest-title mb-3" style={{ whiteSpace: "pre-wrap", ...heading.style }}>{heading.text}</h1>}
          {subheading.text && <p className="guest-subtitle mb-3" style={{ whiteSpace: "pre-wrap", ...subheading.style }}>{subheading.text}</p>}
          {config.bodyHtml && <div className="rich-content mb-6 max-w-md" dangerouslySetInnerHTML={{ __html: sanitizeHtml(config.bodyHtml) }} />}
          <button type="button" className="event-btn-primary" style={buttonColorsToStyle(config.buttonColors)} onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonColorsToHoverStyle(config.buttonColors))} onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonColorsToStyle(config.buttonColors))}>{cta}</button>
        </div>
      </div>
    </EventThemeProvider>
  );
}

/* ---------- Login Preview ---------- */

interface LoginPreviewProps { config: LoginConfig; theme: unknown; eventName?: string; }
export function LoginPreview({ config, theme, eventName }: LoginPreviewProps) {
  const heading = resolveTypography(config.heading, (eventName ?? "") || "Welcome");
  const subheading = resolveTypography(config.subheading, "");
  const placeholder = config.placeholder || "Enter your username";
  const buttonLabel = config.buttonLabel || "Sign In";
  return (
    <EventThemeProvider theme={theme} compact>
      <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            {heading.text && <h1 className="guest-title mb-2" style={heading.style}>{heading.text}</h1>}
            {subheading.text && <p className="guest-subtitle" style={subheading.style}>{subheading.text}</p>}
          </div>
          <div className="space-y-4">
            <input type="text" className="event-input" placeholder={placeholder} style={{ textAlign: "center", ...getTypographyStyle(config.placeholderTypography), fontFamily: config.placeholderTypography?.fontFamily || "var(--event-font-heading)" }} disabled />
            <div className="h-4" />
            <div className="text-center"><button type="button" className="event-btn-primary" style={buttonColorsToStyle(config.buttonColors)} onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonColorsToHoverStyle(config.buttonColors))} onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonColorsToStyle(config.buttonColors))}>{buttonLabel}</button></div>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}

/* ---------- Home Preview ---------- */

interface HomePreviewProps { content: EventContent; theme: unknown; }
export function HomePreview({ content, theme }: HomePreviewProps) {
  const logo = content.logo;
  const sections = content.sections ?? ((content.heading !== undefined || content.body !== undefined) ? [{ heading: content.heading, body: content.body }] : []);
  return (
    <EventThemeProvider theme={theme} compact>
      <div className="guest-home-page">
        {logo?.url && (
          <div style={{ paddingTop: logo.marginTop ? `${logo.marginTop}px` : undefined, paddingBottom: logo.marginBottom != null ? `${Math.min(logo.marginBottom, 8)}px` : "0.5rem", display: "flex", justifyContent: "center" }}>
            <img src={logo.url} alt="" className="home-logo" style={{ maxWidth: logo.size ? `${logo.size}px` : "140px", height: "auto", width: "auto" }} />
          </div>
        )}
        {sections.length === 0 && !logo?.url && (
          <section className="guest-section text-center"><div className="mx-auto max-w-md"><p className="guest-subtitle">No content yet.</p></div></section>
        )}
        {sections.map((section, i) => {
          const heading = resolveTypography(section.heading, "");
          const headingBm = (section as { headingBm?: string }).headingBm || "";
          const bodyStyle = getTypographyStyle(section.bodyTypography);
          const bodyTypography = section.bodyTypography;
          const bodySpacingStyle = bodyTypography?.paragraphSpacing !== undefined
            ? { "--rich-paragraph-spacing": `${bodyTypography.paragraphSpacing}em` }
            : {};
          return (
            <section key={i} className="guest-section" style={i === 0 ? { paddingTop: 0 } : undefined}>
              <div className="mx-auto max-w-3xl">
                {heading.text && <h2 className="guest-title mb-4" style={{ whiteSpace: "pre-wrap", ...heading.style }}>{heading.text}</h2>}
                {section.body && <div className="rich-content" style={{ ...bodyStyle, ...bodySpacingStyle } as CSSProperties} dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.body) }} />}
                {section.bodyBm?.trim() && (
                  <>
                    <div className="my-3 border-t border-dash-border/40" />
                    {headingBm && <h2 className="guest-title mb-4" style={{ whiteSpace: "pre-wrap", ...heading.style }}>{headingBm}</h2>}
                    <div className="rich-content" style={{ ...bodyStyle, ...bodySpacingStyle } as CSSProperties} dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.bodyBm) }} />
                  </>
                )}
              </div>
            </section>
          );
        })}
        <section className="rsvp-section text-center" style={{ paddingTop: "1.5rem", paddingBottom: "2.5rem" }}>
          <button type="button" className="event-btn-primary" style={{ ...buttonColorsToStyle(content.rsvpButtonColors), ...getTypographyStyle(content.rsvpButtonTypography) }} onMouseEnter={(e) => Object.assign(e.currentTarget.style, { ...buttonColorsToStyle(content.rsvpButtonColors), ...getTypographyStyle(content.rsvpButtonTypography), ...buttonColorsToHoverStyle(content.rsvpButtonColors) })} onMouseLeave={(e) => Object.assign(e.currentTarget.style, { ...buttonColorsToStyle(content.rsvpButtonColors), ...getTypographyStyle(content.rsvpButtonTypography) })}>{content.rsvpButtonText || "RSVP Now"}</button>
        </section>
      </div>
    </EventThemeProvider>
  );
}

/* ---------- RSVP Preview ---------- */

const ATTENDING_SELECTED_COLORS: ButtonColors = { bgColor: "#16a34a", textColor: "#ffffff", borderColor: "#16a34a", hoverBgColor: "#15803d", hoverTextColor: "#ffffff", hoverBorderColor: "#15803d" };
const DECLINED_SELECTED_COLORS: ButtonColors = { bgColor: "#dc2626", textColor: "#ffffff", borderColor: "#dc2626", hoverBgColor: "#b91c1c", hoverTextColor: "#ffffff", hoverBorderColor: "#b91c1c" };
const BLACK_TEXT = "#1a1a1a";

interface RsvpSubEventPreview { name?: string | null; date?: string | null; time?: string | null; venue?: string | null; address?: string | null; }

interface RsvpPreviewProps {
  theme: unknown;
  content?: Record<string, unknown> | null;
  eventDate?: string | null;
  eventTime?: string | null;
  venue?: string | null;
  address?: string | null;
  eventName?: string | null;
  subEvents?: RsvpSubEventPreview[];
  schedule?: { title?: string; start_time?: string | null; end_time?: string | null; sub_event_id?: string | null }[];
}

function toDateForDisplay(d: string): Date {
  if (d.length === 10) return new Date(d + "T00:00:00");
  if (/T\d{2}:\d{2}([:.]\d{2})?Z?$/.test(d)) {
    const date = new Date(d);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
  }
  return new Date(d);
}

function getDateParts(dateStr: string | null | undefined): { weekday: string; day: string; month: string; year: string } | null {
  if (!dateStr) return null;
  const date = toDateForDisplay(dateStr);
  if (isNaN(date.getTime())) return null;
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
    day: date.toLocaleDateString("en-US", { day: "numeric" }),
    month: date.toLocaleDateString("en-US", { month: "long" }),
    year: date.toLocaleDateString("en-US", { year: "numeric" }),
  };
}

function formatScheduleTimeRange(startTime: string | null | undefined, endTime: string | null | undefined): string {
  const start = formatTime12(startTime);
  const end = formatTime12(endTime);
  if (!start || !end) return start || end;
  const startPeriod = start.match(/\s(AM|PM)$/)?.[1];
  const endPeriod = end.match(/\s(AM|PM)$/)?.[1];
  if (startPeriod && startPeriod === endPeriod) return `${start.slice(0, -startPeriod.length).trim()} \u2013 ${end}`;
  return `${start} \u2013 ${end}`;
}

export function RsvpPreview({ theme, content, eventDate, eventTime, venue, address, eventName, subEvents = [], schedule = [] }: RsvpPreviewProps) {
  const c = content as {
    title?: string; titleTypography?: unknown; subtitle?: string; subtitleTypography?: unknown;
    attendingText?: string; declinedText?: string; attendingMessage?: string; declinedMessage?: string;
    attendingColor?: string; declinedColor?: string;
    attendingButtonColors?: ButtonColors; declinedButtonColors?: ButtonColors;
    attendingSelectedButtonColors?: ButtonColors; declinedSelectedButtonColors?: ButtonColors;
    scheduleHeading?: unknown; scheduleHeadingTypographyBm?: unknown;
    guestNameTypography?: unknown; additionalInfoHeading?: unknown; additionalInfoBody?: string;
    additionalInfoBodyTypography?: unknown;
    eventNameTypography?: unknown; eventDateTypography?: unknown; eventTimeTypography?: unknown;
    eventAddressTypography?: unknown; programmeItemTypography?: unknown;
    rsvpDeadlineTypography?: unknown; rsvpDeadlinePrefix?: string;
    contactMessage?: string; contactMessageTypography?: unknown;
    attendingButtonTypography?: unknown; declinedButtonTypography?: unknown;
  } | null;

  const titleStyle = getTypographyStyle(c?.titleTypography);
  const subtitleStyle = getTypographyStyle(c?.subtitleTypography);
  const subtitleText = getTypographyText(c?.subtitleTypography, c?.subtitle ?? "");
  const guestNameStyle = getTypographyStyle(c?.guestNameTypography);
  const eventNameStyle = getTypographyStyle(c?.eventNameTypography);
  const eventDateStyle = getTypographyStyle(c?.eventDateTypography);
  const eventDateFontStyle = eventDateStyle.fontFamily ? { fontFamily: eventDateStyle.fontFamily } : {};
  const eventTimeStyle = getTypographyStyle(c?.eventTimeTypography);
  const eventAddressStyle = getTypographyStyle(c?.eventAddressTypography);
  const programmeItemStyle = getTypographyStyle(c?.programmeItemTypography);
  const rsvpDeadlineStyle = getTypographyStyle(c?.rsvpDeadlineTypography);
  const additionalInfoHeadingStyle = getTypographyStyle(c?.additionalInfoHeading);
  const additionalInfoBodyStyle = getTypographyStyle(c?.additionalInfoBodyTypography);
  const contactMessageStyle = getTypographyStyle(c?.contactMessageTypography);
  const attendingButtonFontStyle = getTypographyStyle(c?.attendingButtonTypography);
  const declinedButtonFontStyle = getTypographyStyle(c?.declinedButtonTypography);
  const scheduleHeadingStyle = getTypographyStyle(c?.scheduleHeading);
  const scheduleHeadingText = getTypographyText(c?.scheduleHeading, "Program");

  const attendingSelectedColors: ButtonColors = c?.attendingSelectedButtonColors ?? (c?.attendingColor ? { bgColor: c.attendingColor, textColor: "#ffffff", borderColor: c.attendingColor, hoverBgColor: c.attendingColor } : ATTENDING_SELECTED_COLORS);
  const declinedSelectedColors: ButtonColors = c?.declinedSelectedButtonColors ?? (c?.declinedColor ? { bgColor: c.declinedColor, textColor: "#ffffff", borderColor: c.declinedColor, hoverBgColor: c.declinedColor } : DECLINED_SELECTED_COLORS);
  const attendingUnselectedColors = c?.attendingButtonColors;
  const declinedUnselectedColors = c?.declinedButtonColors;

  const attendingSelectedStyle = (isSelected: boolean): CSSProperties => {
    if (isSelected) return buttonColorsToStyle(attendingSelectedColors);
    const base: CSSProperties = { ...buttonColorsToStyle(attendingUnselectedColors) };
    if (!base.borderColor) { base.borderColor = "var(--event-border)"; base.borderStyle = "solid"; }
    if (!base.backgroundColor) base.backgroundColor = "transparent";
    if (!base.color) base.color = "var(--event-text)";
    return base;
  };
  const declinedSelectedStyle = (isSelected: boolean): CSSProperties => {
    if (isSelected) return buttonColorsToStyle(declinedSelectedColors);
    const base: CSSProperties = { ...buttonColorsToStyle(declinedUnselectedColors) };
    if (!base.borderColor) { base.borderColor = "var(--event-border)"; base.borderStyle = "solid"; }
    if (!base.backgroundColor) base.backgroundColor = "transparent";
    if (!base.color) base.color = "var(--event-text)";
    return base;
  };

  const rsvpDeadline = (content as { rsvpDeadline?: string } | null)?.rsvpDeadline as string | null | undefined;

  const additionalInfoHeadingText = getTypographyText(c?.additionalInfoHeading, "");
  const additionalInfoBody = c?.additionalInfoBody;
  const showAdditionalInfo = !!(additionalInfoHeadingText || (additionalInfoBody && additionalInfoBody.trim()));

  const renderDateColumn = (dateStr: string | null | undefined) => {
    const parts = getDateParts(dateStr);
    if (!parts) return null;
    return (
      <div className="flex flex-col items-center text-center flex-shrink-0" style={{ minWidth: "56px", textTransform: "uppercase" }}>
        <span className="text-[0.625rem] uppercase tracking-wide" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)", ...eventDateFontStyle }}>{parts.weekday.toUpperCase()}</span>
        <span className="text-2xl font-bold leading-tight" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)", ...eventDateFontStyle }}>{parts.day}</span>
        <span className="text-xs" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)", ...eventDateFontStyle }}>{parts.month.toUpperCase()}</span>
        <span className="text-xs" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)", ...eventDateFontStyle }}>{parts.year}</span>
      </div>
    );
  };

  const renderSchedule = (subEventId: string | null) => {
    const items = schedule.filter((s) => (subEventId ? s.sub_event_id === subEventId : !s.sub_event_id));
    if (items.length === 0) return null;
    return (
      <div className="mt-3">
        <h3 className="mb-2 text-sm font-semibold" style={{ fontFamily: "var(--event-font-heading)", color: BLACK_TEXT, ...scheduleHeadingStyle }}>{scheduleHeadingText}</h3>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="grid items-start gap-2" style={{ gridTemplateColumns: "auto 1fr" }}>
              <span className="text-xs font-medium leading-snug" style={{ color: BLACK_TEXT, fontFamily: "var(--event-font-body)", ...programmeItemStyle }}>{formatScheduleTimeRange(item.start_time, item.end_time)}</span>
              <span className="text-xs font-medium leading-snug" style={{ color: BLACK_TEXT, fontFamily: "var(--event-font-heading)", ...programmeItemStyle }}>{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAdditionalInfo = () => {
    if (!showAdditionalInfo) return null;
    return (
      <div className="mt-3">
        {additionalInfoHeadingText && <h3 className="mb-1 text-sm font-semibold" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)", ...additionalInfoHeadingStyle }}>{additionalInfoHeadingText}</h3>}
        {additionalInfoBody && <div className="text-xs" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)", whiteSpace: "pre-wrap", ...additionalInfoBodyStyle }}>{additionalInfoBody}</div>}
      </div>
    );
  };

  const renderRsvpButtons = () => (
    <div className="mt-4">
      <div className="flex gap-2">
        <button type="button" className="event-btn-primary rsvp-toggle-btn" style={{ flex: 1, opacity: 0.6, ...attendingSelectedStyle(false), ...attendingButtonFontStyle }} disabled>
          {c?.attendingText || "Attending"}
        </button>
        <button type="button" className="event-btn-secondary rsvp-toggle-btn" style={{ flex: 1, opacity: 0.6, ...declinedSelectedStyle(false), ...declinedButtonFontStyle }} disabled>
          {c?.declinedText || "Declined"}
        </button>
      </div>
    </div>
  );

  const renderEventBlock = (name: string, dateStr: string | null, timeStr: string | null, venueStr: string | null, addressStr: string | null, subEventId: string | null) => (
    <div className="flex flex-row items-start gap-1.5">
      {renderDateColumn(dateStr)}
      <div className="flex-1 min-w-0">
        {name && <h2 className="text-base font-bold mb-1 break-words" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)", ...eventNameStyle }}>{name}</h2>}
        {timeStr && <p className="text-xs mb-0.5" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)", whiteSpace: "nowrap", ...eventTimeStyle }}>{formatTime12(timeStr)}</p>}
        {venueStr && <p className="text-xs" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)", ...eventTimeStyle }}>{venueStr}</p>}
        {addressStr && <p className="text-xs" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)", ...eventAddressStyle }}>{addressStr}</p>}
        {renderSchedule(subEventId)}
        {renderAdditionalInfo()}
        {renderRsvpButtons()}
      </div>
    </div>
  );

  const hasSubEvents = subEvents.length > 0;

  return (
    <EventThemeProvider theme={theme} compact>
      <div className="guest-section guest-rsvp-page">
        <div className="mx-auto max-w-2xl guest-rsvp-content">
          <div className={cn("text-center pt-6", (c?.title || rsvpDeadline || c?.subtitle) && "mb-8")}>
            {c?.title && <h1 className="guest-title text-center" style={{ whiteSpace: "pre-wrap", marginBottom: 0, ...titleStyle }}>{c.title}</h1>}
            {rsvpDeadline && (
              <p className="text-center" style={{ whiteSpace: "pre-wrap", marginTop: "4px", marginBottom: 0, ...rsvpDeadlineStyle, color: rsvpDeadlineStyle.color || "var(--event-muted)", textTransform: "uppercase" }}>
                {(c?.rsvpDeadlinePrefix || "RSVP by").toUpperCase()} {formatDateLong(rsvpDeadline).toUpperCase()}
              </p>
            )}
            <p className="guest-subtitle text-center" style={{ margin: "20px auto 0", whiteSpace: "pre-wrap", ...guestNameStyle }}>Guest Name</p>
            {subtitleText && <p className="guest-subtitle text-center" style={{ margin: "0 auto", whiteSpace: "pre-wrap", ...subtitleStyle }}>{subtitleText}</p>}
          </div>

          {hasSubEvents ? (
            <div className="space-y-5">
              {subEvents.map((se, i) => (
                <div key={i}>
                  {i > 0 && <hr className="border-0 border-t my-4" style={{ borderColor: "var(--event-border)" }} />}
                  {renderEventBlock(se.name ?? "", se.date ?? null, se.time ?? null, se.venue ?? null, se.address ?? null, null)}
                </div>
              ))}
            </div>
          ) : (
            renderEventBlock(eventName ?? "", eventDate ?? null, eventTime ?? null, venue ?? null, address ?? null, null)
          )}

          {c?.contactMessage?.trim() && (
            <div className="mt-6 text-center">
              <p style={{ whiteSpace: "pre-wrap", color: "var(--event-muted)", fontFamily: "var(--event-font-body)", ...contactMessageStyle }}>{c.contactMessage}</p>
            </div>
          )}

          <div className="text-center" style={{ paddingTop: "1.5rem", paddingBottom: "2.5rem" }}>
            <button type="button" className="event-btn-primary" style={{ ...buttonColorsToStyle(undefined), ...getTypographyStyle(undefined) }}>
              <span>&gt;</span>
            </button>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}
