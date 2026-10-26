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
}

const BLACK_TEXT = "#1a1a1a";

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

function getDateParts(dateStr: string | null | undefined): { weekday: string; day: string; month: string; year: string } | null {
  if (!dateStr) return null;
  const date = new Date(dateStr + (dateStr.length === 10 ? "T00:00:00" : ""));
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
    if (status === "attending" && lookup?.link?.allow_plus_one && !bringingPlusOne) { setError("Please choose Yes or No for bringing a +1."); return; }
    setError(null);
    setSubmitting(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("open_rsvp_register", {
        p_token: token,
        p_name: name.trim(),
        p_status: status,
        p_plus_ones: status === "attending" && bringingPlusOne === "yes" ? 1 : 0,
      });
      if (rpcError) throw rpcError;
      const result = (data ?? {}) as { error?: string; guest?: EventGuest; event_slug?: string };
      if (result.error) {
        const messages: Record<string, string> = {
          link_not_found: "This link is no longer available.",
          invalid_name: "Please enter a valid name.",
          invalid_status: "Please choose Attending or Declined.",
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

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-dash-bg"><div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
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
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-md text-center">
            <h1 className="guest-title mb-4">{thankYou}</h1>
            <button
              type="button"
              onClick={() => navigate(`/e/${event.slug}/home`, { replace: true })}
              className="event-btn-primary"
            >
              {language === "bm" ? "Lihat jemputan" : "View Invitation"}
            </button>
          </div>
        </div>
      </EventThemeProvider>
    );
  }

  const dateStr = subEvent.date;
  const timeStr = subEvent.time || subEvent.start_time || null;
  const subEventName = language === "bm" ? (subEvent.name_bm?.trim() || subEvent.name) : subEvent.name;
  const scheduleHeadingText = language === "bm"
    ? (pageConfig.scheduleHeadingBm?.trim() || "Aturcara")
    : (pageConfig.scheduleHeading?.trim() || "Program");

  const renderDateColumn = (date: string | null | undefined) => {
    const parts = getDateParts(date);
    if (!parts) return null;
    return (
      <div className="flex flex-col items-center text-center flex-shrink-0" style={{ minWidth: "64px", textTransform: "uppercase" }}>
        <span className="text-[0.6875rem] sm:text-xs uppercase tracking-wide" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)" }}>{parts.weekday.toLocaleUpperCase()}</span>
        <span className="text-3xl sm:text-3xl font-bold leading-tight" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>{parts.day}</span>
        <span className="text-sm sm:text-sm" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>{parts.month.toLocaleUpperCase()}</span>
        <span className="text-sm sm:text-sm" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)" }}>{parts.year}</span>
      </div>
    );
  };

  const renderSchedule = () => {
    const items = (schedule ?? []).filter((s) => s.sub_event_id === subEvent.id);
    if (items.length === 0) return null;
    return (
      <div className="mt-4 sm:mt-6">
        <h3 className="mb-3 sm:mb-4" style={{ fontFamily: "var(--event-font-heading)", color: BLACK_TEXT }}>{scheduleHeadingText}</h3>
        <div className="space-y-3 sm:space-y-4">
          {items.map((item) => (
            <div key={item.id} className="guest-rsvp-schedule-row grid items-start">
              <div className="guest-rsvp-schedule-time text-xs sm:text-sm font-medium leading-snug" style={{ color: BLACK_TEXT, fontFamily: "var(--event-font-body)" }}>
                {formatScheduleTimeRange(item.start_time, item.end_time)}
              </div>
              <div className="guest-rsvp-schedule-title min-w-0">
                <p className="font-medium text-sm sm:text-base leading-snug" style={{ color: BLACK_TEXT, fontFamily: "var(--event-font-heading)", overflowWrap: "break-word" }}>{language === "bm" ? (item.title_bm?.trim() || item.title) : item.title}</p>
                {(language === "bm" ? (item.description_bm?.trim() || item.description) : item.description) && <p className="text-xs sm:text-sm mt-0.5 leading-snug" style={{ color: BLACK_TEXT, fontFamily: "var(--event-font-body)", whiteSpace: "pre-wrap", overflowWrap: "break-word" }}>{language === "bm" ? (item.description_bm?.trim() || item.description) : item.description}</p>}
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
          <div className="text-center pt-8 sm:pt-12 mb-12 sm:mb-16">
            <h1 className="guest-title text-center" style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{heading}</h1>
            {subEvent.rsvp_deadline && (
              <p className="text-center" style={{ whiteSpace: "pre-wrap", marginTop: "4px", marginBottom: 0, color: "var(--event-muted)", fontFamily: "var(--event-font-body)", textTransform: "uppercase" }}>
                {(language === "bm" ? "RSVP sebelum" : "RSVP by").toLocaleUpperCase()} {formatDateLong(subEvent.rsvp_deadline).toLocaleUpperCase()}
              </p>
            )}
            {intro && <p className="guest-subtitle text-center" style={{ margin: "0 auto", whiteSpace: "pre-wrap" }}>{intro}</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="guest-rsvp-event flex flex-row items-start gap-1 sm:gap-1.5">
              {renderDateColumn(dateStr)}
              <div className="flex-1 min-w-0">
                {subEventName && <h2 className="text-lg sm:text-2xl font-bold mb-1 break-words" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>{subEventName}</h2>}
                {timeStr && <p className="text-xs sm:text-sm mb-1" style={{ color: BLACK_TEXT, fontFamily: "var(--event-font-body)", whiteSpace: "nowrap" }}>{formatTime12(timeStr)}</p>}
                {subEvent.venue && <p className="text-xs sm:text-sm" style={{ color: BLACK_TEXT, fontFamily: "var(--event-font-body)" }}>{subEvent.venue}</p>}
                {subEvent.address && <p className="text-xs sm:text-sm" style={{ color: BLACK_TEXT, fontFamily: "var(--event-font-body)" }}>{subEvent.address}</p>}
                {renderSchedule()}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-center text-sm font-medium" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>{nameLabel}</label>
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
                style={{ textAlign: "center", fontFamily: "var(--event-font-heading)" }}
              />
            </div>

            <div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("attending")}
                  className="event-btn-primary rsvp-toggle-btn"
                  style={{ flex: 1, opacity: status === "attending" ? 1 : 0.6, ...attendingBtnStyle(status === "attending") }}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, { flex: 1, opacity: status === "attending" ? 1 : 0.6, ...attendingBtnStyle(status === "attending"), ...attendingBtnHover(status === "attending") })}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, { flex: 1, opacity: status === "attending" ? 1 : 0.6, ...attendingBtnStyle(status === "attending") })}
                >
                  {attendingLabel}
                </button>
                <button
                  type="button"
                  onClick={() => { setStatus("declined"); setBringingPlusOne(""); }}
                  className="event-btn-secondary rsvp-toggle-btn"
                  style={{ flex: 1, opacity: status === "declined" ? 1 : 0.6, ...declinedBtnStyle(status === "declined") }}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, { flex: 1, opacity: status === "declined" ? 1 : 0.6, ...declinedBtnStyle(status === "declined"), ...declinedBtnHover(status === "declined") })}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, { flex: 1, opacity: status === "declined" ? 1 : 0.6, ...declinedBtnStyle(status === "declined") })}
                >
                  {decliningLabel}
                </button>
              </div>
            </div>

            {status === "attending" && lookup?.link?.allow_plus_one && (
              <div>
                <p className="mb-2 text-center text-sm" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>{language === "bm" ? "Membawa +1?" : "Bringing a +1?"}</p>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setBringingPlusOne("yes")}
                    className="event-btn-primary rsvp-toggle-btn"
                    style={{ flex: 1, opacity: bringingPlusOne === "yes" ? 1 : 0.6, ...plusOneYesBtnStyle(bringingPlusOne === "yes") }}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { flex: 1, opacity: bringingPlusOne === "yes" ? 1 : 0.6, ...plusOneYesBtnStyle(bringingPlusOne === "yes"), ...plusOneYesBtnHover(bringingPlusOne === "yes") })}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { flex: 1, opacity: bringingPlusOne === "yes" ? 1 : 0.6, ...plusOneYesBtnStyle(bringingPlusOne === "yes") })}
                  >
                    {language === "bm" ? "Ya" : "Yes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBringingPlusOne("no")}
                    className="event-btn-secondary rsvp-toggle-btn"
                    style={{ flex: 1, opacity: bringingPlusOne === "no" ? 1 : 0.6, ...plusOneNoBtnStyle(bringingPlusOne === "no") }}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { flex: 1, opacity: bringingPlusOne === "no" ? 1 : 0.6, ...plusOneNoBtnStyle(bringingPlusOne === "no"), ...plusOneNoBtnHover(bringingPlusOne === "no") })}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { flex: 1, opacity: bringingPlusOne === "no" ? 1 : 0.6, ...plusOneNoBtnStyle(bringingPlusOne === "no") })}
                  >
                    {language === "bm" ? "Tidak" : "No"}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-center text-sm" style={{ color: "var(--event-primary)" }}>{error}</p>}
            <div className="text-center pt-2">
              <button type="submit" disabled={submitting || !status || !name.trim() || (status === "attending" && lookup?.link?.allow_plus_one && !bringingPlusOne)} className="event-btn-primary" style={{ opacity: submitting || !status || !name.trim() || (status === "attending" && lookup?.link?.allow_plus_one && !bringingPlusOne) ? 0.6 : 1, ...btnStyle }} onMouseEnter={(e) => { if (!submitting && status && name.trim() && !(status === "attending" && lookup?.link?.allow_plus_one && !bringingPlusOne)) Object.assign(e.currentTarget.style, btnHoverStyle); }} onMouseLeave={(e) => Object.assign(e.currentTarget.style, btnStyle)}>
                {submitting ? (language === "bm" ? "Menghantar..." : "Submitting...") : submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </EventThemeProvider>
  );
}
