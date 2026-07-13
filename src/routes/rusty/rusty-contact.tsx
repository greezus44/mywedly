import { useRustyContext } from "./rusty-layout";
import { RUSTY_THEME } from "../../lib/theme";
import { formatDate, formatTime } from "../../lib/utils";
import { MapPin, Clock, Calendar, Navigation, Mail, Phone, Info } from "lucide-react";

export type Lang = "en" | "id";

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-6">
      <div className="h-px w-16" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
      <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
      <div className="h-px w-16" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
    </div>
  );
}

export default function RustyContact() {
  const { event, subEvents, schedule } = useRustyContext();

  return (
    <div className="min-h-screen" style={{ backgroundColor: RUSTY_THEME.bgColor!, color: RUSTY_THEME.textColor! }}>
      <header className="pt-16 pb-8 text-center px-6">
        <Info className="w-6 h-6 mx-auto mb-3" style={{ color: RUSTY_THEME.accentColor! }} />
        <h1 className="font-serif text-3xl" style={{ fontFamily: RUSTY_THEME.headingFont }}>Details & Venue</h1>
        <p className="text-sm mt-2 font-serif italic" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.textMutedColor! }}>
          Everything you need to know
        </p>
        <GoldDivider />
      </header>

      <div className="max-w-xl mx-auto px-6 pb-12 space-y-8">
        {/* Main event info */}
        <section className="p-6" style={{ border: `1px solid ${RUSTY_THEME.borderColor}`, borderRadius: "2px", backgroundColor: RUSTY_THEME.bgSubtleColor }}>
          <h2 className="font-serif text-xl mb-5" style={{ fontFamily: RUSTY_THEME.headingFont }}>{event.name}</h2>
          <div className="space-y-3">
            {event.event_date && (
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 mt-0.5" style={{ color: RUSTY_THEME.accentColor! }} />
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: RUSTY_THEME.accentColor! }}>Date</p>
                  <p className="text-sm font-serif" style={{ fontFamily: RUSTY_THEME.headingFont }}>{formatDate(event.event_date)}</p>
                </div>
              </div>
            )}
            {event.event_time && (
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 mt-0.5" style={{ color: RUSTY_THEME.accentColor! }} />
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: RUSTY_THEME.accentColor! }}>Time</p>
                  <p className="text-sm font-serif" style={{ fontFamily: RUSTY_THEME.headingFont }}>{formatTime(event.event_time)}</p>
                </div>
              </div>
            )}
            {event.venue && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5" style={{ color: RUSTY_THEME.accentColor! }} />
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: RUSTY_THEME.accentColor! }}>Venue</p>
                  <p className="text-sm font-serif" style={{ fontFamily: RUSTY_THEME.headingFont }}>{event.venue}</p>
                  {event.address && <p className="text-sm mt-0.5 font-serif italic" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.textMutedColor! }}>{event.address}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Map placeholder */}
          {(event.venue || event.address) && (
            <div className="mt-6">
              <div className="aspect-video flex items-center justify-center" style={{ border: `1px solid ${RUSTY_THEME.borderColor}`, borderRadius: "2px", backgroundColor: RUSTY_THEME.bgColor }}>
                <div className="text-center">
                  <Navigation className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: RUSTY_THEME.accentColor! }} />
                  <p className="text-xs font-serif italic" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.textMutedColor! }}>Map view</p>
                  {event.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue || ""} ${event.address}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-xs uppercase tracking-wider transition-opacity hover:opacity-70"
                      style={{ color: RUSTY_THEME.accentColor! }}
                    >
                      <MapPin className="w-3 h-3" /> Open in Google Maps
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Sub-event venues */}
        {subEvents.length > 0 && (
          <section>
            <GoldDivider />
            <h2 className="font-serif text-xl mb-5 text-center" style={{ fontFamily: RUSTY_THEME.headingFont }}>Event Locations</h2>
            <div className="space-y-4">
              {subEvents.map((se) => (
                <div key={se.id} className="p-5" style={{ border: `1px solid ${RUSTY_THEME.borderColor}`, borderRadius: "2px", backgroundColor: RUSTY_THEME.bgSubtleColor }}>
                  <h3 className="font-serif text-sm font-medium mb-3" style={{ fontFamily: RUSTY_THEME.headingFont }}>{se.name}</h3>
                  <div className="space-y-2">
                    {se.date && (
                      <p className="text-xs flex items-center gap-1.5" style={{ color: RUSTY_THEME.textMutedColor! }}>
                        <Calendar className="w-3 h-3" style={{ color: RUSTY_THEME.accentColor! }} /> {formatDate(se.date)}
                        {se.time && <> · <Clock className="w-3 h-3" style={{ color: RUSTY_THEME.accentColor! }} /> {formatTime(se.time)}</>}
                      </p>
                    )}
                    {se.venue && (
                      <p className="text-xs flex items-center gap-1.5" style={{ color: RUSTY_THEME.textMutedColor! }}>
                        <MapPin className="w-3 h-3" style={{ color: RUSTY_THEME.accentColor! }} /> {se.venue}
                        {se.address && <> · {se.address}</>}
                      </p>
                    )}
                    {se.dress_code && (
                      <p className="text-xs uppercase tracking-wider mt-2" style={{ color: RUSTY_THEME.accentColor! }}>Dress Code: {se.dress_code}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Schedule */}
        {schedule.length > 0 && (
          <section>
            <GoldDivider />
            <h2 className="font-serif text-xl mb-5 text-center" style={{ fontFamily: RUSTY_THEME.headingFont }}>Schedule</h2>
            <div className="space-y-3">
              {schedule.map((item) => (
                <div key={item.id} className="flex items-start gap-4 py-3" style={{ borderBottom: `1px solid ${RUSTY_THEME.borderColor}` }}>
                  <div className="text-xs uppercase tracking-wider min-w-[80px]" style={{ color: RUSTY_THEME.accentColor! }}>
                    {item.start_time ? formatTime(item.start_time) : formatDate(item.schedule_date)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium font-serif" style={{ fontFamily: RUSTY_THEME.headingFont }}>{item.title}</h4>
                    {item.description && <p className="text-xs mt-0.5 font-serif italic" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.textMutedColor! }}>{item.description}</p>}
                    {item.venue && <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: RUSTY_THEME.textMutedColor! }}><MapPin className="w-3 h-3" style={{ color: RUSTY_THEME.accentColor! }} />{item.venue}</p>}
                    {item.dress_code && <p className="text-xs uppercase tracking-wider mt-1" style={{ color: RUSTY_THEME.accentColor! }}>Dress: {item.dress_code}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact info */}
        <section className="text-center pt-4">
          <GoldDivider />
          <p className="text-xs uppercase tracking-wider mb-4" style={{ color: RUSTY_THEME.accentColor! }}>Questions?</p>
          <p className="text-sm font-serif italic" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.textMutedColor! }}>
            For any inquiries about the event, please reach out to the hosts directly.
          </p>
          <div className="flex items-center justify-center gap-6 mt-4" style={{ color: RUSTY_THEME.accentColor! }}>
            <Mail className="w-4 h-4" />
            <Phone className="w-4 h-4" />
          </div>
        </section>
      </div>
    </div>
  );
}
