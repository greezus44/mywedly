import { useNavigate } from "react-router-dom";
import { useGuestOutletContext } from "./guest-layout";
import { RichTextContent } from "../../lib/sanitize";

interface EventContent {
  welcome_html?: string;
  story_html?: string;
  details_html?: string;
}

export default function GuestHome() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const navigate = useNavigate();
  const hasInvitedEvents = invitedSubEventIds.length > 0;

  const content = (event.content ?? {}) as EventContent;
  const hasWelcome = !!content.welcome_html;
  const hasStory = !!content.story_html;
  const hasDetails = !!content.details_html;
  const hasAnyContent = hasWelcome || hasStory || hasDetails;

  return (
    <div>
      {/* Host-created content sections — only rendered if the host added content */}
      {hasWelcome && (
        <section className="guest-section">
          <div className="mx-auto max-w-2xl">
            <RichTextContent html={content.welcome_html!} />
          </div>
        </section>
      )}

      {hasStory && (
        <section className="guest-section" style={{ backgroundColor: "var(--event-surface-alt)" }}>
          <div className="mx-auto max-w-2xl">
            <RichTextContent html={content.story_html!} />
          </div>
        </section>
      )}

      {hasDetails && (
        <section className="guest-section">
          <div className="mx-auto max-w-2xl">
            <RichTextContent html={content.details_html!} />
          </div>
        </section>
      )}

      {/* ONE RSVP button — only shown if guest has invited events */}
      {hasInvitedEvents && (
        <section className="guest-section text-center">
          <button
            onClick={() => navigate(`/e/${slug}/rsvp`)}
            className="event-btn-primary"
          >
            RSVP Now
          </button>
        </section>
      )}

      {/* Empty state — no content and no invited events */}
      {!hasAnyContent && !hasInvitedEvents && (
        <section className="guest-section text-center">
          <div className="mx-auto max-w-md">
            <p className="guest-subtitle">Welcome to {event.name}. Check back soon for updates.</p>
          </div>
        </section>
      )}

      {/* Empty state — has invited events but no content */}
      {!hasAnyContent && hasInvitedEvents && (
        <section className="guest-section text-center">
          <div className="mx-auto max-w-md">
            <p className="guest-subtitle mb-6">Welcome to {event.name}.</p>
            <button
              onClick={() => navigate(`/e/${slug}/rsvp`)}
              className="event-btn-primary"
            >
              RSVP Now
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
