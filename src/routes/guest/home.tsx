import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type ScheduleItem, type GuestEventInvite, type GroupEventInvite, type GuestGroupMember } from "../../lib/supabase";
import { cn, formatDate, formatTime, getCountdown, getEventStatus } from "../../lib/utils";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Calendar, Clock, MapPin, ArrowRight, CalendarCheck, Heart, ChevronRight } from "lucide-react";

interface OutletContext {
  event: UserEvent;
  subEvents: SubEvent[];
  schedule: ScheduleItem[];
}

export default function GuestHome() {
  const navigate = useNavigate();
  const { event, subEvents, schedule } = useOutletContext<OutletContext>();
  const { guestName } = useGuestAuth();

  const content = event.content || {};
  const status = getEventStatus(event.event_date);
  const countdown = getCountdown(event.event_date);

  // Determine which sub-events this guest is invited to.
  // For simplicity: if no invitation records exist at all, show all sub-events (backward compat).
  const { data: visibleSubEvents } = useQuery({
    queryKey: ["guest-visible-sub-events", event.id, guestName],
    queryFn: async () => {
      if (subEvents.length === 0) return [] as SubEvent[];

      // Try to find a guest record by name (case-insensitive)
      const { data: guestRow } = await supabase
        .from("event_guests")
        .select("id")
        .ilike("name", guestName || "")
        .eq("event_id", event.id)
        .maybeSingle();

      let allowedIds: Set<string> | null = null;

      if (guestRow) {
        // Direct guest invites
        const { data: guestInvites } = await supabase
          .from("guest_event_invites")
          .select("*")
          .eq("guest_id", guestRow.id)
          .eq("event_id", event.id);
        if (guestInvites && guestInvites.length > 0) {
          allowedIds = new Set<string>();
          // null sub_event_id means "all sub-events"
          const hasNull = guestInvites.some((i: GuestEventInvite) => i.sub_event_id === null);
          if (hasNull) return subEvents;
          guestInvites.forEach((i: GuestEventInvite) => {
            if (i.sub_event_id) allowedIds!.add(i.sub_event_id);
          });
        }

        // Group-based invites
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

      // Backward compatibility: if no invitation records found, show all sub-events
      if (!allowedIds || allowedIds.size === 0) return subEvents;
      return subEvents.filter((s) => allowedIds!.has(s.id));
    },
    enabled: subEvents.length > 0,
    initialData: subEvents,
  });

  const subEventsToShow = visibleSubEvents || subEvents;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Hero / Event Header */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
        {guestName && (
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-4">
            Welcome, {guestName}
          </p>
        )}
        <h1 className="font-heading text-4xl md:text-6xl tracking-tight">{event.name}</h1>
        {content.invitation_subtitle && (
          <p className="mt-4 text-sm md:text-base text-[var(--color-text-muted)]">{content.invitation_subtitle}</p>
        )}

        {event.event_date && (
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-[var(--color-text-muted)]">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> {formatDate(event.event_date)}
            </span>
            {event.event_time && (
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> {formatTime(event.event_time)}
              </span>
            )}
            {event.venue && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {event.venue}
              </span>
            )}
          </div>
        )}

        {!countdown.isPast && status !== "completed" && (
          <div className="mt-8 inline-flex items-center gap-4 px-6 py-3 border border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
            <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Countdown</span>
            <span className="font-heading text-2xl tabular-nums">
              {countdown.days}d {countdown.hours}h {countdown.minutes}m
            </span>
          </div>
        )}
      </section>

      {/* Invitation content */}
      {(content.invitation_body || content.invitation_text) && (
        <section className="max-w-2xl mx-auto px-6 py-12 text-center border-t border-[var(--color-border)]">
          {content.invitation_title && (
            <h2 className="font-heading text-2xl md:text-3xl mb-4">{content.invitation_title}</h2>
          )}
          <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
            {content.invitation_body || content.invitation_text}
          </p>
        </section>
      )}

      {/* Story */}
      {content.story && (
        <section className="max-w-2xl mx-auto px-6 py-12 text-center border-t border-[var(--color-border)]">
          <Heart className="w-6 h-6 mx-auto mb-4 text-[var(--color-accent)]" />
          <h2 className="font-heading text-2xl md:text-3xl mb-4">Our Story</h2>
          <p className="text-base leading-relaxed text-[var(--color-text-muted)] whitespace-pre-line">{content.story}</p>
          {content.story_image && (
            <img src={content.story_image} alt="Our story" className="mt-8 w-full max-w-md mx-auto" style={{ borderRadius: "var(--radius)" }} />
          )}
        </section>
      )}

      {/* Sub-events */}
      {subEventsToShow.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 py-12 border-t border-[var(--color-border)]">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Schedule of Events</p>
            <h2 className="font-heading text-2xl md:text-3xl">Celebrate With Us</h2>
          </div>
          <div className="space-y-4">
            {subEventsToShow.map((sub) => (
              <Link
                key={sub.id}
                to={`../rsvp`}
                className="block p-6 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors group"
                style={{ borderRadius: "var(--radius)" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-xl mb-2">{sub.name}</h3>
                    {sub.date && (
                      <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(sub.date)}
                        {sub.time && <> · {formatTime(sub.time)}</>}
                      </p>
                    )}
                    {sub.venue && (
                      <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-2 mb-1">
                        <MapPin className="w-3.5 h-3.5" /> {sub.venue}
                      </p>
                    )}
                    {sub.description && (
                      <p className="text-sm text-[var(--color-text-muted)] mt-2">{sub.description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button onClick={() => navigate(`../rsvp`)} size="lg">
              <CalendarCheck className="w-4 h-4" /> RSVP Now
            </Button>
          </div>
        </section>
      )}

      {/* Single RSVP button when no sub-events */}
      {subEventsToShow.length === 0 && (
        <section className="max-w-2xl mx-auto px-6 py-12 text-center border-t border-[var(--color-border)]">
          <h2 className="font-heading text-2xl md:text-3xl mb-4">Will you join us?</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            Please let us know if you can make it.
          </p>
          <Button onClick={() => navigate(`../rsvp`)} size="lg">
            <CalendarCheck className="w-4 h-4" /> {content.rsvp_button_text || "RSVP Now"}
          </Button>
        </section>
      )}

      {/* Schedule preview */}
      {schedule.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 py-12 border-t border-[var(--color-border)]">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Timeline</p>
            <h2 className="font-heading text-2xl md:text-3xl">Day-of Schedule</h2>
          </div>
          <div className="space-y-3">
            {schedule.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-start gap-4 p-4 border border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
                <div className="flex-shrink-0 text-right w-20">
                  {item.start_time && (
                    <p className="text-sm font-medium">{formatTime(item.start_time)}</p>
                  )}
                  {item.end_time && (
                    <p className="text-xs text-[var(--color-text-muted)]">{formatTime(item.end_time)}</p>
                  )}
                </div>
                <div className="flex-1 min-w-0 border-l border-[var(--color-border)] pl-4">
                  <h3 className="font-heading text-base">{item.title}</h3>
                  {item.venue && (
                    <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
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
      <footer className="max-w-2xl mx-auto px-6 py-12 border-t border-[var(--color-border)]">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <Link to="../rsvp" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">RSVP</Link>
          <span className="text-[var(--color-border)]">·</span>
          <Link to="../wishes" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">Wishes</Link>
          <span className="text-[var(--color-border)]">·</span>
          <Link to="../contact" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
