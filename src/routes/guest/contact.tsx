import { useGuestContext } from "./guest-layout";
import { formatDate, formatTime } from "../../lib/utils";
import { MapPin, Clock, Calendar, Navigation, Mail, Phone, Info } from "lucide-react";

export default function GuestContact() {
  const { event, subEvents, schedule } = useGuestContext();

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-border)]">
        <div className="max-w-2xl mx-auto px-6 py-10 text-center">
          <Info className="w-6 h-6 mx-auto text-[var(--color-accent)] mb-3" />
          <h1 className="font-[var(--font-heading)] text-3xl">Details & Venue</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">Everything you need to know</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        {/* Main event info */}
        <section className="border border-[var(--color-border)] p-6" style={{ borderRadius: "var(--radius)" }}>
          <h2 className="font-[var(--font-heading)] text-xl mb-5">{event.name}</h2>
          <div className="space-y-3">
            {event.event_date && (
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 mt-0.5 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Date</p>
                  <p className="text-sm">{formatDate(event.event_date)}</p>
                </div>
              </div>
            )}
            {event.event_time && (
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 mt-0.5 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Time</p>
                  <p className="text-sm">{formatTime(event.event_time)}</p>
                </div>
              </div>
            )}
            {event.venue && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Venue</p>
                  <p className="text-sm">{event.venue}</p>
                  {event.address && <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{event.address}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Map placeholder */}
          {(event.venue || event.address) && (
            <div className="mt-6">
              <div className="aspect-video bg-[var(--color-bg-subtle)] border border-[var(--color-border)] flex items-center justify-center" style={{ borderRadius: "var(--radius)" }}>
                <div className="text-center">
                  <Navigation className="w-8 h-8 mx-auto text-[var(--color-text-muted)] opacity-30 mb-2" />
                  <p className="text-xs text-[var(--color-text-muted)]">Map view</p>
                  {event.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue || ""} ${event.address}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-xs uppercase tracking-wider text-[var(--color-accent)] hover:opacity-70"
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
            <h2 className="font-[var(--font-heading)] text-xl mb-5">Event Locations</h2>
            <div className="space-y-4">
              {subEvents.map((se) => (
                <div key={se.id} className="border border-[var(--color-border)] p-5" style={{ borderRadius: "var(--radius)" }}>
                  <h3 className="font-medium text-sm mb-3">{se.name}</h3>
                  <div className="space-y-2">
                    {se.date && (
                      <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> {formatDate(se.date)}
                        {se.time && <> · <Clock className="w-3 h-3" /> {formatTime(se.time)}</>}
                      </p>
                    )}
                    {se.venue && (
                      <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> {se.venue}
                        {se.address && <> · {se.address}</>}
                      </p>
                    )}
                    {se.dress_code && (
                      <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mt-2">Dress Code: {se.dress_code}</p>
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
            <h2 className="font-[var(--font-heading)] text-xl mb-5">Schedule</h2>
            <div className="space-y-3">
              {schedule.map((item) => (
                <div key={item.id} className="flex items-start gap-4 py-3 border-b border-[var(--color-border)] last:border-0">
                  <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] min-w-[80px]">
                    {item.start_time ? formatTime(item.start_time) : formatDate(item.schedule_date)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{item.title}</h4>
                    {item.description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.description}</p>}
                    {item.venue && <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{item.venue}</p>}
                    {item.dress_code && <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mt-1">Dress: {item.dress_code}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact info placeholder */}
        <section className="border-t border-[var(--color-border)] pt-8 text-center">
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-4">Questions?</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            For any inquiries about the event, please reach out to the hosts directly.
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-[var(--color-text-muted)]">
            <Mail className="w-4 h-4" />
            <Phone className="w-4 h-4" />
          </div>
        </section>
      </div>
    </div>
  );
}
