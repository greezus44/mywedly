import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWedding } from "@/lib/use-wedding";
import { supabase, type GuestEvent } from "@/lib/supabase";
import { styleWithGlobal } from "@/lib/text-styles";
import { formatEventDate, formatEventTime } from "@/lib/wedding-guest";
import type { WeddingContent } from "@/lib/supabase";

export function GuestEvents() {
  const slug = location.pathname.split("/")[2];
  const { wedding, loading, error } = useWedding(slug);
  const [events, setEvents] = useState<GuestEvent[]>([]);
  useEffect(() => { if (!wedding) return; supabase.from("events").select("*").eq("wedding_id", wedding.id).order("sort_order", { ascending: true }).then(({ data }) => setEvents((data as GuestEvent[]) ?? [])); }, [wedding]);
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sepia">Loading…</div>;
  if (error || !wedding) return <div className="min-h-screen flex items-center justify-center text-red-600">{error ?? "Not found"}</div>;
  const content = (wedding.content ?? {}) as WeddingContent;
  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-16 bg-parchment">
      <div className="max-w-2xl w-full">
        <h1 className="mb-12" style={styleWithGlobal(content, "events_title")}>Events</h1>
        <div className="space-y-8">
          {events.map((ev) => (
            <div key={ev.id} className="border border-sepia/20 p-6 rounded-md bg-white/50">
              <h2 style={styleWithGlobal(content, "event_name")}>{ev.name}</h2>
              <p style={styleWithGlobal(content, "event_time")}>{formatEventDate(ev.starts_at, "en")}</p>
              <p style={styleWithGlobal(content, "event_time")}>{formatEventTime(ev.starts_at)}</p>
              {ev.venue_name && <p style={styleWithGlobal(content, "event_venue")}>{ev.venue_name}</p>}
              {ev.venue_address && <p style={styleWithGlobal(content, "event_venue")}>{ev.venue_address}</p>}
              {ev.dress_code && <p className="mt-2 uppercase tracking-widest" style={styleWithGlobal(content, "event_notes")}>Dress: {ev.dress_code}</p>}
              {ev.notes && <p className="mt-2 italic" style={styleWithGlobal(content, "event_notes")}>{ev.notes}</p>}
            </div>
          ))}
          {events.length === 0 && <p className="text-center text-sepia/60 italic">No events listed yet.</p>}
        </div>
        <div className="text-center mt-12"><Link to={`/w/${slug}`} className="text-sepia text-xs uppercase tracking-widest hover:text-onyx">Back to Home</Link></div>
      </div>
    </div>
  );
}
