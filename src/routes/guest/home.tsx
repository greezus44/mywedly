import { useNavigate } from "react-router-dom";
import { useGuestOutletContext } from "./guest-layout";
import { RichTextContent } from "../../lib/sanitize";
import { resolveTypography } from "../../lib/typography";

interface EventContent {
  sections?: Array<{ heading?: unknown; body?: string }>;
  heading?: unknown;
  body?: string;
}

export default function GuestHome() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const navigate = useNavigate();
  const hasInvitedEvents = invitedSubEventIds.length > 0;
  const content = (event.content ?? {}) as EventContent;
  const sections = content.sections ?? (content.heading || content.body ? [{ heading: content.heading, body: content.body }] : []);

  return (
    <div>
      {sections.length === 0 && !hasInvitedEvents && (
        <section className="guest-section text-center">
          <div className="mx-auto max-w-md">
            <p className="guest-subtitle">Welcome to {event.name}. Check back soon for updates.</p>
          </div>
        </section>
      )}
      {sections.map((section, i) => {
        const heading = resolveTypography(section.heading, "");
        return (
          <section key={i} className="guest-section">
            <div className="mx-auto max-w-3xl">
              {heading.text && <h2 className="guest-title mb-4" style={heading.style}>{heading.text}</h2>}
              {section.body && <RichTextContent html={section.body} />}
            </div>
          </section>
        );
      })}
      {hasInvitedEvents && (
        <section className="guest-section text-center">
          <button onClick={() => navigate(`/e/${slug}/rsvp`)} className="event-btn-primary">RSVP Now</button>
        </section>
      )}
    </div>
  );
}
