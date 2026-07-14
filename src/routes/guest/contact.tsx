import React from "react";
import { useGuestOutletContext } from "./guest-layout";
import { formatDate, to12Hour } from "../../lib/utils";

export default function Contact() {
  const { event } = useGuestOutletContext();

  const mapQuery = event.address
    ? encodeURIComponent(event.address)
    : event.venue
    ? encodeURIComponent(event.venue)
    : "";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-center text-3xl font-bold text-event-heading">
        Contact & Venue
      </h1>

      <div className="event-card flex flex-col gap-4">
        <div>
          <h2 className="mb-1 text-lg font-semibold text-event-heading">
            Venue
          </h2>
          {event.venue ? (
            <p className="text-event-text">{event.venue}</p>
          ) : (
            <p className="text-sm text-event-muted">No venue specified.</p>
          )}
        </div>

        {event.address && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-event-heading">
              Address
            </h3>
            <p className="text-event-text">{event.address}</p>
          </div>
        )}

        {event.event_date && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-event-heading">
              Date & Time
            </h3>
            <p className="text-event-text">
              {formatDate(event.event_date)}
              {event.event_time && ` at ${to12Hour(event.event_time)}`}
            </p>
          </div>
        )}

        {mapQuery && (
          <div className="flex flex-col gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="event-btn-primary inline-block w-fit text-sm"
            >
              View on Google Maps ↗
            </a>
            <div className="overflow-hidden rounded-lg">
              <iframe
                src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`}
                className="h-64 w-full"
                title="Venue map"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
