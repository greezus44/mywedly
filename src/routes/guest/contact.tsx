import { useParams, useOutletContext } from "react-router-dom";
import { type UserEvent } from "../../lib/supabase";

type Ctx = { event: UserEvent };
export default function GuestContactPage() {
  const { event } = useOutletContext<Ctx>();
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <h1 className="font-heading text-3xl mb-8">Contact</h1>
        <div className="space-y-4 text-sm">
          {event.venue && <p><strong>Venue:</strong> {event.venue}</p>}
          {event.address && <p className="opacity-70">{event.address}</p>}
          {event.event_date && <p><strong>Date:</strong> {new Date(event.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>}
          {event.event_time && <p><strong>Time:</strong> {event.event_time}</p>}
        </div>
      </div>
    </div>
  );
}
