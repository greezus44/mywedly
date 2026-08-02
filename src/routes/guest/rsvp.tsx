import { useState, useEffect } from "react";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase, type EventRsvp, type EventSchedule, type SubEvent, type Json } from "../../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatTime12 } from "../../lib/utils";
import { getTypographyText, getTypographyStyle } from "../../lib/typography";
import { buttonColorsToStyle, buttonColorsToHoverStyle, type ButtonColors } from "../../components/ui/ButtonColourEditor";

interface RsvpContent {
  title?: string;
  subtitle?: string;
  attendingText?: string;
  declinedText?: string;
  attendingMessage?: string;
  declinedMessage?: string;
  attendingColor?: string;
  declinedColor?: string;
  attendingButtonColors?: ButtonColors;
  declinedButtonColors?: ButtonColors;
  scheduleHeading?: unknown;
  guestNameTypography?: unknown;
  additionalInfoHeading?: unknown;
  additionalInfoBody?: string;
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
  const queryClient = useQueryClient();

  const rsvpContent: RsvpContent = {
    ...DEFAULT_RSVP_CONTENT,
    ...(((event.content as Record<string, unknown> | null)?.rsvp as Partial<RsvpContent>) ?? {}),
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
    const updated = { ...current, status };
    setResponses((p) => ({ ...p, [key]: updated }));
    rsvpMutation.mutate({ subEventId, status, plus_ones: updated.plus_ones, message: updated.message });
  };

  const scheduleHeadingText = getTypographyText(rsvpContent.scheduleHeading, "Schedule");
  const scheduleHeadingStyle = getTypographyStyle(rsvpContent.scheduleHeading);
  const guestNameText = guest?.name ? getTypographyText(rsvpContent.guestNameTypography, guest.name) : "";
  const guestNameStyle = getTypographyStyle(rsvpContent.guestNameTypography);
  const additionalInfoHeadingText = getTypographyText(rsvpContent.additionalInfoHeading, "");
  const additionalInfoHeadingStyle = getTypographyStyle(rsvpContent.additionalInfoHeading);
  const additionalInfoBody = rsvpContent.additionalInfoBody;
  const showAdditionalInfo = !!(additionalInfoHeadingText || (additionalInfoBody && additionalInfoBody.trim()));

  const attendingSelectedStyle = (isSelected: boolean): React.CSSProperties => {
    if (!isSelected) return {};
    const base: React.CSSProperties = {};
    if (rsvpContent.attendingColor) { base.backgroundColor = rsvpContent.attendingColor; base.borderColor = rsvpContent.attendingColor; }
    return base;
  };
  const declinedSelectedStyle = (isSelected: boolean): React.CSSProperties => {
    if (!isSelected) return {};
    const base: React.CSSProperties = {};
    if (rsvpContent.declinedColor) { base.backgroundColor = rsvpContent.declinedColor; base.borderColor = rsvpContent.declinedColor; base.color = "#fff"; }
    return base;
  };

  const renderDateColumn = (dateStr: string | null | undefined) => {
    const parts = getDateParts(dateStr);
    if (!parts) return null;
    return (
      <div className="flex flex-col items-center text-center" style={{ minWidth: "90px" }}>
        <span className="text-xs uppercase tracking-wide" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)" }}>{parts.weekday}</span>
        <span className="text-3xl font-bold leading-tight" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>{parts.day}</span>
        <span className="text-sm" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>{parts.month}</span>
        <span className="text-sm" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)" }}>{parts.year}</span>
      </div>
    );
  };

  const renderSchedule = (subEventId: string | null) => {
    const items = (schedule ?? []).filter((s) => (subEventId ? s.sub_event_id === subEventId : !s.sub_event_id));
    if (items.length === 0) return null;
    return (
      <div className="mt-6">
        {scheduleHeadingText && <h3 className="mb-4" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)", ...scheduleHeadingStyle }}>{scheduleHeadingText}</h3>}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-[100px_1fr] gap-4 items-start">
              <div className="text-sm font-medium" style={{ color: "var(--event-primary)", fontFamily: "var(--event-font-body)" }}>
                {item.start_time ? formatTime12(item.start_time) : ""}
              </div>
              <div>
                <p className="font-medium" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>{item.title}</p>
                {item.description && <p className="text-sm" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)" }}>{item.description}</p>}
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
      <div className="mt-6">
        {additionalInfoHeadingText && <h3 className="mb-2" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)", ...additionalInfoHeadingStyle }}>{additionalInfoHeadingText}</h3>}
        {additionalInfoBody && additionalInfoBody.trim() && (
          <div className="whitespace-pre-wrap text-sm" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>{additionalInfoBody}</div>
        )}
      </div>
    );
  };

  const renderRsvpButtons = (subEventId: string | null) => {
    const key = subEventId || "main";
    const current = responses[key] ?? { status: "pending", plus_ones: 0, message: "" };
    const isAttending = current.status === "attending";
    const isDeclined = current.status === "declined";
    return (
      <div className="mt-6">
        <div className="flex gap-3">
          <button
            onClick={() => handleRsvp(subEventId, "attending")}
            className="event-btn-primary"
            style={{ opacity: isAttending ? 1 : 0.6, ...attendingSelectedStyle(isAttending), ...buttonColorsToStyle(rsvpContent.attendingButtonColors) }}
            onMouseEnter={(e) => { if (!isAttending) Object.assign(e.currentTarget.style, buttonColorsToHoverStyle(rsvpContent.attendingButtonColors)); }}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, { opacity: isAttending ? 1 : 0.6, ...attendingSelectedStyle(isAttending), ...buttonColorsToStyle(rsvpContent.attendingButtonColors) })}
          >
            {rsvpContent.attendingText}
          </button>
          <button
            onClick={() => handleRsvp(subEventId, "declined")}
            className="event-btn-secondary"
            style={{ opacity: isDeclined ? 1 : 0.6, ...declinedSelectedStyle(isDeclined), ...buttonColorsToStyle(rsvpContent.declinedButtonColors) }}
            onMouseEnter={(e) => { if (!isDeclined) Object.assign(e.currentTarget.style, buttonColorsToHoverStyle(rsvpContent.declinedButtonColors)); }}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, { opacity: isDeclined ? 1 : 0.6, ...declinedSelectedStyle(isDeclined), ...buttonColorsToStyle(rsvpContent.declinedButtonColors) })}
          >
            {rsvpContent.declinedText}
          </button>
        </div>
        {isAttending && rsvpContent.attendingMessage && (
          <p className="mt-2 text-center text-sm" style={{ color: "var(--event-muted)" }}>{rsvpContent.attendingMessage}</p>
        )}
        {isDeclined && rsvpContent.declinedMessage && (
          <p className="mt-2 text-center text-sm" style={{ color: "var(--event-muted)" }}>{rsvpContent.declinedMessage}</p>
        )}
      </div>
    );
  };

  const renderEventBlock = (eventName: string, dateStr: string | null, timeStr: string | null, venue: string | null, address: string | null, subEventId: string | null) => {
    return (
      <div className="flex gap-6 sm:gap-8">
        {renderDateColumn(dateStr)}
        <div className="flex-1">
          {eventName && <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>{eventName}</h2>}
          {timeStr && <p className="text-sm mb-1" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>{formatTime12(timeStr)}</p>}
          {venue && <p className="text-sm" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>{venue}</p>}
          {address && <p className="text-sm" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)" }}>{address}</p>}
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
        <div className="mb-8 text-center">
          {rsvpContent.title && <h1 className="guest-title mb-2 text-center">{rsvpContent.title}</h1>}
          {guestNameText && <p className="guest-subtitle text-center" style={{ margin: "0 auto", ...guestNameStyle }}>{guestNameText}</p>}
        </div>

        {/* Multiple sub-events or single main event */}
        {hasSubEvents ? (
          <div className="space-y-8">
            {subEvents!.map((se, i) => (
              <div key={se.id}>
                {i > 0 && <hr className="border-0 border-t my-8" style={{ borderColor: "var(--event-border)" }} />}
                {renderEventBlock(se.name, se.date, se.time ?? se.start_time, se.venue, se.address, se.id)}
              </div>
            ))}
          </div>
        ) : (
          renderEventBlock(event.name ?? "", event.event_date, event.event_time, event.venue, event.address, null)
        )}
      </div>
    </div>
  );
}
