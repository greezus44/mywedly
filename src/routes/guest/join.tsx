import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventGuest, type EventSchedule, type Json } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { useSignInGuest } from "../../lib/guest-auth";
import { LanguageToggle } from "../../components/site/LanguageToggle";
import { useLanguage } from "../../lib/language";
import { setCurrentLanguage, getCurrentLanguage } from "../../lib/translations";
import { formatDateLong, formatTime12 } from "../../lib/utils";
import { buttonColorsToStyle, buttonColorsToHoverStyle, type ButtonColors } from "../../components/ui/ButtonColourEditor";
import type { TypographyStyle } from "../../lib/typography";
import { getTypographyStyle } from "../../lib/typography";

interface PageConfig {
  heading?: string;
  headingBm?: string;
  intro?: string;
  introBm?: string;
  nameLabel?: string;
  nameLabelBm?: string;
  attendingLabel?: string;
  attendingLabelBm?: string;
  decliningLabel?: string;
  decliningLabelBm?: string;
  submitLabel?: string;
  submitLabelBm?: string;
  thankYouAttending?: string;
  thankYouAttendingBm?: string;
  thankYouDeclined?: string;
  thankYouDeclinedBm?: string;
  namePlaceholder?: string;
  namePlaceholderBm?: string;
  scheduleHeading?: string;
  scheduleHeadingBm?: string;
  attendingColor?: string;
  declinedColor?: string;
  buttonColors?: ButtonColors;
  attendingColors?: ButtonColors;
  declinedColors?: ButtonColors;
  plusOneYesColors?: ButtonColors;
  plusOneNoColors?: ButtonColors;
  plusOneQuestion?: string;
  plusOneQuestionBm?: string;
  plusOneYesLabel?: string;
  plusOneYesLabelBm?: string;
  plusOneNoLabel?: string;
  plusOneNoLabelBm?: string;
  nameWeight?: number;
  attendingWeight?: number;
  decliningWeight?: number;
  submitWeight?: number;
  plusOneYesWeight?: number;
  plusOneNoWeight?: number;
  nameColor?: string;
  attendingTextColor?: string;
  decliningTextColor?: string;
  submitTextColor?: string;
  plusOneYesTextColor?: string;
  plusOneNoTextColor?: string;
  plusOneQuestionColor?: string;
  phoneEnabled?: boolean;
  phoneQuestion?: string;
  phoneQuestionBm?: string;
  phoneHelper?: string;
  phoneHelperBm?: string;
  phoneExample?: string;
  phoneExampleBm?: string;
  phoneExampleColor?: string;
  phoneExampleTypography?: TypographyStyle;
  headingTypography?: TypographyStyle;
  introTypography?: TypographyStyle;
  eventTitleTypography?: TypographyStyle;
  eventTimeTypography?: TypographyStyle;
  eventAddressTypography?: TypographyStyle;
  scheduleHeadingTypography?: TypographyStyle;
  programmeItemTypography?: TypographyStyle;
  rsvpDeadlineTypography?: TypographyStyle;
  nameLabelTypography?: TypographyStyle;
  nameInputTypography?: TypographyStyle;
  attendingTypography?: TypographyStyle;
  declinedTypography?: TypographyStyle;
  plusOneQuestionTypography?: TypographyStyle;
  phoneQuestionTypography?: TypographyStyle;
  phoneHelperTypography?: TypographyStyle;
  plusOneYesTypography?: TypographyStyle;
  plusOneNoTypography?: TypographyStyle;
  selectedAnswerTypography?: TypographyStyle;
  submitTypography?: TypographyStyle;
  logoUrl?: string;
  logoSize?: number;
}

const BLACK_TEXT = "#1a1a1a";
const DEFAULT_PHONE_EXAMPLE = "+60 12-345 6789";

interface LookupResult {
  link: {
    id: string;
    token: string;
    event_id: string;
    sub_event_id: string;
    allow_plus_one: boolean;
    is_enabled: boolean;
    page_config: Json;
  };
  sub_event: {
    id: string;
    name: string;
    name_bm: string | null;
    date: string | null;
    time: string | null;
    start_time: string | null;
    end_time: string | null;
    venue: string | null;
    address: string | null;
    description: string | null;
    rsvp_deadline: string | null;
  };
  event: {
    id: string;
    slug: string;
    name: string;
    name_bm: string | null;
    theme: Json;
    login_config: Json | null;
  };
}

type Step = "form" | "done";

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
  const bm = getCurrentLanguage() === "bm";
  const bmMonths = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
  const bmWeekdays = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
  return {
    weekday: bm ? bmWeekdays[date.getDay()] : date.toLocaleDateString("en-US", { weekday: "long" }),
    day: date.toLocaleDateString("en-US", { day: "numeric" }),
    month: bm ? bmMonths[date.getMonth()] : date.toLocaleDateString("en-US", { month: "long" }),
    year: date.toLocaleDateString("en-US", { year: "numeric" }),
  };
}

function formatScheduleTimeRange(startTime: string | null | undefined, endTime: string | null | undefined): string {
  const start = formatTime12(startTime);
  const end = formatTime12(endTime);
  if (!start || !end) return start || end;
  const startPeriod = start.match(/\s(AM|PM|pagi|ptg|malam|tengah hari)$/)?.[1];
  const endPeriod = end.match(/\s(AM|PM|pagi|ptg|malam|tengah hari)$/)?.[1];
  if (startPeriod && startPeriod === endPeriod) {
    return `${start.slice(0, -startPeriod.length).trim()} \u2013 ${end}`;
  }
  return `${start} \u2013 ${end}`;
}

export default function GuestJoin() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  setCurrentLanguage(language);
  const signInGuest = useSignInGuest();

  const [name, setName] = useState("");
  const [status, setStatus] = useState<"attending" | "declined" | "">("");
  const [bringingPlusOne, setBringingPlusOne] = useState<"yes" | "no" | "">("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>("form");

  const { data: lookup, isLoading } = useQuery({
    queryKey: ["open-rsvp-lookup", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("open_rsvp_lookup", { p_token: token! });
      if (error) throw error;
      return (data ?? null) as LookupResult | null;
    },
    enabled: !!token,
  });

  const { data: schedule } = useQuery({
    queryKey: ["open-rsvp-schedule", lookup?.event?.id, lookup?.sub_event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", lookup!.event.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
    enabled: !!lookup?.event?.id,
  });

  const pageConfig = (lookup?.link?.page_config ?? {}) as PageConfig;
  const subEvent = lookup?.sub_event;
  const event = lookup?.event;
  const loginConfig = (event?.login_config ?? {}) as { buttonColors?: ButtonColors };
  const pageButtonColors = pageConfig.buttonColors;
  const attendingColor = pageConfig.attendingColor || "#16a34a";
  const declinedColor = pageConfig.declinedColor || "#dc2626";
  const singleToFull = (color: string): ButtonColors => ({ bgColor: color, textColor: BLACK_TEXT, borderColor: color, hoverBgColor: color, hoverTextColor: BLACK_TEXT, hoverBorderColor: color });
  const attendingSelectedColors: ButtonColors = pageConfig.attendingColors
    ? { textColor: BLACK_TEXT, ...pageConfig.attendingColors }
    : singleToFull(attendingColor);
  const declinedSelectedColors: ButtonColors = pageConfig.declinedColors
    ? { textColor: BLACK_TEXT, ...pageConfig.declinedColors }
    : singleToFull(declinedColor);
  const plusOneYesSelectedColors: ButtonColors = pageConfig.plusOneYesColors
    ? { textColor: BLACK_TEXT, ...pageConfig.plusOneYesColors }
    : pageConfig.attendingColors
      ? { textColor: BLACK_TEXT, ...pageConfig.attendingColors }
      : singleToFull(attendingColor);
  const plusOneNoSelectedColors: ButtonColors = pageConfig.plusOneNoColors
    ? { textColor: BLACK_TEXT, ...pageConfig.plusOneNoColors }
    : pageConfig.declinedColors
      ? { textColor: BLACK_TEXT, ...pageConfig.declinedColors }
      : singleToFull(declinedColor);
  const baseButtonColors = pageButtonColors ?? loginConfig.buttonColors;
  const btnStyle = buttonColorsToStyle(baseButtonColors);
  const btnHoverStyle = buttonColorsToHoverStyle(baseButtonColors);

  const unselectedBtnStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { ...btnStyle };
    if (!base.borderColor) { base.borderColor = "var(--event-border)"; base.borderStyle = "solid"; }
    if (!base.backgroundColor) base.backgroundColor = "transparent";
    if (!base.color) base.color = "var(--event-text)";
    return base;
  };
  const attendingBtnStyle = (isSelected: boolean): React.CSSProperties => isSelected ? buttonColorsToStyle(attendingSelectedColors) : unselectedBtnStyle();
  const declinedBtnStyle = (isSelected: boolean): React.CSSProperties => isSelected ? buttonColorsToStyle(declinedSelectedColors) : unselectedBtnStyle();
  const attendingBtnHover = (isSelected: boolean): React.CSSProperties => isSelected ? buttonColorsToHoverStyle(attendingSelectedColors) : btnHoverStyle;
  const declinedBtnHover = (isSelected: boolean): React.CSSProperties => isSelected ? buttonColorsToHoverStyle(declinedSelectedColors) : btnHoverStyle;
  const plusOneYesBtnStyle = (isSelected: boolean): React.CSSProperties => isSelected ? buttonColorsToStyle(plusOneYesSelectedColors) : unselectedBtnStyle();
  const plusOneNoBtnStyle = (isSelected: boolean): React.CSSProperties => isSelected ? buttonColorsToStyle(plusOneNoSelectedColors) : unselectedBtnStyle();
  const plusOneYesBtnHover = (isSelected: boolean): React.CSSProperties => isSelected ? buttonColorsToHoverStyle(plusOneYesSelectedColors) : btnHoverStyle;
  const plusOneNoBtnHover = (isSelected: boolean): React.CSSProperties => isSelected ? buttonColorsToHoverStyle(plusOneNoSelectedColors) : btnHoverStyle;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !lookup) return;
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!status) { setError("Please choose Attending or Declined."); return; }
    if (status === "attending" && !bringingPlusOne) return;
    setError(null);
    setSubmitting(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("open_rsvp_register", {
        p_token: token,
        p_name: name.trim(),
        p_status: status,
        p_plus_ones: status === "attending" && bringingPlusOne === "yes" ? 1 : 0,
        p_phone: status === "attending" && pageConfig.phoneEnabled ? phone.trim() || null : null,
      });
      if (rpcError) throw rpcError;
      const result = (data ?? {}) as { error?: string; guest?: EventGuest; event_slug?: string };
      if (result.error) {
        const messages: Record<string, string> = {
          link_not_found: "This link is no longer available.",
          invalid_name: "Please enter a valid name.",
          invalid_status: "Please choose Attending or Declined.",
          invalid_phone: language === "bm" ? "Sila masukkan nombor telefon yang sah, atau kosongkan ruang ini." : "Please enter a valid phone number, or leave it blank.",
          closed: language === "bm" ? "Tempoh RSVP untuk acara ini telah tamat." : "RSVP for this event is now closed.",
          already_responded:
            language === "bm"
              ? "Nama ini sudah menghantar RSVP. Sila hubungi tuan rumah jika anda perlu mengubahnya."
              : "An RSVP has already been submitted for this name. Please contact the host if it needs to be changed.",
        };
        setError(messages[result.error] ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      if (result.guest && result.event_slug) {
        signInGuest(result.guest.event_id, result.guest);
        setStep("done");
      }
    } catch {
      setError("We couldn't submit your RSVP. Please try again.");
    }
    setSubmitting(false);
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--event-bg)" }}><div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--event-primary)", borderTopColor: "transparent" }} /></div>;
  if (!lookup || !subEvent || !event) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center"><h1 className="text-2xl font-bold text-dash-text">Link Not Found</h1><p className="text-dash-muted">This RSVP link could not be found or is no longer available.</p><Link to="/" className="text-dash-primary hover:underline">Return home</Link></div>;

  const heading = language === "bm"
    ? (pageConfig.headingBm?.trim() || pageConfig.heading || `RSVP — ${subEvent.name_bm || subEvent.name}`)
    : (pageConfig.heading || `RSVP — ${subEvent.name}`);
  const intro = language === "bm"
    ? (pageConfig.introBm?.trim() || pageConfig.intro || "")
    : (pageConfig.intro || "");
  const nameLabel = language === "bm"
    ? (pageConfig.nameLabelBm?.trim() || pageConfig.nameLabel || "Nama Anda")
    : (pageConfig.nameLabel || "Your Name");
  const namePlaceholder = language === "bm"
    ? (pageConfig.namePlaceholderBm?.trim() || pageConfig.namePlaceholder || "Masukkan nama penuh anda")
    : (pageConfig.namePlaceholder || "Enter your full name");
  const attendingLabel = language === "bm"
    ? (pageConfig.attendingLabelBm?.trim() || pageConfig.attendingLabel || "Hadir")
    : (pageConfig.attendingLabel || "Attending");
  const decliningLabel = language === "bm"
    ? (pageConfig.decliningLabelBm?.trim() || pageConfig.decliningLabel || "Tidak Hadir")
    : (pageConfig.decliningLabel || "Declined");
  const submitLabel = language === "bm"
    ? (pageConfig.submitLabelBm?.trim() || pageConfig.submitLabel || "Hantar RSVP")
    : (pageConfig.submitLabel || "Submit RSVP");
  const thankYou = status === "attending"
    ? (language === "bm"
      ? (pageConfig.thankYouAttendingBm?.trim() || pageConfig.thankYouAttending || "Terima kasih! Kami menanti kehadiran anda.")
      : (pageConfig.thankYouAttending || "Thank you! We look forward to seeing you."))
    : (language === "bm"
      ? (pageConfig.thankYouDeclinedBm?.trim() || pageConfig.thankYouDeclined || "Terima kasih kerana memberitahu kami.")
      : (pageConfig.thankYouDeclined || "Thank you for letting us know."));

  if (step === "done") {
    return (
      <EventThemeProvider theme={event.theme}>
        <LanguageToggle />
        <div className="guest-section guest-rsvp-page">
          <div className="mx-auto max-w-2xl guest-rsvp-content">
            {pageConfig.logoUrl && (
              <div className="flex justify-center pt-8 sm:pt-12 mb-6 sm:mb-8">
                <img src={pageConfig.logoUrl} alt="" className="h-auto max-w-full object-contain" style={{ width: `${pageConfig.logoSize ?? 160}px` }} />
              </div>
            )}
            <div className="text-center pt-4 sm:pt-6">
              <h1 className="guest-title mb-4" style={{ fontSize: "26px" }}>
                {thankYou === "Thank you for letting us know" ? <>Thank you for&nbsp;<div>letting us know</div></> : thankYou}
              </h1>
              <button
                type="button"
                onClick={() => navigate(`/e/${event.slug}/home`, { replace: true })}
                className="event-btn-primary"
              >
                {language === "bm" ? "LIHAT JEMPUTAN ANDA" : "VIEW YOUR INVITATION"}
              </button>
            </div>
          </div>
        </div>
      </EventThemeProvider>
    );
  }

  const dateStr = subEvent.date;
  const timeStr = subEvent.time || subEvent.start_time || null;
  const subEventName = language === "bm" ? (subEvent.name_bm?.trim() || subEvent.name) : subEvent.name;
  const rsvpDeadlinePassed = !!subEvent.rsvp_deadline && new Date(subEvent.rsvp_deadline).getTime() < Date.now();
  const closedMessage = language === "bm" ? "Tempoh RSVP untuk acara ini telah tamat." : "RSVP for this event is now closed.";
  const scheduleHeadingText = language === "bm"
    ? (pageConfig.scheduleHeadingBm?.trim() || "Aturcara")
    : (pageConfig.scheduleHeading?.trim() || "Program");
  const nameWeight = pageConfig.nameWeight ?? 600;
  const attendingWeight = pageConfig.attendingWeight ?? 700;
  const decliningWeight = pageConfig.decliningWeight ?? 700;
  const submitWeight = pageConfig.submitWeight ?? 600;
  const plusOneYesWeight = pageConfig.plusOneYesWeight ?? 700;
  const plusOneNoWeight = pageConfig.plusOneNoWeight ?? 700;
  const nameColor = pageConfig.nameColor || "var(--event-text)";
  const attendingTextColor = pageConfig.attendingTextColor || undefined;
  const decliningTextColor = pageConfig.decliningTextColor || undefined;
  const submitTextColor = pageConfig.submitTextColor || undefined;
  const plusOneYesTextColor = pageConfig.plusOneYesTextColor || undefined;
  const plusOneNoTextColor = pageConfig.plusOneNoTextColor || undefined;
  const plusOneQuestionColor = pageConfig.plusOneQuestionColor || "var(--event-text)";

  const headingStyle = getTypographyStyle(pageConfig.headingTypography);
  const introStyle = getTypographyStyle(pageConfig.introTypography);
  const eventTitleStyle = getTypographyStyle(pageConfig.eventTitleTypography);
  const eventTimeStyle = getTypographyStyle(pageConfig.eventTimeTypography);
  const eventAddressStyle = getTypographyStyle(pageConfig.eventAddressTypography);
  const scheduleHeadingStyle = getTypographyStyle(pageConfig.scheduleHeadingTypography);
  const programmeItemStyle = getTypographyStyle(pageConfig.programmeItemTypography);
  const rsvpDeadlineStyle = getTypographyStyle(pageConfig.rsvpDeadlineTypography);
  const nameLabelStyle = getTypographyStyle(pageConfig.nameLabelTypography);
  const nameInputStyle = getTypographyStyle(pageConfig.nameInputTypography);
  const attendingStyle = getTypographyStyle(pageConfig.attendingTypography);
  const declinedStyle = getTypographyStyle(pageConfig.declinedTypography);
  const plusOneQuestionStyle = getTypographyStyle(pageConfig.plusOneQuestionTypography);
  const plusOneYesStyle = getTypographyStyle(pageConfig.plusOneYesTypography);
  const plusOneNoStyle = getTypographyStyle(pageConfig.plusOneNoTypography);
  const selectedAnswerStyle = getTypographyStyle(pageConfig.selectedAnswerTypography);
  const phoneQuestionStyle = getTypographyStyle(pageConfig.phoneQuestionTypography);
  const phoneHelperStyle = getTypographyStyle(pageConfig.phoneHelperTypography);
  const phoneExampleStyle = getTypographyStyle(pageConfig.phoneExampleTypography);
  const submitStyle = getTypographyStyle(pageConfig.submitTypography);

  const renderDateColumn = (date: string | null | undefined) => {
    const parts = getDateParts(date);
    if (!parts) return null;
    return (
      <div className="flex flex-col items-center text-center flex-shrink-0" style={{ minWidth: "64px", textTransform: "uppercase" }}>
        <span className="text-[0.6875rem] sm:text-xs uppercase tracking-wide" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)", ...eventTimeStyle, fontSize: "14px" }}>{parts.weekday.toLocaleUpperCase()}</span>
        <span className="text-3xl sm:text-3xl font-bold leading-tight" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)", ...eventTimeStyle, fontSize: "18px" }}>{parts.day}</span>
        <span className="text-sm sm:text-sm" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)", ...eventTimeStyle, fontSize: "14px" }}>{parts.month.toLocaleUpperCase()}</span>
        <span className="text-sm sm:text-sm" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)", ...eventTimeStyle, fontSize: "14px" }}>{parts.year}</span>
      </div>
    );
  };

  const renderSchedule = () => {
    const items = (schedule ?? []).filter((s) => s.sub_event_id === subEvent.id);
    if (items.length === 0) return null;
    return (
      <div className="mt-4 sm:mt-6">
        <h3 className="mb-3 sm:mb-4" style={{ fontFamily: "var(--event-font-heading)", color: BLACK_TEXT, ...scheduleHeadingStyle }}>{scheduleHeadingText}</h3>
        <div className="space-y-3 sm:space-y-4">
          {items.map((item) => (
            <div key={item.id} className="guest-rsvp-schedule-row grid items-start">
              <div className="guest-rsvp-schedule-time text-xs sm:text-sm font-medium leading-snug" style={{ color: BLACK_TEXT, fontFamily: "var(--event-font-body)", ...programmeItemStyle }}>
                {formatScheduleTimeRange(item.start_time, item.end_time)}
              </div>
              <div className="guest-rsvp-schedule-title min-w-0">
                <p className="font-medium text-sm sm:text-base leading-snug" style={{ color: BLACK_TEXT, fontFamily: "var(--event-font-heading)", overflowWrap: "break-word", ...programmeItemStyle }}>{language === "bm" ? (item.title_bm?.trim() || item.title) : item.title}</p>
                {(language === "bm" ? (item.description_bm?.trim() || item.description) : item.description) && <p className="text-xs sm:text-sm mt-0.5 leading-snug" style={{ color: BLACK_TEXT, fontFamily: "var(--event-font-body)", whiteSpace: "pre-wrap", overflowWrap: "break-word", ...programmeItemStyle }}>{language === "bm" ? (item.description_bm?.trim() || item.description) : item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <EventThemeProvider theme={event.theme}>
      <LanguageToggle />
      <div className="guest-section guest-rsvp-page">
        <div className="mx-auto max-w-2xl guest-rsvp-content">
          {pageConfig.logoUrl && (
            <div className="flex justify-center pt-8 sm:pt-12 mb-6 sm:mb-8">
              <img src={pageConfig.logoUrl} alt="" className="h-auto max-w-full object-contain" style={{ width: `${pageConfig.logoSize ?? 160}px` }} />
            </div>
          )}
          <div className="text-center pt-4 sm:pt-6 mb-12 sm:mb-16">
            <h1 className="guest-title text-center" style={{ whiteSpace: "pre-wrap", marginBottom: 0, ...headingStyle }}>{heading}</h1>
            {subEvent.rsvp_deadline && (
              <p className="text-center" style={{ whiteSpace: "pre-wrap", marginTop: "4px", marginBottom: 0, ...rsvpDeadlineStyle, color: rsvpDeadlineStyle.color || "var(--event-muted)", textTransform: "uppercase" }}>
                {(language === "bm" ? "Sebelum" : "Before").toLocaleUpperCase()} {formatDateLong(subEvent.rsvp_deadline).toLocaleUpperCase()}
              </p>
            )}
            {intro && !rsvpDeadlinePassed && <p className="guest-subtitle text-center" style={{ margin: "0 auto", whiteSpace: "pre-wrap", ...introStyle }}>{intro}</p>}
          </div>

          {rsvpDeadlinePassed ? (
            <div className="text-center">
              <p className="guest-subtitle" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)" }}>{closedMessage}</p>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="guest-rsvp-event flex flex-row items-start gap-1 sm:gap-1.5">
              {renderDateColumn(dateStr)}
              <div className="flex-1 min-w-0">
                {subEventName && <h2 className="text-lg sm:text-2xl font-bold mb-1 break-words" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)", ...eventTitleStyle }}>{subEventName}</h2>}
                {timeStr && <p className="text-xs sm:text-sm mb-1" style={{ color: BLACK_TEXT, fontFamily: "var(--event-font-body)", whiteSpace: "nowrap", ...eventTimeStyle }}>{formatTime12(timeStr)}</p>}
                {subEvent.venue && <p className="text-xs sm:text-sm" style={{ color: BLACK_TEXT, fontFamily: "var(--event-font-body)", ...eventTimeStyle }}>{subEvent.venue}</p>}
                {subEvent.address && <p className="text-xs sm:text-sm" style={{ color: BLACK_TEXT, fontFamily: "var(--event-font-body)", ...eventAddressStyle }}>{subEvent.address}</p>}
                {renderSchedule()}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-center text-sm" style={{ color: nameColor, fontFamily: "var(--event-font-body)", fontWeight: nameWeight, ...nameLabelStyle }}>{nameLabel}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="event-input"
                placeholder={namePlaceholder}
                required
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                style={{ textAlign: "center", fontFamily: "var(--event-font-heading)", fontWeight: nameWeight, color: nameColor === "var(--event-text)" ? undefined : nameColor, ...nameInputStyle }}
              />
            </div>

            <div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("attending")}
                  className="event-btn-primary rsvp-toggle-btn"
                  style={{ flex: 1, ...attendingBtnStyle(status === "attending") }}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, { flex: 1, ...attendingBtnStyle(status === "attending"), ...attendingBtnHover(status === "attending") })}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, { flex: 1, ...attendingBtnStyle(status === "attending") })}
                >
                  <span style={{ fontWeight: attendingWeight, color: attendingTextColor, ...attendingStyle, ...(status === "attending" ? selectedAnswerStyle : {}) }}>{attendingLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setStatus("declined"); setBringingPlusOne(""); }}
                  className="event-btn-secondary rsvp-toggle-btn"
                  style={{ flex: 1, ...declinedBtnStyle(status === "declined") }}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, { flex: 1, ...declinedBtnStyle(status === "declined"), ...declinedBtnHover(status === "declined") })}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, { flex: 1, ...declinedBtnStyle(status === "declined") })}
                >
                  <span style={{ fontWeight: decliningWeight, color: decliningTextColor, ...declinedStyle, ...(status === "declined" ? selectedAnswerStyle : {}) }}>{decliningLabel}</span>
                </button>
              </div>
            </div>

            {status === "attending" && (
              <div>
                <p className="mb-2 text-center text-sm" style={{ color: plusOneQuestionColor, fontFamily: "var(--event-font-body)", ...plusOneQuestionStyle }}>{language === "bm" ? (pageConfig.plusOneQuestionBm?.trim() || "Membawa +1?") : (pageConfig.plusOneQuestion?.trim() || "Bringing a +1?")}</p>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setBringingPlusOne("yes")}
                    className="event-btn-primary rsvp-toggle-btn"
                    style={{ flex: 1, ...plusOneYesBtnStyle(bringingPlusOne === "yes") }}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { flex: 1, ...plusOneYesBtnStyle(bringingPlusOne === "yes"), ...plusOneYesBtnHover(bringingPlusOne === "yes") })}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { flex: 1, ...plusOneYesBtnStyle(bringingPlusOne === "yes") })}
                  >
                    <span style={{ fontWeight: plusOneYesWeight, color: plusOneYesTextColor, ...plusOneYesStyle, ...(bringingPlusOne === "yes" ? selectedAnswerStyle : {}) }}>{language === "bm" ? (pageConfig.plusOneYesLabelBm?.trim() || "Ya") : (pageConfig.plusOneYesLabel?.trim() || "Yes")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBringingPlusOne("no")}
                    className="event-btn-secondary rsvp-toggle-btn"
                    style={{ flex: 1, ...plusOneNoBtnStyle(bringingPlusOne === "no") }}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { flex: 1, ...plusOneNoBtnStyle(bringingPlusOne === "no"), ...plusOneNoBtnHover(bringingPlusOne === "no") })}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { flex: 1, ...plusOneNoBtnStyle(bringingPlusOne === "no") })}
                  >
                    <span style={{ fontWeight: plusOneNoWeight, color: plusOneNoTextColor, ...plusOneNoStyle, ...(bringingPlusOne === "no" ? selectedAnswerStyle : {}) }}>{language === "bm" ? (pageConfig.plusOneNoLabelBm?.trim() || "Tidak") : (pageConfig.plusOneNoLabel?.trim() || "No")}</span>
                  </button>
                </div>
              </div>
            )}

            {status === "attending" && pageConfig.phoneEnabled && (
              <div>
                <label className="mb-1 block text-center text-sm" htmlFor="open-rsvp-phone" style={{ color: plusOneQuestionColor, fontFamily: "var(--event-font-body)", ...phoneQuestionStyle }}>{language === "bm" ? (pageConfig.phoneQuestionBm?.trim() || pageConfig.phoneQuestion?.trim() || "Nombor telefon (pilihan)") : (pageConfig.phoneQuestion?.trim() || "Your phone number (optional)")}</label>
                <input
                  id="open-rsvp-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={language === "bm" ? (pageConfig.phoneExampleBm?.trim() || DEFAULT_PHONE_EXAMPLE) : (pageConfig.phoneExample?.trim() || DEFAULT_PHONE_EXAMPLE)}
                  autoComplete="tel"
                  maxLength={30}
                  style={{ textAlign: "center", fontFamily: "var(--event-font-body)", "--phone-example-color": pageConfig.phoneExampleColor || undefined, "--phone-example-opacity": pageConfig.phoneExampleColor ? 1 : 0.6, "--phone-example-size": phoneExampleStyle.fontSize, "--phone-example-weight": phoneExampleStyle.fontWeight, "--phone-example-style": phoneExampleStyle.fontStyle, "--phone-example-family": phoneExampleStyle.fontFamily, "--phone-example-spacing": phoneExampleStyle.letterSpacing } as React.CSSProperties}
                  className="event-input rsvp-phone-input"
                />
                <p className="mt-1 text-center text-xs" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)", ...phoneHelperStyle }}>{language === "bm" ? (pageConfig.phoneHelperBm?.trim() || pageConfig.phoneHelper?.trim() || "Untuk pengaturan tempat duduk") : (pageConfig.phoneHelper?.trim() || "For seating arrangements")}</p>
              </div>
            )}

            {error && <p className="text-center text-sm" style={{ color: "var(--event-primary)" }}>{error}</p>}
            <div className="text-center pt-2">
              <button type="submit" disabled={submitting || !status || !name.trim() || (status === "attending" && !bringingPlusOne)} className="event-btn-primary" style={{ opacity: submitting || !status || !name.trim() || (status === "attending" && !bringingPlusOne) ? 0.8 : 1, ...btnStyle }} onMouseEnter={(e) => { if (!submitting && status && name.trim() && !(status === "attending" && !bringingPlusOne)) Object.assign(e.currentTarget.style, btnHoverStyle); }} onMouseLeave={(e) => Object.assign(e.currentTarget.style, btnStyle)}>
                <span style={{ fontWeight: submitWeight, color: submitTextColor, ...submitStyle }}>{submitting ? (language === "bm" ? "Menghantar..." : "Submitting...") : submitLabel}</span>
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </EventThemeProvider>
  );
}
