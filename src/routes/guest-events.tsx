import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWedding } from "@/lib/use-wedding";
import { supabase, type GuestEvent } from "@/lib/supabase";
import { formatEventDate, formatEventTime } from "@/lib/wedding-guest";

export function GuestEvents() {
  const slug = location.pathname.split("/")[2];
  const { wedding, loading, error } = useWedding(slug);
  const [events, setEvents] = useState<GuestEvent[]>([]);

  useEffect(() => {
    if (!wedding) return;
    supabase.from("events").select("*").eq("wedding_id", wedding.id).order("sort_order", { ascending: true }).then(({ data }) => setEvents((data as GuestEvent[]) ?? []));
  }, [wedding]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sepia">Loading…</div>;
  if (error || !wedding) return <div className="min-h-screen flex items-center justify-center text-red-600">{error ?? "Not found"}</div>;

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-16 bg-parchment">
      <div className="max-w-2xl w-full">
        <h1 className="text-2xl md:text-3xl tracking-[0.35em] font-medium mb-12 uppercase text-sepia text-center">Events</h1>
        <div className="space-y-8">
          {events.map((ev) => (
            <div key={ev.id} className="border border-sepia/20 p-6 rounded-md bg-white/50">
              <h2 className="text-xl font-serif text-onyx mb-1">{ev.name}</h2>
              <p className="text-sepia text-sm mb-1">{formatEventDate(ev.starts_at, "en")}</p>
              <p className="text-sepia text-sm mb-3">{formatEventTime(ev.starts_at)}</p>
              {ev.venue_name && <p className="text-onyx/70 text-sm">{ev.venue_name}</p>}
              {ev.venue_address && <p className="text-onyx/50 text-sm">{ev.venue_address}</p>}
              {ev.dress_code && <p className="text-sepia/70 text-xs mt-2 uppercase tracking-widest">Dress: {ev.dress_code}</p>}
              {ev.notes && <p className="text-onyx/50 text-sm mt-2 italic">{ev.notes}</p>}
            </div>
          ))}
          {events.length === 0 && <p className="text-center text-sepia/60 italic">No events listed yet.</p>}
        </div>
        <div className="text-center mt-12"><Link to={`/w/${slug}`} className="text-sepia text-xs uppercase tracking-widest hover:text-onyx">Back to Home</Link></div>
      </div>
    </div>
  );
}
