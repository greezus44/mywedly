import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type ScheduleItem, type GuestEventInvite, type GroupEventInvite, type GuestGroupMember } from "../../lib/supabase";
import { formatDate, formatTime, getCountdown } from "../../lib/utils";
import { useGuestAuth } from "../../lib/guest-auth";
import { RUSTY_CONTENT, RUSTY_THEME } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Calendar, Clock, MapPin, ChevronRight, CalendarCheck } from "lucide-react";

export type Lang = "en" | "id";

interface OutletContext {
  event: UserEvent;
  subEvents: SubEvent[];
  schedule: ScheduleItem[];
  lang: Lang;
  setLang: (lang: Lang) => void;
}

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-4 my-8">
      <div className="w-24 h-px" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
      <div className="w-2 h-2 rotate-45" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
      <div className="w-24 h-px" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
    </div>
  );
}

export default function RustyHome() {
  const navigate = useNavigate();
  const { event, subEvents, schedule } = useOutletContext<OutletContext>();
  const { guestName } = useGuestAuth();

  const content = { ...RUSTY_CONTENT, ...(event.content || {}) };
  const countdown = getCountdown(event.event_date);

  // Determine visible sub-events (same backward-compat logic)
  const { data: visibleSubEvents } = useQuery({
    queryKey: ["rusty-visible-sub-events", event.id, guestName],
    queryFn: async () => {
      if (subEvents.length === 0) return [] as SubEvent[];

      const { data: guestRow } = await supabase
        .from("event_guests")
        .select("id")
        .ilike("name", guestName || "")
        .eq("event_id", event.id)
        .maybeSingle();

      let allowedIds: Set<string> | null = null;

      if (guestRow) {
        const { data: guestInvites } = await supabase
          .from("guest_event_invites")
          .select("*")
          .eq("guest_id", guestRow.id)
          .eq("event_id", event.id);
        if (guestInvites && guestInvites.length > 0) {
          allowedIds = new Set<string>();
          const hasNull = guestInvites.some((i: GuestEventInvite) => i.sub_event_id === null);
          if (hasNull) return subEvents;
          guestInvites.forEach((i: GuestEventInvite) => {
            if (i.sub_event_id) allowedIds!.add(i.sub_event_id);
          });
        }

        const { data: memberships } = await supabase
          .from("guest_group_members")
          .select("group_id")
          .eq("guest_id", guestRow.id);
        if (memberships && memberships.length > 0) {
          const groupIds = memberships.map((m) => m.group_id);
          const { data: groupInvites } = await supabase
            .from("group_event_invites")
            .select("*")
            .in("group_id", groupIds)
            .eq("event_id", event.id);
          if (groupInvites && groupInvites.length > 0) {
            if (!allowedIds) allowedIds = new Set<string>();
            const hasNull = groupInvites.some((i: GroupEventInvite) => i.sub_event_id === null);
            if (hasNull) return subEvents;
            groupInvites.forEach((i: GroupEventInvite) => {
              if (i.sub_event_id) allowedIds!.add(i.sub_event_id);
            });
          }
        }
      }

      if (!allowedIds || allowedIds.size === 0) return subEvents;
      return subEvents.filter((s) => allowedIds!.has(s.id));
    },
    enabled: subEvents.length > 0,
    initialData: subEvents,
  });

  const subEventsToShow = visibleSubEvents || subEvents;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: RUSTY_THEME.bgColor || "#F5ECD7",
        color: RUSTY_THEME.textColor || "#3D3528",
      }}
    >
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-12 text-center">
        {guestName && (
          <p className="text-xs uppercase tracking-[0.3em] opacity-60 mb-6">
            Welcome, {guestName}
          </p>
        )}
        <GoldDivider />
        <h1
          className="font-heading text-5xl md:text-7xl tracking-tight leading-[1.1]"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          {event.name}
        </h1>
        {content.invitation_subtitle && (
          <p className="mt-6 text-base italic opacity-70" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            {content.invitation_subtitle}
          </p>
        )}

        {event.event_date && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm opacity-80">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} /> {formatDate(event.event_date)}
            </span>
            {event.event_time && (
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} /> {formatTime(event.event_time)}
              </span>
            )}
            {event.venue && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} /> {event.venue}
              </span>
            )}
          </div>
        )}

        {!countdown.isPast && (
          <div
            className="mt-8 inline-flex items-center gap-4 px-8 py-3 border"
            style={{ borderColor: RUSTY_THEME.borderColor || "#D4C695", borderRadius: 2 }}
          >
            <span className="text-xs uppercase tracking-[0.2em] opacity-60">Counting Down</span>
            <span
              className="font-heading text-2xl tabular-nums"
              style={{ color: RUSTY_THEME.primaryColor || "#B8962E", fontFamily: '"Cormorant Garamond", serif' }}
            >
              {countdown.days}d {countdown.hours}h {countdown.minutes}m
            </span>
          </div>
        )}
      </section>

      {/* Invitation content */}
      {(content.invitation_body || content.invitation_text) && (
        <section className="max-w-2xl mx-auto px-6 py-12 text-center">
          <GoldDivider />
          {content.invitation_title && (
            <h2
              className="font-heading text-3xl md:text-4xl mb-6"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              {content.invitation_title}
            </h2>
          )}
          <p className="text-base leading-relaxed italic opacity-80" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            {content.invitation_body || content.invitation_text}
          </p>
        </section>
      )}

      {/* Story */}
      {content.story && (
        <section className="max-w-2xl mx-auto px-6 py-12 text-center">
          <GoldDivider />
          <h2 className="font-heading text-3xl md:text-4xl mb-6" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            Our Story
          </h2>
          <p className="text-base leading-relaxed italic opacity-80 whitespace-pre-line" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            {content.story}
          </p>
          {content.story_image && (
            <img
              src={content.story_image}
              alt="Our story"
              className="mt-8 w-full max-w-md mx-auto"
              style={{ borderRadius: 2 }}
            />
          )}
        </section>
      )}

      {/* Sub-events */}
      {subEventsToShow.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 py-12">
          <GoldDivider />
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.3em] opacity-60 mb-2">Schedule of Events</p>
            <h2 className="font-heading text-3xl md:text-4xl" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              Celebrate With Us
            </h2>
          </div>
          <div className="space-y-4">
            {subEventsToShow.map((sub) => (
              <Link
                key={sub.id}
                to={`../rsvp`}
                className="block p-6 border group transition-colors"
                style={{
                  borderColor: RUSTY_THEME.borderColor || "#D4C695",
                  borderRadius: 2,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-xl mb-2" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                      {sub.name}
                    </h3>
                    {sub.date && (
                      <p className="text-sm opacity-70 flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} />
                        {formatDate(sub.date)}
                        {sub.time && <> · {formatTime(sub.time)}</>}
                      </p>
                    )}
                    {sub.venue && (
                      <p className="text-sm opacity-70 flex items-center gap-2 mb-1">
                        <MapPin className="w-3.5 h-3.5" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} /> {sub.venue}
                      </p>
                    )}
                    {sub.description && (
                      <p className="text-sm opacity-70 mt-2 italic">{sub.description}</p>
                    )}
                  </div>
                  <ChevronRight
                    className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
                    style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }}
                  />
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button
              onClick={() => navigate(`../rsvp`)}
              size="lg"
              className="uppercase tracking-[0.2em]"
              style={{
                backgroundColor: RUSTY_THEME.primaryColor || "#B8962E",
                color: RUSTY_THEME.bgColor || "#F5ECD7",
                borderRadius: 2,
              }}
            >
              <CalendarCheck className="w-4 h-4" /> RSVP Now
            </Button>
          </div>
        </section>
      )}

      {/* Single RSVP when no sub-events */}
      {subEventsToShow.length === 0 && (
        <section className="max-w-2xl mx-auto px-6 py-12 text-center">
          <GoldDivider />
          <h2 className="font-heading text-3xl md:text-4xl mb-4" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            Will you join us?
          </h2>
          <p className="text-sm italic opacity-70 mb-8" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            Please let us know if you can make it.
          </p>
          <Button
            onClick={() => navigate(`../rsvp`)}
            size="lg"
            className="uppercase tracking-[0.2em]"
            style={{
              backgroundColor: RUSTY_THEME.primaryColor || "#B8962E",
              color: RUSTY_THEME.bgColor || "#F5ECD7",
              borderRadius: 2,
            }}
          >
            <CalendarCheck className="w-4 h-4" /> {content.rsvp_button_text || "RSVP Now"}
          </Button>
        </section>
      )}

      {/* Schedule preview */}
      {schedule.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 py-12">
          <GoldDivider />
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.3em] opacity-60 mb-2">Timeline</p>
            <h2 className="font-heading text-3xl" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              Day-of Schedule
            </h2>
          </div>
          <div className="space-y-3">
            {schedule.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 p-5 border"
                style={{ borderColor: RUSTY_THEME.borderColor || "#D4C695", borderRadius: 2 }}
              >
                <div className="flex-shrink-0 text-right w-20">
                  {item.start_time && <p className="text-sm font-medium">{formatTime(item.start_time)}</p>}
                  {item.end_time && <p className="text-xs opacity-60">{formatTime(item.end_time)}</p>}
                </div>
                <div className="flex-1 min-w-0 border-l pl-4" style={{ borderColor: RUSTY_THEME.borderColor || "#D4C695" }}>
                  <h3 className="font-heading text-base" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                    {item.title}
                  </h3>
                  {item.venue && (
                    <p className="text-xs opacity-60 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {item.venue}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer nav */}
      <footer className="max-w-2xl mx-auto px-6 py-16">
        <GoldDivider />
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm uppercase tracking-[0.15em]">
          <Link to="../rsvp" className="opacity-60 hover:opacity-100 transition-opacity">RSVP</Link>
          <Link to="../wishes" className="opacity-60 hover:opacity-100 transition-opacity">Wishes</Link>
          <Link to="../contact" className="opacity-60 hover:opacity-100 transition-opacity">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
