import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Calendar, Clock, MapPin } from "lucide-react";
import { formatDate, formatTime, isRsvpClosed, formatDeadline } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import type { GuestLayoutContext } from "./guest-layout";

export default function Home() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { event } = useOutletContext<GuestLayoutContext>();
  const theme = event.theme;

  const rsvpClosed = isRsvpClosed(event.rsvp_deadline);
  const rsvpButtonText = event.content?.rsvp_button_text || "RSVP";

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bgColor, color: theme.bodyColor, fontFamily: theme.bodyFont }}>
      {event.cover_image && (
        <div className="relative w-full h-64 sm:h-80 overflow-hidden">
          <img src={event.cover_image} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      <div className="px-6 py-12 sm:py-16">
        <div className="text-center mb-12">
          {event.content?.invitation_title && (
            <p
              className="text-sm uppercase tracking-[0.25em] mb-4 opacity-60"
              style={{ fontFamily: theme.scriptFont, color: theme.accentColor }}
            >
              {event.content.invitation_title}
            </p>
          )}

          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: theme.headingFont, color: theme.headingColor }}
          >
            {event.name}
          </h1>

          {event.content?.invitation_subtitle && (
            <p
              className="text-base sm:text-lg opacity-70"
              style={{ fontFamily: theme.bodyFont }}
            >
              {event.content.invitation_subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-6 mb-12">
          {event.event_date && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 opacity-50" style={{ color: theme.accentColor }} />
              <span className="text-sm sm:text-base" style={{ color: theme.bodyColor }}>
                {formatDate(event.event_date)}
              </span>
            </div>
          )}

          {event.event_time && (
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 opacity-50" style={{ color: theme.accentColor }} />
              <span className="text-sm sm:text-base" style={{ color: theme.bodyColor }}>
                {formatTime(event.event_time)}
              </span>
            </div>
          )}

          {event.venue && (
            <div className="flex items-center gap-3 text-center">
              <MapPin className="w-4 h-4 opacity-50 flex-shrink-0" style={{ color: theme.accentColor }} />
              <span className="text-sm sm:text-base" style={{ color: theme.bodyColor }}>
                {event.venue}
                {event.address && <span className="block text-xs opacity-60 mt-0.5">{event.address}</span>}
              </span>
            </div>
          )}
        </div>

        {event.content?.invitation_body && (
          <div className="text-center max-w-lg mx-auto mb-12">
            <p
              className="text-sm sm:text-base leading-relaxed opacity-80"
              style={{ fontFamily: theme.bodyFont, color: theme.bodyColor }}
            >
              {event.content.invitation_body}
            </p>
          </div>
        )}

        <div className="flex flex-col items-center gap-3 mb-16">
          <Button
            size="lg"
            onClick={() => navigate(`/${eventId}/rsvp`)}
            disabled={rsvpClosed}
            style={{
              backgroundColor: theme.buttonBgColor,
              color: theme.buttonTextColor,
              borderRadius: `${theme.buttonRadius}px`,
            }}
          >
            {rsvpButtonText}
          </Button>
          {rsvpClosed && event.rsvp_deadline && (
            <p className="text-xs opacity-60" style={{ color: theme.bodyColor }}>
              RSVPs closed on {formatDeadline(event.rsvp_deadline)}
            </p>
          )}
        </div>

        {event.content?.story && (
          <div className="max-w-lg mx-auto text-center mb-16">
            {event.content.story_image && (
              <img
                src={event.content.story_image}
                alt="Our story"
                className="w-full max-h-72 object-cover rounded-2xl mb-8 shadow-sm"
              />
            )}
            <h2
              className="text-xl sm:text-2xl font-semibold mb-4"
              style={{ fontFamily: theme.headingFont, color: theme.headingColor }}
            >
              Our Story
            </h2>
            <p
              className="text-sm sm:text-base leading-relaxed whitespace-pre-line opacity-80"
              style={{ fontFamily: theme.bodyFont, color: theme.bodyColor }}
            >
              {event.content.story}
            </p>
          </div>
        )}

        {event.content?.invitation_text && (
          <div className="text-center mb-8">
            <p
              className="text-base sm:text-lg italic opacity-70"
              style={{ fontFamily: theme.scriptFont, color: theme.accentColor }}
            >
              {event.content.invitation_text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
