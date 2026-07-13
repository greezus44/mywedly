import { useOutletContext } from "react-router-dom";
import { DEFAULT_THEME, DEFAULT_CONTENT } from "../../lib/theme";
import { formatDate, formatTime } from "../../lib/utils";
import type { UserEvent } from "../../lib/supabase";
import { Calendar, Clock, MapPin } from "lucide-react";

export default function Home() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const theme = { ...DEFAULT_THEME, ...event.theme };
  const content = { ...DEFAULT_CONTENT, ...event.content };

  return (
    <div style={{ background: theme.bgColor, color: theme.bodyColor, fontFamily: theme.bodyFont }}>
      <section
        className="px-6 py-16 text-center"
        style={{ maxWidth: theme.maxWidth, margin: "0 auto" }}
      >
        {event.event_date && (
          <p
            className="text-xs uppercase tracking-[0.3em] mb-3"
            style={{ color: theme.accentColor, fontFamily: theme.scriptFont }}
          >
            {formatDate(event.event_date)}
          </p>
        )}
        <h1
          className="text-3xl sm:text-4xl font-bold mb-3"
          style={{ color: theme.headingColor, fontFamily: theme.headingFont }}
        >
          {event.name}
        </h1>
        <div
          className="w-12 h-px mx-auto mb-6"
          style={{ background: theme.accentColor, opacity: 0.5 }}
        />
        <p
          className="text-sm leading-relaxed max-w-md mx-auto"
          style={{ color: theme.bodyColor }}
        >
          {content.story || "We invite you to join us for a special celebration."}
        </p>
      </section>

      <section
        className="px-6 py-8"
        style={{ maxWidth: theme.maxWidth, margin: "0 auto" }}
      >
        <div className="grid gap-3">
          {event.event_date && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: `${theme.accentColor}15`, border: `1px solid ${theme.accentColor}25` }}
            >
              <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: theme.primaryColor }} />
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Date</p>
                <p className="text-sm font-medium" style={{ color: theme.headingColor }}>
                  {formatDate(event.event_date)}
                </p>
              </div>
            </div>
          )}

          {event.event_time && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: `${theme.accentColor}15`, border: `1px solid ${theme.accentColor}25` }}
            >
              <Clock className="w-5 h-5 flex-shrink-0" style={{ color: theme.primaryColor }} />
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Time</p>
                <p className="text-sm font-medium" style={{ color: theme.headingColor }}>
                  {formatTime(event.event_time)}
                </p>
              </div>
            </div>
          )}

          {event.venue && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: `${theme.accentColor}15`, border: `1px solid ${theme.accentColor}25` }}
            >
              <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: theme.primaryColor }} />
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Venue</p>
                <p className="text-sm font-medium" style={{ color: theme.headingColor }}>
                  {event.venue}
                </p>
                {event.address && (
                  <p className="text-xs mt-0.5 opacity-70">{event.address}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {content.story && content.story !== "We invite you to join us for a special celebration." && (
        <section
          className="px-6 py-12"
          style={{ maxWidth: theme.maxWidth, margin: "0 auto" }}
        >
          <h2
            className="text-xl font-semibold mb-4 text-center"
            style={{ color: theme.headingColor, fontFamily: theme.headingFont }}
          >
            Our Story
          </h2>
          {content.story_image && (
            <img
              src={content.story_image}
              alt="Story"
              className="w-full h-56 object-cover rounded-xl mb-6"
              style={{ border: `1px solid ${theme.accentColor}20` }}
            />
          )}
          <p
            className="text-sm leading-relaxed whitespace-pre-line"
            style={{ color: theme.bodyColor }}
          >
            {content.story}
          </p>
        </section>
      )}

      {content.sections.map((section) => (
        <section
          key={section.id}
          className="px-6 py-12"
          style={{ maxWidth: theme.maxWidth, margin: "0 auto" }}
        >
          <h2
            className="text-xl font-semibold mb-4 text-center"
            style={{ color: theme.headingColor, fontFamily: theme.headingFont }}
          >
            {section.title}
          </h2>
          {section.image && (
            <img
              src={section.image}
              alt={section.title}
              className="w-full h-56 object-cover rounded-xl mb-6"
              style={{ border: `1px solid ${theme.accentColor}20` }}
            />
          )}
          <p
            className="text-sm leading-relaxed whitespace-pre-line"
            style={{ color: theme.bodyColor }}
          >
            {section.body}
          </p>
        </section>
      ))}
    </div>
  );
}
