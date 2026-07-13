import { useMemo } from "react";
import { useParams, useNavigate, useOutletContext, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock,
  MapPin,
  Heart,
  ArrowRight,
  CalendarCheck,
  MessageSquare,
  Phone,
} from "lucide-react";
import { supabase, type UserEvent, type ScheduleItem, type EventContent } from "../../lib/supabase";
import { cn, formatDate, formatTime } from "../../lib/utils";
import { DEFAULT_THEME } from "../../lib/theme";
import { Button } from "../../components/ui/Button";

const DEFAULT_CONTENT: EventContent = {
  invitation_title: "You're Invited",
  invitation_subtitle: "We'd be delighted to have you join us",
  invitation_body: "Please join us to celebrate this special occasion.",
  rsvp_button_text: "RSVP",
  story: "",
};

async function fetchSchedule(eventId: string): Promise<ScheduleItem[]> {
  const { data, error } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("event_id", eventId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data as ScheduleItem[]) || [];
}

export default function GuestHome() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { event } = useOutletContext<{ event: UserEvent }>();

  const content = useMemo<EventContent>(
    () => ({ ...DEFAULT_CONTENT, ...(event?.content || {}) }),
    [event],
  );

  const { data: schedule = [] } = useQuery({
    queryKey: ["guest-schedule", event?.id],
    queryFn: () => fetchSchedule(event.id),
    enabled: !!event?.id,
  });

  const eventSlug = slug || event.slug || event.id;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans">
      {/* Top nav */}
      <nav
        className="sticky top-0 z-20 backdrop-blur-sm border-b"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-bg) 95%, transparent)",
          borderColor: "var(--color-border)",
        }}
      >
        <div
          className="mx-auto px-6 py-4 flex items-center justify-between"
          style={{ maxWidth: "var(--max-width)" }}
        >
          <Link
            to={`/e/${eventSlug}/home`}
            className="font-heading text-xl tracking-wide"
            style={{ color: "var(--color-primary)" }}
          >
            {event?.name || "Our Event"}
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <NavButton to={`/e/${eventSlug}/rsvp`} label="RSVP" />
            <NavButton to={`/e/${eventSlug}/wishes`} label="Wishes" />
            <NavButton to={`/e/${eventSlug}/contact`} label="Contact" />
          </div>
        </div>
      </nav>

      {/* Hero / Invitation */}
      <section className="mx-auto px-6 pt-20 pb-12 text-center animate-fade-in-up" style={{ maxWidth: "var(--max-width)" }}>
        {content.invitation_title && (
          <p
            className="font-heading italic text-lg tracking-wide mb-2"
            style={{ color: "var(--color-accent)" }}
          >
            {content.invitation_title}
          </p>
        )}
        <h1
          className="font-heading text-5xl sm:text-6xl tracking-wide leading-tight mb-4"
          style={{ color: "var(--color-text)" }}
        >
          {event?.name || "Our Event"}
        </h1>
        {content.invitation_subtitle && (
          <p
            className="text-base mb-6"
            style={{ color: "var(--color-text-muted)" }}
          >
            {content.invitation_subtitle}
          </p>
        )}
        <Divider />
        {content.invitation_body && (
          <p className="text-base leading-relaxed max-w-xl mx-auto mb-8">
            {content.invitation_body}
          </p>
        )}
      </section>

      {/* Event details */}
      <section className="mx-auto px-6 py-12" style={{ maxWidth: "var(--max-width)" }}>
        <div className="text-center mb-8">
          <p
            className="font-heading italic text-sm uppercase tracking-[0.3em] mb-2"
            style={{ color: "var(--color-accent)" }}
          >
            When &amp; Where
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl tracking-wide" style={{ color: "var(--color-text)" }}>
            Event Details
          </h2>
        </div>

        <div
          className="flex flex-col items-center gap-6 px-8 py-10"
          style={{
            border: `1px solid var(--color-border)`,
            backgroundColor: "var(--color-bg-subtle)",
          }}
        >
          {event?.event_date && (
            <div className="flex items-center gap-3 text-center">
              <CalendarDays className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
              <span className="text-base">{formatDate(event.event_date)}</span>
            </div>
          )}
          {event?.event_time && (
            <div className="flex items-center gap-3 text-center">
              <Clock className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
              <span className="text-base">{formatTime(event.event_time)}</span>
            </div>
          )}
          {event?.venue && (
            <div className="flex items-center gap-3 text-center">
              <MapPin className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
              <span className="text-base">{event.venue}</span>
            </div>
          )}
          {event?.address && (
            <p className="text-sm text-center max-w-md" style={{ color: "var(--color-text-muted)" }}>
              {event.address}
            </p>
          )}
        </div>
      </section>

      {/* Story section */}
      {content.story && (
        <section className="mx-auto px-6 py-12" style={{ maxWidth: "var(--max-width)" }}>
          <div className="text-center mb-8">
            <p
              className="font-heading italic text-sm uppercase tracking-[0.3em] mb-2"
              style={{ color: "var(--color-accent)" }}
            >
              Our Story
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl tracking-wide" style={{ color: "var(--color-text)" }}>
              How It Began
            </h2>
          </div>
          <Divider />
          <div className="flex flex-col items-center gap-6">
            {content.story_image && (
              <img
                src={content.story_image}
                alt="Our story"
                className="w-full max-w-md h-64 object-cover"
                style={{ border: `1px solid var(--color-border)` }}
              />
            )}
            <p className="text-base leading-relaxed text-center max-w-xl">{content.story}</p>
          </div>
        </section>
      )}

      {/* Schedule preview */}
      {schedule.length > 0 && (
        <section className="mx-auto px-6 py-12" style={{ maxWidth: "var(--max-width)" }}>
          <div className="text-center mb-8">
            <p
              className="font-heading italic text-sm uppercase tracking-[0.3em] mb-2"
              style={{ color: "var(--color-accent)" }}
            >
              The Day
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl tracking-wide" style={{ color: "var(--color-text)" }}>
              Schedule
            </h2>
          </div>
          <Divider />
          <div className="flex flex-col gap-4">
            {schedule.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 px-6 py-5"
                style={{
                  border: `1px solid var(--color-border)`,
                  backgroundColor: "var(--color-bg-subtle)",
                }}
              >
                <div className="flex flex-col items-center justify-center min-w-[60px]">
                  {item.start_time && (
                    <span
                      className="font-heading text-xl"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {formatTime(item.start_time)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-lg tracking-wide mb-1" style={{ color: "var(--color-text)" }}>
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {item.description}
                    </p>
                  )}
                  {item.venue && (
                    <p
                      className="text-xs mt-1 flex items-center gap-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <MapPin className="w-3 h-3" /> {item.venue}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* RSVP CTA */}
      <section className="mx-auto px-6 py-16 text-center" style={{ maxWidth: "var(--max-width)" }}>
        <Divider />
        <Heart className="w-8 h-8 mx-auto mb-4" style={{ color: "var(--color-accent)" }} />
        <h2 className="font-heading text-3xl sm:text-4xl tracking-wide mb-4" style={{ color: "var(--color-text)" }}>
          Will You Join Us?
        </h2>
        <p className="text-base mb-8 max-w-md mx-auto" style={{ color: "var(--color-text-muted)" }}>
          Please let us know if you can make it.
        </p>
        <Button
          onClick={() => navigate(`/e/${eventSlug}/rsvp`)}
          size="lg"
          className={cn("px-12 uppercase tracking-[0.25em]")}
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-bg)",
            borderRadius: "var(--radius)",
          }}
        >
          {content.rsvp_button_text || "RSVP"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </section>

      {/* Footer quick links */}
      <footer
        className="border-t"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-subtle)" }}
      >
        <div
          className="mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-center gap-6"
          style={{ maxWidth: "var(--max-width)" }}
        >
          <FooterLink to={`/e/${eventSlug}/rsvp`} icon={<CalendarCheck className="w-4 h-4" />} label="RSVP" />
          <FooterLink to={`/e/${eventSlug}/wishes`} icon={<MessageSquare className="w-4 h-4" />} label="Wishes" />
          <FooterLink to={`/e/${eventSlug}/contact`} icon={<Phone className="w-4 h-4" />} label="Contact" />
        </div>
      </footer>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 my-8" aria-hidden>
      <span className="block h-px w-16" style={{ backgroundColor: "var(--color-accent)" }} />
      <span className="text-lg" style={{ color: "var(--color-accent)" }}>✦</span>
      <span className="block h-px w-16" style={{ backgroundColor: "var(--color-accent)" }} />
    </div>
  );
}

function NavButton({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors hover:opacity-70"
      style={{ color: "var(--color-text)" }}
    >
      {label}
    </Link>
  );
}

function FooterLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] transition-colors hover:opacity-70"
      style={{ color: "var(--color-accent)" }}
    >
      {icon}
      {label}
    </Link>
  );
}
