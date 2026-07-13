import { useOutletContext, Link } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";
import { themeToEventCssVars } from "../../lib/theme";
import { RichTextContent } from "../../lib/sanitize";

export default function GuestHomePage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const content = event.content ?? {};
  const cssVars = themeToEventCssVars(event.theme);
  const countdown = getCountdown(event.event_date);

  return (
    <div className="event-themed min-h-screen" style={cssVars}>
      {/* Hero / invitation */}
      <section className="px-6 py-16 text-center">
        {content.rich_title ? (
          <RichTextContent
            html={content.rich_title}
            className="font-heading text-3xl md:text-5xl"
          />
        ) : (
          <h1 className="font-heading text-3xl md:text-5xl">{event.name}</h1>
        )}
        {content.rich_subtitle && (
          <RichTextContent
            html={content.rich_subtitle}
            className="font-script mt-4 text-xl"
          />
        )}
        {event.event_date && (
          <p className="font-body mt-4 text-sm uppercase tracking-widest text-muted">
            {formatDate(event.event_date)}
            {event.event_time && ` • ${formatTime12(event.event_time)}`}
          </p>
        )}
        {event.venue && (
          <p className="font-body mt-2 text-sm text-muted">{event.venue}</p>
        )}

        {/* Countdown */}
        {!countdown.isPast && event.event_date && (
          <div className="mt-8 flex justify-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{countdown.days}</p>
              <p className="text-xs uppercase tracking-wider text-muted">Days</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{countdown.hours}</p>
              <p className="text-xs uppercase tracking-wider text-muted">Hours</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{countdown.minutes}</p>
              <p className="text-xs uppercase tracking-wider text-muted">Min</p>
            </div>
          </div>
        )}
      </section>

      {/* Story */}
      {(content.story || content.story_image) && (
        <section className="border-current px-6 py-12">
          {content.story_image && (
            <img
              src={content.story_image}
              alt="Story"
              className="mx-auto mb-6 max-h-80 rounded-lg object-cover"
            />
          )}
          {content.story && (
            <p className="font-body mx-auto max-w-2xl text-base leading-relaxed text-current">
              {content.story}
            </p>
          )}
        </section>
      )}

      {/* Invitation body */}
      {content.rich_body && (
        <section className="border-current px-6 py-12">
          <RichTextContent
            html={content.rich_body}
            className="font-body mx-auto max-w-2xl text-base leading-relaxed text-current"
          />
        </section>
      )}

      {/* Actions */}
      <section className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <Link to="rsvp">
          <button
            className="font-body rounded-md px-8 py-3 text-sm font-medium uppercase tracking-wider"
            style={{
              backgroundColor: "var(--event-primary)",
              color: "var(--event-bg)",
              borderRadius: "var(--event-button-radius)",
            }}
          >
            {content.rsvp_button_text ?? "RSVP Now"}
          </button>
        </Link>
        <Link to="wishes">
          <button
            className="font-body rounded-md px-8 py-3 text-sm font-medium uppercase tracking-wider"
            style={{
              backgroundColor: "var(--event-surface)",
              color: "var(--event-primary)",
              border: "1px solid var(--event-border)",
              borderRadius: "var(--event-button-radius)",
            }}
          >
            Leave a Wish
          </button>
        </Link>
      </section>
    </div>
  );
}
