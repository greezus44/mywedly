import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { Calendar, Clock, MapPin, ArrowLeft } from "lucide-react";
import { UserEvent } from "../../lib/supabase";
import { formatDate, formatTime } from "../../lib/utils";
import { shouldShowLogo, getLogoStyle } from "../../lib/theme";
import type { GuestLayoutContext } from "./guest-layout";

export default function Home() {
  const { event } = useOutletContext<GuestLayoutContext>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const theme = event.theme;
  const content = event.content;

  return (
    <div className="w-full" style={{ backgroundColor: theme.bgColor }}>
      <div
        className="text-center py-16 px-6"
        style={{ padding: `${theme.sectionPadding}px 24px` }}
      >
        {shouldShowLogo(event.logo_config) && (
          <div className="mb-6 flex justify-center">
            {event.logo_config.image ? (
              <img
                src={event.logo_config.image}
                alt={event.name}
                className="max-h-16 object-contain"
              />
            ) : (
              <div style={getLogoStyle(event.logo_config)}>
                {event.logo_config.text}
              </div>
            )}
          </div>
        )}

        <p
          className="text-lg mb-3 opacity-80"
          style={{ fontFamily: `var(--wed-script-font)` }}
        >
          Join us for
        </p>

        <h1
          className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
          style={{
            fontFamily: `var(--wed-heading-font)`,
            color: theme.headingColor,
          }}
        >
          {event.name}
        </h1>

        <div
          className="w-12 h-px mx-auto mb-6"
          style={{ backgroundColor: theme.primaryColor, opacity: 0.5 }}
        />

        <div
          className="space-y-3 max-w-md mx-auto"
          style={{ color: theme.bodyColor }}
        >
          {event.event_date && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <Calendar className="w-4 h-4 opacity-60" />
              <span>{formatDate(event.event_date)}</span>
            </div>
          )}
          {event.event_time && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="w-4 h-4 opacity-60" />
              <span>{formatTime(event.event_time)}</span>
            </div>
          )}
          {event.venue && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <MapPin className="w-4 h-4 opacity-60" />
              <span>{event.venue}</span>
            </div>
          )}
          {event.address && (
            <p className="text-sm opacity-60">{event.address}</p>
          )}
        </div>
      </div>

      {content.story_image && (
        <div
          className="w-full"
          style={{ maxWidth: `${theme.maxWidth}px`, margin: "0 auto" }}
        >
          <img
            src={content.story_image}
            alt="Our story"
            className="w-full h-64 md:h-96 object-cover"
          />
        </div>
      )}

      {content.story && (
        <div
          className="py-16 px-6 text-center"
          style={{
            maxWidth: `${theme.maxWidth}px`,
            margin: "0 auto",
            padding: `${theme.sectionPadding}px 24px`,
          }}
        >
          <p
            className="text-base mb-2 opacity-70"
            style={{ fontFamily: `var(--wed-script-font)` }}
          >
            Our Story
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold mb-8"
            style={{
              fontFamily: `var(--wed-heading-font)`,
              color: theme.headingColor,
            }}
          >
            How it began
          </h2>
          <div
            className="w-12 h-px mx-auto mb-8"
            style={{ backgroundColor: theme.primaryColor, opacity: 0.5 }}
          />
          <p
            className="text-sm md:text-base leading-relaxed whitespace-pre-wrap"
            style={{
              color: theme.bodyColor,
              fontFamily: `var(--wed-body-font)`,
            }}
          >
            {content.story}
          </p>
        </div>
      )}

      {content.gallery && content.gallery.length > 0 && (
        <div
          className="py-16 px-6"
          style={{ padding: `${theme.sectionPadding}px 24px` }}
        >
          <h2
            className="text-3xl font-bold mb-2 text-center"
            style={{
              fontFamily: `var(--wed-heading-font)`,
              color: theme.headingColor,
            }}
          >
            Gallery
          </h2>
          <p
            className="text-center text-sm opacity-60 mb-8"
            style={{ fontFamily: `var(--wed-script-font)`, fontSize: "1rem" }}
          >
            Moments we cherish
          </p>
          <div
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
            style={{ maxWidth: `${theme.maxWidth}px`, margin: "0 auto" }}
          >
            {content.gallery.slice(0, 6).map((img, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-lg"
                style={{ aspectRatio: "1 / 1" }}
              >
                <img
                  src={img}
                  alt={content.gallery_titles?.[i] || ""}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pb-20 px-6 text-center">
        <button
          onClick={() => navigate(`/${eventId}`)}
          className="inline-flex items-center gap-2 text-xs opacity-50 hover:opacity-80 transition-opacity"
          style={{ color: theme.bodyColor }}
        >
          <ArrowLeft className="w-3 h-3" />
          Back to cover
        </button>
      </div>
    </div>
  );
}
