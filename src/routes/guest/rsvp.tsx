import { useState, useEffect } from "react";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase, type EventRsvp, type EventSchedule, type SubEvent, type Json } from "../../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatTime12 } from "../../lib/utils";
import { getTypographyText, getTypographyStyle } from "../../lib/typography";
import { buttonColorsToStyle, buttonColorsToHoverStyle, type ButtonColors } from "../../components/ui/ButtonColourEditor";
import { useLanguage } from "../../lib/language";
import { pickText, autoTranslate } from "../../lib/translations";

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
  guestNameTypography?: unknown;
  additionalInfoHeading?: unknown;
  additionalInfoBody?: string;
  eventNameTypography?: unknown;
  eventTimeTypography?: unknown;
  eventAddressTypography?: unknown;
  programmeItemTypography?: unknown;
  rsvpDeadlineTypography?: unknown;
  additionalInfoBodyTypography?: unknown;
  rsvpDeadlinePrefix?: string;
  plusOneYesButtonColors?: ButtonColors;
  plusOneNoButtonColors?: ButtonColors;
  plusOneYesSelectedButtonColors?: ButtonColors;
  plusOneNoSelectedButtonColors?: ButtonColors;
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
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
    day: date.toLocaleDateString("en-US", { day: "numeric" }),
    month: date.toLocaleDateString("en-US", { month: "long" }),
    year: date.toLocaleDateString("en-US", { year: "numeric" }),
  };
}

export default function GuestRsvp() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const { language } = useLanguage();
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

  // Load per-event +1 permissions from guest_invitation_overrides
  const { data: plusOneOverrides } = useQuery({
    queryKey: ["guest-plus-one-permissions", guest?.id, event.id],
    queryFn: async () => {
      if (!guest) return {} as Record<string, boolean>;
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("sub_event_id, is_invited, allow_plus_one")
        .eq("guest_id", guest.id);
      if (error) throw error;
      const map: Record<string, boolean> = {};
      (data ?? []).forEach((o) => { map[o.sub_event_id as string] = !!(o.is_invited && o.allow_plus_one); });
      return map;
    },
    enabled: !!guest,
  });

  const allowPlusOneFor = (subEventId: string | null): boolean => {
    if (subEventId) {
      // If there's an explicit per-event override, use it
      if (plusOneOverrides && subEventId in plusOneOverrides) return plusOneOverrides[subEventId];
      // No per-event override — fall back to guest's global allow_plus_one
      return !!guest?.allow_plus_one;
    }
    // For main event (no sub_event), use guest's global allow_plus_one
    return !!guest?.allow_plus_one;
  };

  const [responses, setResponses] = useState<Record<string, { status: string; plus_ones: number; message: string; plus_one_name: string; bringing_plus_one: boolean | null; plus_one_saved: boolean }>>({});

  useEffect(() => {
    if (existingRsvps) {
      const map: Record<string, { status: string; plus_ones: number; message: string; plus_one_name: string; bringing_plus_one: boolean | null; plus_one_saved: boolean }> = {};
      existingRsvps.forEach((r) => {
        const key = r.sub_event_id || "main";
        const savedName = r.plus_one_names?.[0] ?? "";
        map[key] = { status: r.status, plus_ones: r.plus_ones, message: r.message ?? "", plus_one_name: savedName, bringing_plus_one: savedName ? true : null, plus_one_saved: !!savedName };
      });
      setResponses(map);
    }
  }, [existingRsvps]);

  const rsvpMutation = useMutation({
    mutationFn: async ({ subEventId, status, plus_ones, message, plus_one_name }: { subEventId: string | null; status: string; plus_ones: number; message: string; plus_one_name: string }) => {
      const existing = existingRsvps?.find((r) => (subEventId ? r.sub_event_id === subEventId : !r.sub_event_id));
      const plusOneNames = plus_one_name.trim() ? [plus_one_name.trim()] : [];
      if (existing) {
        const { error } = await supabase
          .from("event_rsvps")
          .update({ status, plus_ones, message, plus_one_names: plusOneNames, responded_at: new Date().toISOString() })
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
            plus_one_names: plusOneNames,
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
    const current = responses[key] ?? { status: "pending", plus_ones: 0, message: "", plus_one_name: "", bringing_plus_one: null, plus_one_saved: false };
    // When declining, clear all +1 data
    if (status === "declined") {
      const cleared = { ...current, status, plus_ones: 0, plus_one_name: "", bringing_plus_one: null, plus_one_saved: false };
      setResponses((p) => ({ ...p, [key]: cleared }));
      rsvpMutation.mutate({ subEventId, status, plus_ones: 0, message: cleared.message, plus_one_name: "" });
      return;
    }
    const updated = { ...current, status };
    setResponses((p) => ({ ...p, [key]: updated }));
    rsvpMutation.mutate({ subEventId, status, plus_ones: updated.plus_ones, message: updated.message, plus_one_name: updated.plus_one_name });
  };

  const handleBringingPlusOne = (subEventId: string | null, bringing: boolean) => {
    const key = subEventId || "main";
    const current = responses[key] ?? { status: "pending", plus_ones: 0, message: "", plus_one_name: "", bringing_plus_one: null, plus_one_saved: false };
    if (bringing) {
      setResponses((p) => ({ ...p, [key]: { ...current, bringing_plus_one: true } }));
    } else {
      // Clear +1 name and save the cleared state
      const cleared = { ...current, bringing_plus_one: false, plus_one_name: "", plus_ones: 0, plus_one_saved: false };
      setResponses((p) => ({ ...p, [key]: cleared }));
      rsvpMutation.mutate({ subEventId, status: current.status, plus_ones: 0, message: current.message, plus_one_name: "" });
    }
  };

  const plusOneSaveMutation = useMutation({
    mutationFn: async ({ subEventId, status, plus_ones, message, plus_one_name }: { subEventId: string | null; status: string; plus_ones: number; message: string; plus_one_name: string }) => {
      const existing = existingRsvps?.find((r) => (subEventId ? r.sub_event_id === subEventId : !r.sub_event_id));
      const plusOneNames = plus_one_name.trim() ? [plus_one_name.trim()] : [];
      if (existing) {
        const { error } = await supabase
          .from("event_rsvps")
          .update({ plus_ones: plusOneNames.length, plus_one_names: plusOneNames, responded_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      }
    },
    onSuccess: (_data, vars) => {
      const key = (vars.subEventId || "main");
      setResponses((p) => { const c = p[key]; return c ? { ...p, [key]: { ...c, plus_one_saved: true } } : p; });
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", guest?.id, event.id] });
    },
  });

  const handleSavePlusOne = (subEventId: string | null) => {
    const key = subEventId || "main";
    const current = responses[key];
    if (!current || !current.plus_one_name.trim()) return;
    plusOneSaveMutation.mutate({ subEventId, status: current.status, plus_ones: 1, message: current.message, plus_one_name: current.plus_one_name });
  };

  const handlePlusOneName = (subEventId: string | null, name: string) => {
    const key = subEventId || "main";
    const current = responses[key] ?? { status: "pending", plus_ones: 0, message: "", plus_one_name: "", bringing_plus_one: null, plus_one_saved: false };
    const updated = { ...current, plus_one_name: name, plus_one_saved: false };
    setResponses((p) => ({ ...p, [key]: updated }));
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
      <div className="flex flex-col items-center text-center flex-shrink-0" style={{ minWidth: "56px" }}>
        <span className="text-[0.625rem] sm:text-xs uppercase tracking-wide" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)" }}>{parts.weekday}</span>
        <span className="text-2xl sm:text-3xl font-bold leading-tight" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>{parts.day}</span>
        <span className="text-xs sm:text-sm" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>{parts.month}</span>
        <span className="text-xs sm:text-sm" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)" }}>{parts.year}</span>
      </div>
    );
  };

  const renderSchedule = (subEventId: string | null) => {
    const items = (schedule ?? []).filter((s) => (subEventId ? s.sub_event_id === subEventId : !s.sub_event_id));
    if (items.length === 0) return null;
    return (
      <div className="mt-4 sm:mt-6">
        <div className="space-y-3 sm:space-y-4">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-[5.5rem_1fr] gap-4 items-start sm:grid-cols-[8.5rem_1fr] md:grid-cols-[10rem_1fr] sm:gap-6">
              <div className="text-xs sm:text-sm font-medium leading-snug" style={{ color: "var(--event-primary)", fontFamily: "var(--event-font-body)", whiteSpace: "nowrap", ...programmeItemStyle }}>
                {item.start_time ? formatTime12(item.start_time) : ""}{item.end_time ? ` \u2013 ${formatTime12(item.end_time)}` : ""}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base leading-snug" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)", whiteSpace: "pre-wrap", overflowWrap: "break-word", ...programmeItemStyle }}>{item.title}</p>
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
    const current = responses[key] ?? { status: "pending", plus_ones: 0, message: "", plus_one_name: "", bringing_plus_one: null, plus_one_saved: false };
    const isAttending = current.status === "attending";
    const isDeclined = current.status === "declined";
    return (
      <div className="mt-4 sm:mt-6">
        <div className="flex gap-2 sm:gap-3 justify-center sm:justify-start">
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
        {isAttending && allowPlusOneFor(subEventId) && (
          <div className="mt-3 sm:mt-4">
            <p className="mb-2 text-xs sm:text-sm font-medium" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>{tr("Bringing a +1?", "plusOneQuestion")}</p>
            <div className="flex gap-2 sm:gap-3 justify-center sm:justify-start">
              <button
                onClick={() => handleBringingPlusOne(subEventId, true)}
                className="event-btn-secondary"
                style={{ opacity: current.bringing_plus_one === true ? 1 : 0.6, ...(current.bringing_plus_one === true ? (rsvpContent.plusOneYesSelectedButtonColors ? buttonColorsToStyle(rsvpContent.plusOneYesSelectedButtonColors) : { backgroundColor: "var(--event-surface-alt)", borderColor: "var(--event-primary)" }) : buttonColorsToStyle(rsvpContent.plusOneYesButtonColors)) }}
                onMouseEnter={(e) => { if (current.bringing_plus_one !== true) Object.assign(e.currentTarget.style, buttonColorsToHoverStyle(rsvpContent.plusOneYesButtonColors)); }}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, { opacity: current.bringing_plus_one === true ? 1 : 0.6, ...(current.bringing_plus_one === true ? (rsvpContent.plusOneYesSelectedButtonColors ? buttonColorsToStyle(rsvpContent.plusOneYesSelectedButtonColors) : { backgroundColor: "var(--event-surface-alt)", borderColor: "var(--event-primary)" }) : buttonColorsToStyle(rsvpContent.plusOneYesButtonColors)) })}
              >
                {tr("Yes", "plusOneYes")}
              </button>
              <button
                onClick={() => handleBringingPlusOne(subEventId, false)}
                className="event-btn-secondary"
                style={{ opacity: current.bringing_plus_one === false ? 1 : 0.6, ...(current.bringing_plus_one === false ? (rsvpContent.plusOneNoSelectedButtonColors ? buttonColorsToStyle(rsvpContent.plusOneNoSelectedButtonColors) : { backgroundColor: "var(--event-surface-alt)", borderColor: "var(--event-primary)" }) : buttonColorsToStyle(rsvpContent.plusOneNoButtonColors)) }}
                onMouseEnter={(e) => { if (current.bringing_plus_one !== false) Object.assign(e.currentTarget.style, buttonColorsToHoverStyle(rsvpContent.plusOneNoButtonColors)); }}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, { opacity: current.bringing_plus_one === false ? 1 : 0.6, ...(current.bringing_plus_one === false ? (rsvpContent.plusOneNoSelectedButtonColors ? buttonColorsToStyle(rsvpContent.plusOneNoSelectedButtonColors) : { backgroundColor: "var(--event-surface-alt)", borderColor: "var(--event-primary)" }) : buttonColorsToStyle(rsvpContent.plusOneNoButtonColors)) })}
              >
                {tr("No", "plusOneNo")}
              </button>
            </div>
          </div>
        )}
        {isAttending && allowPlusOneFor(subEventId) && current.bringing_plus_one === true && (
          <div className="mt-3 sm:mt-4">
            <label className="mb-1.5 block text-xs sm:text-sm font-medium" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>Plus One Name</label>
            <input type="text" value={current.plus_one_name} onChange={(e) => handlePlusOneName(subEventId, e.target.value)} placeholder="Enter +1 name" className="event-input" style={{ fontFamily: "var(--event-font-body)" }} />
            {current.plus_one_name.trim() && (
              <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                <button onClick={() => handleSavePlusOne(subEventId)} disabled={plusOneSaveMutation.isPending} className="event-btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem" }}>
                  {plusOneSaveMutation.isPending ? tr("Saving…", "plusOneSaving") : tr("Save +1", "plusOneSaveButton")}
                </button>
                {current.plus_one_saved && !plusOneSaveMutation.isPending && (
                  <span className="text-sm" style={{ color: "var(--event-primary)", fontFamily: "var(--event-font-body)" }}>{tr("Saved!", "plusOneSaved")}</span>
                )}
                {plusOneSaveMutation.isError && (
                  <span className="text-sm" style={{ color: "var(--event-error, #dc2626)", fontFamily: "var(--event-font-body)" }}>{tr("Save failed", "plusOneSaveFailed")}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderEventBlock = (eventName: string, dateStr: string | null, timeStr: string | null, venue: string | null, address: string | null, subEventId: string | null) => {
    return (
      <div className="flex flex-row items-start gap-2 sm:gap-6">
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
    <div className="guest-section">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          {rsvpContent.title && <h1 className="guest-title mb-2 text-center" style={{ whiteSpace: "pre-wrap", ...titleStyle }}>{tr(rsvpContent.title, "title")}</h1>}
          {rsvpDeadline && (
            <p className="mb-2 text-center" style={{ whiteSpace: "pre-wrap", ...rsvpDeadlineStyle, color: rsvpDeadlineStyle.color || "var(--event-muted)" }}>
              {tr(rsvpContent.rsvpDeadlinePrefix || "RSVP by", "rsvpDeadlinePrefix")} {new Date(rsvpDeadline).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
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
