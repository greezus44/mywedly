import { useEffect, useState } from "react";
import type { Block } from "../event/block-types";
import { getCountdown, formatDate, formatTime12 } from "../../lib/utils";
import { supabase } from "../../lib/supabase";

interface BlockRendererProps {
  block: Block;
  eventId?: string;
}

export function BlockRenderer({ block, eventId }: BlockRendererProps) {
  const c = block.content;
  switch (block.type) {
    case "heading": {
      const Tag = (`h${c.level ?? 2}`) as "h1" | "h2" | "h3";
      return <Tag className="guest-title" style={{ fontSize: c.level === 1 ? "2.5rem" : c.level === 2 ? "2rem" : "1.5rem" }}>{c.text ?? ""}</Tag>;
    }
    case "paragraph":
      return <p className="rich-content">{c.text ?? ""}</p>;
    case "image":
      return c.url ? <img src={c.url} alt={c.alt ?? ""} className="mx-auto max-w-full rounded-lg" /> : null;
    case "spacer":
      return <div style={{ height: `${c.height ?? 32}px` }} />;
    case "divider":
      return <hr className="my-6 border-0 border-t" style={{ borderColor: "var(--event-border)" }} />;
    case "gallery":
      return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{(c.images ?? []).map((url, i) => <img key={i} src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />)}</div>;
    case "video": {
      if (!c.url) return null;
      const yt = c.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
      const embed = yt ? `https://www.youtube.com/embed/${yt[1]}` : c.url;
      return <div className="aspect-video w-full overflow-hidden rounded-lg"><iframe src={embed} className="h-full w-full" allowFullScreen title="Video" /></div>;
    }
    case "button":
      return <div className="text-center"><a href={c.href ?? "#"} className="event-btn-primary inline-block">{c.label ?? "Button"}</a></div>;
    case "columns":
      return <div className="grid gap-4 sm:grid-cols-2">{(c.columns ?? []).map((col, i) => <div key={i} className="rich-content">{col.text ?? ""}</div>)}</div>;
    case "list":
      return <ul className="rich-content list-disc pl-6">{(c.items ?? []).map((item, i) => <li key={i}>{item}</li>)}</ul>;
    case "quote":
      return <blockquote className="rich-content border-l-4 pl-4 italic" style={{ borderColor: "var(--event-border)" }}>{c.text ?? ""}</blockquote>;
    case "countdown":
      return <CountdownBlock targetDate={c.targetDate ?? ""} />;
    case "map":
      return c.address ? <iframe className="h-64 w-full rounded-lg" src={`https://maps.google.com/maps?q=${encodeURIComponent(c.address)}&z=${c.zoom ?? 14}&output=embed`} title="Map" /> : null;
    case "rsvp-form":
      return eventId ? <RsvpFormBlock eventId={eventId} /> : null;
    case "guest-list":
      return eventId ? <GuestListBlock eventId={eventId} /> : null;
    case "schedule":
      return eventId ? <ScheduleBlock eventId={eventId} /> : null;
    case "venue":
      return <div className="event-card text-center"><h3 className="guest-title mb-2">{c.title ?? "Venue"}</h3><p className="text-dash-muted">{c.address ?? ""}</p></div>;
    case "faq":
      return <div className="space-y-3">{(c.questions ?? []).map((q, i) => <div key={i} className="event-card"><h4 className="font-semibold" style={{ color: "var(--event-heading)" }}>{q.question}</h4><p className="mt-1 text-sm" style={{ color: "var(--event-muted)" }}>{q.answer}</p></div>)}</div>;
    default:
      return null;
  }
}

function CountdownBlock({ targetDate }: { targetDate: string }) {
  const [countdown, setCountdown] = useState(() => getCountdown(targetDate));
  useEffect(() => {
    const id = setInterval(() => setCountdown(getCountdown(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  if (countdown.isPast) return <p className="text-center text-dash-muted">The event has begun!</p>;
  const items = [{ label: "Days", value: countdown.days }, { label: "Hours", value: countdown.hours }, { label: "Minutes", value: countdown.minutes }, { label: "Seconds", value: countdown.seconds }];
  return (
    <div className="flex justify-center gap-4">
      {items.map((it) => <div key={it.label} className="text-center"><p className="text-3xl font-bold" style={{ color: "var(--event-primary)" }}>{it.value}</p><p className="text-xs" style={{ color: "var(--event-muted)" }}>{it.label}</p></div>)}
    </div>
  );
}

function RsvpFormBlock({ eventId }: { eventId: string }) {
  return <div className="event-card text-center"><a href={`/e/${eventId}/rsvp`} className="event-btn-primary inline-block">RSVP Now</a></div>;
}

function GuestListBlock({ eventId }: { eventId: string }) {
  return null;
}

function ScheduleBlock({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<{ id: string; title: string; schedule_date: string | null; start_time: string | null; end_time: string | null }[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("event_schedule").select("id, title, schedule_date, start_time, end_time").eq("event_id", eventId).order("order_index", { ascending: true });
      setItems((data as never[]) ?? []);
    })();
  }, [eventId]);
  if (items.length === 0) return null;
  return (
    <div className="event-card space-y-3">
      {items.map((it) => (
        <div key={it.id} className="flex items-start gap-4 border-t pt-3" style={{ borderColor: "var(--event-border)" }}>
          <div className="shrink-0 text-right" style={{ minWidth: "80px" }}>
            {it.start_time && <p className="text-sm font-medium" style={{ color: "var(--event-primary)" }}>{formatTime12(it.start_time)}</p>}
            {it.end_time && <p className="text-xs" style={{ color: "var(--event-muted)" }}>{formatTime12(it.end_time)}</p>}
          </div>
          <div className="flex-1"><p className="font-medium" style={{ color: "var(--event-heading)" }}>{it.title}</p>{it.schedule_date && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{formatDate(it.schedule_date)}</p>}</div>
        </div>
      ))}
    </div>
  );
}
