import { useState, useEffect } from "react";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase, type EventRsvp, type EventSchedule, type SubEvent, type Json } from "../../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatTime12, formatDateLong, cn } from "../../lib/utils";
import { getTypographyText, getTypographyStyle } from "../../lib/typography";
import { buttonColorsToStyle, buttonColorsToHoverStyle, type ButtonColors } from "../../components/ui/ButtonColourEditor";
import { useLanguage } from "../../lib/language";
import { pickText, autoTranslate, getCurrentLanguage, setCurrentLanguage } from "../../lib/translations";

interface RsvpContent {
  title?: string;
  titleTypography?: unknown;
  subtitle?: string;
  subtitleTypography?: unknown;
  attendingText?: string;
  declinedText?: string;
  attendingMessage?: string;
  declinedMessage?: string;
  attendingColor?: string;
  declinedColor?: string;
  attendingButtonColors?: ButtonColors;
  declinedButtonColors?: ButtonColors;
  attendingSelectedButtonColors?: ButtonColors;
  declinedSelectedButtonColors?: ButtonColors;
  scheduleHeading?: unknown;
  scheduleHeadingTypographyBm?: unknown;
  guestNameTypography?: unknown;
  additionalInfoHeading?: unknown;
  additionalInfoBody?: string;
  eventNameTypography?: unknown;
  eventDateTypography?: unknown;
  eventTimeTypography?: unknown;
  eventAddressTypography?: unknown;
  programmeItemTypography?: unknown;
  rsvpDeadlineTypography?: unknown;
  additionalInfoBodyTypography?: unknown;
  rsvpDeadlinePrefix?: string;
  contactMessage?: string;
  contactMessageTypography?: unknown;
}

const DEFAULT_RSVP_CONTENT: RsvpContent = {
  attendingText: "Attending",
  declinedText: "Declined",
  attendingColor: "#16a34a",
  declinedColor: "#dc2626",
};

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
  const startPeriod = start.match(/\s(AM|PM|pagi|petang|malam|tengah hari)$/)?.[1];
  const endPeriod = end.match(/\s(AM|PM|pagi|petang|malam|tengah hari)$/)?.[1];
  if (startPeriod && startPeriod === endPeriod) {
    return `${start.slice(0, -startPeriod.length).trim()} \u2013 ${end}`;
  }
  return `${start} \u2013 ${end}`;
}

export default function GuestRsvp() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const { language } = useLanguage();
  setCurrentLanguage(language);
  const queryClient = useQueryClient();

  const rsvpContent: RsvpContent = {
    ...DEFAULT_RSVP_CONTENT,
    ...(((event.content as Record<string, unknown> | null)?.rsvp as Partial<RsvpContent>) ?? {}),
  };
  const rsvpBm = ((event.content as Record<string, unknown> | null)?.rsvpBm ?? {}) as Record<string, string>;
  const tr = (en: string, bmKey?: string) => {
    if (language !== "bm") return en;
    if (bmKey && rsvpBm[bmKey]?.trim()) return rsvpBm[bmKey];
    const auto = autoTranslate(en);
    return auto ?? en;
  };

  const { data: schedule } = useQuery({
    queryKey: ["event-schedule-public", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", event.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
  });

  const { data: subEvents } = useQuery({
    queryKey: ["invited-sub-events", invitedSubEventIds],
    queryFn: async () => {
      if (invitedSubEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .in("id", invitedSubEventIds)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: invitedSubEventIds.length > 0,
  });

  const { data: existingRsvps } = useQuery({
    queryKey: ["guest-rsvps", guest?.id, event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("guest_id", guest!.id)
        .eq("event_id", event.id);
      if (error) throw error;
      return data as EventRsvp[];
    },
    enabled: !!guest,
  });

  const [responses, setResponses] = useState<Record<string, { status: string; plus_ones: number; message: string }>>({});

  useEffect(() => {
    if (existingRsvps) {
      const map: Record<string, { status: string; plus_ones: number; message: string }> = {};
      existingRsvps.forEach((r) => {
        const key = r.sub_event_id || "main";
        map[key] = { status: r.status, plus_ones: r.plus_ones, message: r.message ?? "" };
      });
      setResponses(map);
    }
  }, [existingRsvps]);

  const rsvpMutation = useMutation({
    mutationFn: async ({ subEventId, status, plus_ones, message }: { subEventId: string | null; status: string; plus_ones: number; message: string }) => {
      const existing = existingRsvps?.find((r) => (subEventId ? r.sub_event_id === subEventId : !r.sub_event_id));
      if (existing) {
        const { error } = await supabase
          .from("event_rsvps")
          .update({ status, plus_ones, message, responded_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_rsvps")
          .insert({
            event_id: event.id,
            guest_id: guest!.id,
            guest_name: guest!.name,
            status,
            plus_ones,
            message,
            sub_event_id: subEventId,
            responded_at: new Date().toISOString(),
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", guest?.id, event.id] });
    },
  });

  const handleRsvp = (subEventId: string | null, status: string) => {
    const key = subEventId || "main";
    const current = responses[key] ?? { status: "pending", plus_ones: 0, message: "" };
    if (status === "declined") {
      const cleared = { ...current, status, plus_ones: 0 };
      setResponses((p) => ({ ...p, [key]: cleared }));
      rsvpMutation.mutate({ subEventId, status, plus_ones: 0, message: cleared.message });
      return;
    }
    const updated = { ...current, status };
    setResponses((p) => ({ ...p, [key]: updated }));
    rsvpMutation.mutate({ subEventId, status, plus_ones: updated.plus_ones, message: updated.message });
  };

  const guestNameText = guest?.name ? getTypographyText(rsvpContent.guestNameTypography, guest.name) : "";
  const guestNameStyle = getTypographyStyle(rsvpContent.guestNameTypography);
  const additionalInfoHeadingText = getTypographyText(rsvpContent.additionalInfoHeading, "");
  const additionalInfoHeadingStyle = getTypographyStyle(rsvpContent.additionalInfoHeading);
  const additionalInfoBody = rsvpContent.additionalInfoBody;
  const showAdditionalInfo = !!(additionalInfoHeadingText || (additionalInfoBody && additionalInfoBody.trim()));

  const subtitleText = getTypographyText(rsvpContent.subtitleTypography, rsvpContent.subtitle ?? "");
  const subtitleStyle = getTypographyStyle(rsvpContent.subtitleTypography);
  const titleStyle = getTypographyStyle(rsvpContent.titleTypography);
  const eventNameStyle = getTypographyStyle(rsvpContent.eventNameTypography);
  const eventDateStyle = getTypographyStyle(rsvpContent.eventDateTypography);
  const eventDateFontStyle = eventDateStyle.fontFamily ? { fontFamily: eventDateStyle.fontFamily } : {};
  const eventTimeStyle = getTypographyStyle(rsvpContent.eventTimeTypography);
  const eventAddressStyle = getTypographyStyle(rsvpContent.eventAddressTypography);
  const programmeItemStyle = getTypographyStyle(rsvpContent.programmeItemTypography);
  const rsvpDeadlineStyle = getTypographyStyle(rsvpContent.rsvpDeadlineTypography);
  const rsvpDeadline = event.rsvp_deadline as string | null | undefined;
  const additionalInfoBodyStyle = getTypographyStyle(rsvpContent.additionalInfoBodyTypography);
  const contactMessageText = rsvpContent.contactMessage?.trim() ?? "";
  const contactMessageStyle = getTypographyStyle(rsvpContent.contactMessageTypography);

  const attendingSelectedStyle = (isSelected: boolean): React.CSSProperties => {
    if (!isSelected) return buttonColorsToStyle(rsvpContent.attendingButtonColors);
    const selectedColors = rsvpContent.attendingSelectedButtonColors;
    if (selectedColors) return buttonColorsToStyle(selectedColors);
    const base: React.CSSProperties = { ...buttonColorsToStyle(rsvpContent.attendingButtonColors) };
    if (rsvpContent.attendingColor) { base.backgroundColor = rsvpContent.attendingColor; base.borderColor = rsvpContent.attendingColor; }
    return base;
  };
  const declinedSelectedStyle = (isSelected: boolean): React.CSSProperties => {
    if (!isSelected) return buttonColorsToStyle(rsvpContent.declinedButtonColors);
    const selectedColors = rsvpContent.declinedSelectedButtonColors;
    if (selectedColors) return buttonColorsToStyle(selectedColors);
    const base: React.CSSProperties = { ...buttonColorsToStyle(rsvpContent.declinedButtonColors) };
    if (rsvpContent.declinedColor) { base.backgroundColor = rsvpContent.declinedColor; base.borderColor = rsvpContent.declinedColor; base.color = "#fff"; }
    return base;
  };

  const renderDateColumn = (dateStr: string | null | undefined) => {
    const parts = getDateParts(dateStr);
    if (!parts) return null;
    return (
      <div className="flex flex-col items-center text-center flex-shrink-0" style={{ minWidth: "64px", textTransform: "uppercase" }}>
        <span className="text-[0.6875rem] sm:text-xs uppercase tracking-wide" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)", ...eventDateFontStyle }}>{parts.weekday.toLocaleUpperCase()}</span>
        <span className="text-3xl sm:text-3xl font-bold leading-tight" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)", ...eventDateFontStyle }}>{parts.day}</span>
        <span className="text-sm sm:text-sm" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)", ...eventDateFontStyle }}>{parts.month.toLocaleUpperCase()}</span>
        <span className="text-sm sm:text-sm" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)", ...eventDateFontStyle }}>{parts.year}</span>
      </div>
    );
  };

  const scheduleHeadingText = language === "bm"
    ? rsvpBm.scheduleHeading?.trim() || tr("Program", "scheduleHeading")
    : getTypographyText(rsvpContent.scheduleHeading, "Program");
  const scheduleHeadingStyle = language === "bm"
    ? getTypographyStyle(rsvpContent.scheduleHeadingTypographyBm)
    : getTypographyStyle(rsvpContent.scheduleHeading);

  const renderSchedule = (subEventId: string | null) => {
    const items = (schedule ?? []).filter((s) => (subEventId ? s.sub_event_id === subEventId : !s.sub_event_id));
    if (items.length === 0) return null;
    return (
      <div className="mt-4 sm:mt-6">
        <h3 className="mb-3 sm:mb-4" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)", ...scheduleHeadingStyle }}>{scheduleHeadingText}</h3>
        <div className="space-y-3 sm:space-y-4">
          {items.map((item) => (
            <div key={item.id} className="guest-rsvp-schedule-row grid items-start">
              <div className="guest-rsvp-schedule-time text-xs sm:text-sm font-medium leading-snug" style={{ color: "var(--event-primary)", fontFamily: "var(--event-font-body)", ...programmeItemStyle }}>
                {formatScheduleTimeRange(item.start_time, item.end_time)}
              </div>
              <div className="guest-rsvp-schedule-title min-w-0">
                <p className="font-medium text-sm sm:text-base leading-snug" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)", overflowWrap: "break-word", ...programmeItemStyle }}>{item.title}</p>
                {item.description && <p className="text-xs sm:text-sm mt-0.5 leading-snug" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)", whiteSpace: "pre-wrap", overflowWrap: "break-word", ...programmeItemStyle }}>{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAdditionalInfo = () => {
    if (!showAdditionalInfo) return null;
    return (
      <div className="mt-4 sm:mt-6">
        {additionalInfoHeadingText && <h3 className="mb-2" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)", ...additionalInfoHeadingStyle }}>{additionalInfoHeadingText}</h3>}
        {additionalInfoBody && <div className="text-sm" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)", whiteSpace: "pre-wrap", ...additionalInfoBodyStyle }}>{additionalInfoBody}</div>}
      </div>
    );
  };

  const renderRsvpButtons = (subEventId: string | null) => {
    const key = subEventId || "main";
    const current = responses[key] ?? { status: "pending", plus_ones: 0, message: "" };
    const isAttending = current.status === "attending";
    const isDeclined = current.status === "declined";
    return (
      <div className="mt-4 sm:mt-6">
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
          <button
            onClick={() => handleRsvp(subEventId, "attending")}
            className="event-btn-primary"
            style={{ opacity: isAttending ? 1 : 0.6, ...attendingSelectedStyle(isAttending) }}
            onMouseEnter={(e) => { if (!isAttending) Object.assign(e.currentTarget.style, buttonColorsToHoverStyle(rsvpContent.attendingButtonColors)); }}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, { opacity: isAttending ? 1 : 0.6, ...attendingSelectedStyle(isAttending) })}
          >
            {tr(rsvpContent.attendingText || "Attending", "attendingText")}
          </button>
          <button
            onClick={() => handleRsvp(subEventId, "declined")}
            className="event-btn-secondary"
            style={{ opacity: isDeclined ? 1 : 0.6, ...declinedSelectedStyle(isDeclined) }}
            onMouseEnter={(e) => { if (!isDeclined) Object.assign(e.currentTarget.style, buttonColorsToHoverStyle(rsvpContent.declinedButtonColors)); }}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, { opacity: isDeclined ? 1 : 0.6, ...declinedSelectedStyle(isDeclined) })}
          >
            {tr(rsvpContent.declinedText || "Declined", "declinedText")}
          </button>
        </div>
        {isAttending && rsvpContent.attendingMessage && (
          <p className="mt-2 text-center text-sm" style={{ color: "var(--event-muted)", whiteSpace: "pre-wrap" }}>{tr(rsvpContent.attendingMessage, "attendingMessage")}</p>
        )}
        {isDeclined && rsvpContent.declinedMessage && (
          <p className="mt-2 text-center text-sm" style={{ color: "var(--event-muted)", whiteSpace: "pre-wrap" }}>{tr(rsvpContent.declinedMessage, "declinedMessage")}</p>
        )}
      </div>
    );
  };

  const renderEventBlock = (eventName: string, dateStr: string | null, timeStr: string | null, venue: string | null, address: string | null, subEventId: string | null) => {
    return (
      <div className="guest-rsvp-event flex flex-row items-start gap-3 sm:gap-6">
        {renderDateColumn(dateStr)}
        <div className="flex-1 min-w-0">
          {eventName && <h2 className="text-lg sm:text-2xl font-bold mb-1 break-words" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)", ...eventNameStyle }}>{eventName}</h2>}
          {timeStr && <p className="text-xs sm:text-sm mb-1" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)", whiteSpace: "nowrap", ...eventTimeStyle }}>{formatTime12(timeStr)}</p>}
          {venue && <p className="text-xs sm:text-sm" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)", ...eventTimeStyle }}>{venue}</p>}
          {address && <p className="text-xs sm:text-sm" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)", ...eventAddressStyle }}>{address}</p>}
          {renderSchedule(subEventId)}
          {renderAdditionalInfo()}
        {renderRsvpButtons(subEventId)}
        </div>
      </div>
    );
  };

  const hasSubEvents = subEvents && subEvents.length > 0;

  return (
    <div className="guest-section guest-rsvp-page">
      <div className="mx-auto max-w-2xl guest-rsvp-content">
        {/* Header */}
        <div className={cn("text-center pt-16 sm:pt-24", (rsvpContent.title || rsvpDeadline || guestNameText || subtitleText) && "mb-6 sm:mb-8")}>
          {rsvpContent.title && <h1 className="guest-title text-center" style={{ whiteSpace: "pre-wrap", marginBottom: (rsvpDeadline || guestNameText || subtitleText) ? undefined : 0, ...titleStyle }}>{tr(rsvpContent.title, "title")}</h1>}
          {rsvpDeadline && (
            <p className="mb-2 text-center" style={{ whiteSpace: "pre-wrap", ...rsvpDeadlineStyle, color: rsvpDeadlineStyle.color || "var(--event-muted)", textTransform: "uppercase" }}>
              {tr(rsvpContent.rsvpDeadlinePrefix || "RSVP by", "rsvpDeadlinePrefix").toLocaleUpperCase()} {formatDateLong(rsvpDeadline).toLocaleUpperCase()}
            </p>
          )}
          {guestNameText && <p className="guest-subtitle text-center" style={{ margin: "0 auto", whiteSpace: "pre-wrap", ...guestNameStyle }}>{guestNameText}</p>}
          {subtitleText && <p className="guest-subtitle text-center" style={{ margin: "0 auto", whiteSpace: "pre-wrap", ...subtitleStyle }}>{tr(subtitleText, "subtitle")}</p>}
        </div>

        {/* Multiple sub-events or single main event */}
        {hasSubEvents ? (
          <div className="space-y-6 sm:space-y-8">
            {subEvents!.map((se, i) => (
              <div key={se.id}>
                {i > 0 && <hr className="border-0 border-t my-6 sm:my-8" style={{ borderColor: "var(--event-border)" }} />}
                {renderEventBlock(se.name, se.date, se.time ?? se.start_time, se.venue, se.address, se.id)}
              </div>
            ))}
          </div>
        ) : (
          renderEventBlock(event.name ?? "", event.event_date, event.event_time, event.venue, event.address, null)
        )}

        {contactMessageText && (
          <div className="mt-8 sm:mt-10 text-center">
            <p style={{ whiteSpace: "pre-wrap", color: "var(--event-muted)", fontFamily: "var(--event-font-body)", ...contactMessageStyle }}>{tr(contactMessageText, "contactMessage")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
