import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { LoadingSpinner, ErrorState } from "../../components/ui";

export default function Contact() {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !event) {
    return <ErrorState title="This invitation website could not be found or is no longer available." />;
  }

  const hasMap = event.address || event.venue;
  const mapQuery = event.address ?? event.venue ?? "";

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h2
          className="text-2xl font-bold text-event-heading"
          style={{ fontFamily: "var(--event-font-heading)" }}
        >
          Contact
        </h2>
        <p className="mt-1 text-sm text-event-muted">Venue & location details</p>
      </header>

      <div className="event-card flex flex-col gap-4">
        {event.venue && (
          <div>
            <h3 className="text-xs uppercase text-event-muted">Venue</h3>
            <p className="mt-1 text-sm text-event-text">{event.venue}</p>
          </div>
        )}
        {event.address && (
          <div>
            <h3 className="text-xs uppercase text-event-muted">Address</h3>
            <p className="mt-1 text-sm text-event-text">{event.address}</p>
          </div>
        )}
        {event.event_date && (
          <div>
            <h3 className="text-xs uppercase text-event-muted">Date</h3>
            <p className="mt-1 text-sm text-event-text">
              {new Date(event.event_date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}
        {event.event_time && (
          <div>
            <h3 className="text-xs uppercase text-event-muted">Time</h3>
            <p className="mt-1 text-sm text-event-text">
              {(() => {
                const [hStr, mStr] = event.event_time!.split(":");
                const h = parseInt(hStr, 10);
                const m = parseInt(mStr, 10);
                const period = h >= 12 ? "PM" : "AM";
                const hour12 = h % 12 === 0 ? 12 : h % 12;
                const minutes = m && !isNaN(m) ? `:${String(m).padStart(2, "0")}` : "";
                return `${hour12}${minutes} ${period}`;
              })()}
            </p>
          </div>
        )}
      </div>

      {/* Map */}
      {hasMap && (
        <div className="overflow-hidden rounded-lg border border-event-border">
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=14&output=embed`}
            className="h-64 w-full"
            title="Map"
          />
        </div>
      )}

      {/* Map link */}
      {hasMap && (
        <a
          href={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="event-btn-secondary text-center"
        >
          Open in Google Maps
        </a>
      )}
    </div>
  );
}
