import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

export interface Block {
  id: string;
  type: string;
  content: Record<string, unknown>;
}

export function BlockRenderer({ block, eventId }: { block: Block; eventId: string }) {
  const c = block.content;

  switch (block.type) {
    case "heading":
      return renderHeading(c);
    case "paragraph":
      return <RichTextContent html={(c.html as string) || "<p></p>"} className="rich-content" />;
    case "image":
      return c.src ? (
        <img src={c.src as string} alt={(c.alt as string) || ""} className="w-full" style={{ borderRadius: "var(--event-radius)" }} />
      ) : null;
    case "spacer":
      return <div style={{ height: `${c.height ?? 40}px` }} />;
    case "divider":
      return <hr style={{ borderColor: "var(--event-border)" }} />;
    case "gallery":
      return renderGallery(c);
    case "video":
      return c.url ? (
        <div className="aspect-video w-full overflow-hidden" style={{ borderRadius: "var(--event-radius)" }}>
          <iframe src={c.url as string} className="h-full w-full" title="Video" allowFullScreen />
        </div>
      ) : null;
    case "button":
      return (
        <div className="text-center">
          <a href={(c.url as string) || "#"} className="event-btn-primary inline-block" target="_blank" rel="noopener noreferrer">
            {(c.text as string) || "Button"}
          </a>
        </div>
      );
    case "columns":
      return renderColumns(c);
    case "list":
      return renderList(c);
    case "quote":
      return (
        <blockquote className="border-l-4 pl-4 italic" style={{ borderColor: "var(--event-border)", color: "var(--event-muted)" }}>
          <p>{(c.text as string) || ""}</p>
          {(c.author as string) && <p className="mt-2 text-sm font-semibold">— {c.author as string}</p>}
        </blockquote>
      );
    case "countdown":
      return <CountdownBlock targetDate={c.targetDate as string} label={(c.label as string) || "Counting Down"} />;
    case "map":
      return renderMap(c);
    case "rsvp-form":
      return (
        <div className="text-center">
          <h3 className="mb-4 text-xl font-semibold" style={{ color: "var(--event-heading)" }}>
            {(c.title as string) || "RSVP"}
          </h3>
          <a href={`#rsvp`} className="event-btn-primary inline-block">
            {(c.buttonText as string) || "Submit RSVP"}
          </a>
        </div>
      );
    case "guest-list":
      return null; // Requires host-level access; not shown to guests
    case "schedule":
      return <ScheduleBlock eventId={eventId} />;
    case "venue":
      return renderVenue(c);
    case "faq":
      return renderFaq(c);
    default:
      return null;
  }
}

function renderHeading(c: Record<string, unknown>) {
  const text = (c.text as string) || "";
  const level = (c.level as string) || "h2";
  const align = (c.align as string) || "left";
  const Tag = (level === "h1" ? "h1" : level === "h3" ? "h3" : "h2") as keyof React.JSX.IntrinsicElements;
  return (
    <Tag className="font-bold" style={{
      color: "var(--event-heading)",
      fontSize: level === "h1" ? "2rem" : level === "h3" ? "1.25rem" : "1.5rem",
      textAlign: align as "left" | "center" | "right",
    }}>{text}</Tag>
  );
}

function renderGallery(c: Record<string, unknown>) {
  const images = (c.images as string[]) || [];
  const cols = (c.columns as number) || 3;
  if (images.length === 0) return null;
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {images.map((src, i) => (
        <img key={i} src={src} alt="" className="aspect-square w-full object-cover" style={{ borderRadius: "var(--event-radius)" }} />
      ))}
    </div>
  );
}

function renderColumns(c: Record<string, unknown>) {
  const items = (c.items as string[]) || [];
  const cols = (c.columns as number) || 2;
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {items.map((item, i) => <div key={i} style={{ color: "var(--event-text)" }}>{item}</div>)}
    </div>
  );
}

function renderList(c: Record<string, unknown>) {
  const items = (c.items as string[]) || [];
  const ordered = c.ordered as boolean;
  const style = { color: "var(--event-text)" };
  return ordered ? (
    <ol className="list-inside list-decimal space-y-1" style={style}>{items.map((item, i) => <li key={i}>{item}</li>)}</ol>
  ) : (
    <ul className="list-inside list-disc space-y-1" style={style}>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
  );
}

function renderMap(c: Record<string, unknown>) {
  const address = (c.address as string) || "";
  const embedUrl = (c.embedUrl as string) || `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  if (!address && !embedUrl) return null;
  return (
    <div className="overflow-hidden" style={{ borderRadius: "var(--event-radius)" }}>
      <iframe src={embedUrl} title="Map" className="h-[300px] w-full" loading="lazy" />
    </div>
  );
}

function renderVenue(c: Record<string, unknown>) {
  const name = (c.name as string) || "";
  const address = (c.address as string) || "";
  const mapUrl = (c.mapUrl as string) || "";
  return (
    <div className="event-card text-center">
      {name && <h3 className="mb-2 text-xl font-semibold" style={{ color: "var(--event-heading)" }}>{name}</h3>}
      {address && <p style={{ color: "var(--event-text)" }}>{address}</p>}
      {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="event-btn-secondary mt-4 inline-block">View on Map</a>}
    </div>
  );
}

function renderFaq(c: Record<string, unknown>) {
  const items = (c.items as { question: string; answer: string }[]) || [];
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="event-card">
          <h4 className="mb-2 font-semibold" style={{ color: "var(--event-heading)" }}>{item.question}</h4>
          <p style={{ color: "var(--event-text)" }}>{item.answer}</p>
        </div>
      ))}
    </div>
  );
}

function CountdownBlock({ targetDate, label }: { targetDate: string; label: string }) {
  const [count, setCount] = useState(() => getCountdown(targetDate));
  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => setCount(getCountdown(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);
  if (!targetDate || count.isPast) return null;
  return (
    <div className="text-center">
      <p className="guest-eyebrow">{label}</p>
      <div className="mt-4 flex justify-center gap-6">
        {[
          { label: "Days", value: count.days },
          { label: "Hours", value: count.hours },
          { label: "Minutes", value: count.minutes },
          { label: "Seconds", value: count.seconds },
        ].map((u) => (
          <div key={u.label} className="flex flex-col items-center">
            <span className="text-3xl font-bold" style={{ color: "var(--event-heading)" }}>{String(u.value).padStart(2, "0")}</span>
            <span className="text-xs uppercase tracking-widest" style={{ color: "var(--event-muted)" }}>{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleBlock({ eventId }: { eventId: string }) {
  const { data: schedule = [] } = useQuery({
    queryKey: ["custom-page-schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as Array<{
        id: string; title: string; description: string | null;
        schedule_date: string | null; start_time: string | null;
        end_time: string | null; venue: string | null;
      }>;
    },
  });
  if (schedule.length === 0) return null;
  return (
    <div className="space-y-4">
      {schedule.map((item) => (
        <div key={item.id} className="event-card">
          <h4 className="mb-1 font-semibold" style={{ color: "var(--event-heading)" }}>{item.title}</h4>
          {item.schedule_date && (
            <p className="text-sm" style={{ color: "var(--event-muted)" }}>
              {formatDate(item.schedule_date)}
              {item.start_time && ` · ${formatTime12(item.start_time)}`}
              {item.end_time && ` – ${formatTime12(item.end_time)}`}
            </p>
          )}
          {item.venue && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{item.venue}</p>}
          {item.description && <p className="mt-2 text-sm" style={{ color: "var(--event-text)" }}>{item.description}</p>}
        </div>
      ))}
    </div>
  );
}
