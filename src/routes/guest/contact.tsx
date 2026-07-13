import { useOutletContext } from "react-router-dom";
import { type UserEvent, type SubEvent, type ScheduleItem } from "../../lib/supabase";
import { formatDate, formatTime } from "../../lib/utils";
import { MapPin, Clock, Calendar, Navigation, ExternalLink } from "lucide-react";

interface OutletContext {
  event: UserEvent;
  subEvents: SubEvent[];
  schedule: ScheduleItem[];
}

export default function GuestContact() {
  const { event, subEvents, schedule } = useOutletContext<OutletContext>();

  const fullAddress = [event.venue, event.address].filter(Boolean).join(", ");
  const mapUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null;
  const mapEmbed = fullAddress
    ? `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`
    : null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <MapPin className="w-8 h-8 mx-auto mb-4 text-[var(--color-accent)]" />
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Find Us</p>
          <h1 className="font-heading text-4xl md:text-5xl tracking-tight">Venue & Contact</h1>
        </div>

        {/* Main event venue */}
        <section className="mb-12">
          <div className="p-6 md:p-8 border border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
            <h2 className="font-heading text-2xl mb-4">{event.name}</h2>

            {event.event_date && (
              <div className="flex items-start gap-3 mb-3">
                <Calendar className="w-4 h-4 mt-0.5 text-[var(--color-text-muted)] flex-shrink-0" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Date</p>
                  <p className="text-sm">{formatDate(event.event_date)}</p>
                </div>
              </div>
            )}

            {event.event_time && (
              <div className="flex items-start gap-3 mb-3">
                <Clock className="w-4 h-4 mt-0.5 text-[var(--color-text-muted)] flex-shrink-0" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Time</p>
                  <p className="text-sm">{formatTime(event.event_time)}</p>
                </div>
              </div>
            )}

            {event.venue && (
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-4 h-4 mt-0.5 text-[var(--color-text-muted)] flex-shrink-0" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Venue</p>
                  <p className="text-sm">{event.venue}</p>
                </div>
              </div>
            )}

            {event.address && (
              <div className="flex items-start gap-3 mb-6">
                <Navigation className="w-4 h-4 mt-0.5 text-[var(--color-text-muted)] flex-shrink-0" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Address</p>
                  <p className="text-sm">{event.address}</p>
                </div>
              </div>
            )}

            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[var(--color-accent)] hover:underline"
              >
              <ExternalLink className="w-4 h-4" /> Open in Google Maps
              </a>
            )}
          </div>
        </section>

        {/* Map placeholder */}
        {mapEmbed && (
          <section className="mb-12">
            <div className="border border-[var(--color-border)] overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
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
            <div className="text-center mb-6">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Additional Venues</p>
              <h2 className="font-heading text-2xl">Event Locations</h2>
            </div>
            <div className="space-y-4">
              {subEvents.map((sub) => {
                const subAddress = [sub.venue, sub.address].filter(Boolean).join(", ");
                const subMapUrl = subAddress
                  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(subAddress)}`
                  : null;
                return (
                  <div key={sub.id} className="p-5 border border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
                    <h3 className="font-heading text-lg mb-3">{sub.name}</h3>
                    {sub.date && (
                      <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(sub.date)}
                        {sub.time && <> · {formatTime(sub.time)}</>}
                      </p>
                    )}
                    {sub.venue && (
                      <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-2 mb-1">
                        <MapPin className="w-3.5 h-3.5" /> {sub.venue}
                      </p>
                    )}
                    {sub.address && (
                      <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-2">
                        <Navigation className="w-3.5 h-3.5" /> {sub.address}
                      </p>
                    )}
                    {subMapUrl && (
                      <a
                        href={subMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline mt-2"
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
            <div className="text-center mb-6">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Day-of Timeline</p>
              <h2 className="font-heading text-2xl">Schedule</h2>
            </div>
            <div className="space-y-3">
              {schedule.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-4 border border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
                  <div className="flex-shrink-0 text-right w-20">
                    {item.start_time && (
                      <p className="text-sm font-medium">{formatTime(item.start_time)}</p>
                    )}
                    {item.end_time && (
                      <p className="text-xs text-[var(--color-text-muted)]">{formatTime(item.end_time)}</p>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 border-l border-[var(--color-border)] pl-4">
                    <h3 className="font-heading text-base">{item.title}</h3>
                    {item.venue && (
                      <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {item.venue}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">{item.description}</p>
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
