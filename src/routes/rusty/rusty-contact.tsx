import { useOutletContext } from "react-router-dom";
import { type UserEvent, type SubEvent, type ScheduleItem } from "../../lib/supabase";
import { formatDate, formatTime } from "../../lib/utils";
import { RUSTY_THEME } from "../../lib/theme";
import { MapPin, Clock, Calendar, Navigation, ExternalLink } from "lucide-react";

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

export default function RustyContact() {
  const { event, subEvents, schedule } = useOutletContext<OutletContext>();

  const fullAddress = [event.venue, event.address].filter(Boolean).join(", ");
  const mapUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null;
  const mapEmbed = fullAddress
    ? `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`
    : null;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: RUSTY_THEME.bgColor || "#F5ECD7",
        color: RUSTY_THEME.textColor || "#3D3528",
      }}
    >
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <MapPin className="w-8 h-8 mx-auto mb-4" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} />
          <p className="text-xs uppercase tracking-[0.3em] opacity-60 mb-2">Find Us</p>
          <h1
            className="font-heading text-4xl md:text-5xl tracking-tight"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            Venue & Contact
          </h1>
        </div>

        <GoldDivider />

        {/* Main event venue */}
        <section className="mb-12">
          <div
            className="p-8 border"
            style={{
              borderColor: RUSTY_THEME.borderColor || "#D4C695",
              borderRadius: 2,
              backgroundColor: RUSTY_THEME.bgSubtleColor || "#FAF3E0",
            }}
          >
            <h2
              className="font-heading text-2xl mb-6 text-center"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              {event.name}
            </h2>

            {event.event_date && (
              <div className="flex items-start gap-3 mb-4">
                <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] opacity-60">Date</p>
                  <p className="text-sm">{formatDate(event.event_date)}</p>
                </div>
              </div>
            )}

            {event.event_time && (
              <div className="flex items-start gap-3 mb-4">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] opacity-60">Time</p>
                  <p className="text-sm">{formatTime(event.event_time)}</p>
                </div>
              </div>
            )}

            {event.venue && (
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] opacity-60">Venue</p>
                  <p className="text-sm">{event.venue}</p>
                </div>
              </div>
            )}

            {event.address && (
              <div className="flex items-start gap-3 mb-6">
                <Navigation className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] opacity-60">Address</p>
                  <p className="text-sm">{event.address}</p>
                </div>
              </div>
            )}

            {mapUrl && (
              <div className="text-center mt-6">
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.15em] hover:underline"
                  style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }}
                >
                  <ExternalLink className="w-4 h-4" /> Open in Google Maps
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Map */}
        {mapEmbed && (
          <section className="mb-12">
            <div className="border overflow-hidden" style={{ borderColor: RUSTY_THEME.borderColor || "#D4C695", borderRadius: 2 }}>
              <iframe
                title="Venue map"
                src={mapEmbed}
                width="100%"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        )}

        {/* Sub-event venues */}
        {subEvents.length > 0 && (
          <section className="mb-12">
            <GoldDivider />
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-[0.3em] opacity-60 mb-2">Additional Venues</p>
              <h2 className="font-heading text-2xl" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                Event Locations
              </h2>
            </div>
            <div className="space-y-4">
              {subEvents.map((sub) => {
                const subAddress = [sub.venue, sub.address].filter(Boolean).join(", ");
                const subMapUrl = subAddress
                  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(subAddress)}`
                  : null;
                return (
                  <div
                    key={sub.id}
                    className="p-6 border"
                    style={{
                      borderColor: RUSTY_THEME.borderColor || "#D4C695",
                      borderRadius: 2,
                      backgroundColor: RUSTY_THEME.bgSubtleColor || "#FAF3E0",
                    }}
                  >
                    <h3 className="font-heading text-lg mb-3" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
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
                    {sub.address && (
                      <p className="text-sm opacity-70 flex items-center gap-2">
                        <Navigation className="w-3.5 h-3.5" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} /> {sub.address}
                      </p>
                    )}
                    {subMapUrl && (
                      <a
                        href={subMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] hover:underline mt-3"
                        style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Directions
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Schedule with venues */}
        {schedule.length > 0 && (
          <section>
            <GoldDivider />
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-[0.3em] opacity-60 mb-2">Day-of Timeline</p>
              <h2 className="font-heading text-2xl" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                Schedule
              </h2>
            </div>
            <div className="space-y-3">
              {schedule.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-5 border"
                  style={{
                    borderColor: RUSTY_THEME.borderColor || "#D4C695",
                    borderRadius: 2,
                    backgroundColor: RUSTY_THEME.bgSubtleColor || "#FAF3E0",
                  }}
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
                    {item.description && (
                      <p className="text-xs opacity-60 mt-1 italic">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
