import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { GuestLayoutContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDate, formatTime, isRsvpClosed } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

export default function Home() {
  const { event } = useOutletContext<GuestLayoutContext>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { guestName } = useGuestAuth();

  const content = event.content;
  const story = content?.story;
  const storyImage = content?.story_image;
  const invitationTitle = content?.invitation_title || "You're Invited";
  const invitationSubtitle = content?.invitation_subtitle || "We would love for you to join us";
  const invitationBody = content?.invitation_body || content?.invitation_text || "";
  const rsvpButtonText = content?.rsvp_button_text || "RSVP";

  const rsvpClosed = isRsvpClosed(event.rsvp_deadline);

  return (
    <div className="animate-fade-in">
      <div className="text-center py-8">
        {guestName && (
          <p
            className="text-sm italic mb-3"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-script)" }}
          >
            Dear {guestName},
          </p>
        )}

        <h1
          className="text-4xl md:text-5xl mb-3"
          style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
        >
          {invitationTitle}
        </h1>

        <p
          className="text-lg italic"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-script)" }}
        >
          {invitationSubtitle}
        </p>
      </div>

      {invitationBody && (
        <div
          className="text-center py-6 border-y"
          style={{ borderColor: "var(--color-border)" }}
        >
          <p
            className="text-sm leading-relaxed max-w-md mx-auto"
            style={{ color: "var(--color-text)" }}
          >
            {invitationBody}
          </p>
        </div>
      )}

      <div className="py-8 space-y-5">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-accent)" }} />
          <div>
            <p
              className="text-[10px] tracking-[0.2em] uppercase"
              style={{ color: "var(--color-text-muted)" }}
            >
              When
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-text)" }}
            >
              {formatDate(event.event_date) || "TBD"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-accent)" }} />
          <div>
            <p
              className="text-[10px] tracking-[0.2em] uppercase"
              style={{ color: "var(--color-text-muted)" }}
            >
              Time
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-text)" }}
            >
              {formatTime(event.event_time) || "TBD"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--color-accent)" }} />
          <div>
            <p
              className="text-[10px] tracking-[0.2em] uppercase"
              style={{ color: "var(--color-text-muted)" }}
            >
              Where
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-text)" }}
            >
              {event.venue || "TBD"}
            </p>
            {event.address && (
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                {event.address}
              </p>
            )}
          </div>
        </div>
      </div>

      {story && (
        <div
          className="py-8 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          <h2
            className="text-xl text-center mb-4"
            style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
          >
            Our Story
          </h2>
          {storyImage && (
            <img
              src={storyImage}
              alt="Our Story"
              className="w-full rounded-lg mb-5 object-cover"
              style={{ maxHeight: 240 }}
            />
          )}
          <p
            className="text-sm leading-relaxed text-center italic"
            style={{ color: "var(--color-text)", fontFamily: "var(--font-script)" }}
          >
            {story}
          </p>
        </div>
      )}

      <div className="py-8 text-center">
        {rsvpClosed ? (
          <p
            className="text-sm italic"
            style={{ color: "var(--color-text-muted)" }}
          >
            RSVPs closed
          </p>
        ) : (
          <Button
            size="lg"
            onClick={() => navigate(`/${eventId}/rsvp`)}
            style={{
              backgroundColor: "var(--color-primary)",
              color: "#ffffff",
              borderRadius: "var(--radius)",
            }}
          >
            {rsvpButtonText}
          </Button>
        )}
      </div>
    </div>
  );
}
