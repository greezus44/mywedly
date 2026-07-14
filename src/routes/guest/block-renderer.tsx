import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { resolveTypography } from "../../lib/typography";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

// ---------- Block types ----------
export interface Block {
  id?: string;
  type: string;
  content: Record<string, unknown>;
}
interface BlocksDoc { blocks?: Block[]; }

function parseBlocks(content: Json | null | undefined): Block[] {
  if (!content || typeof content !== "object") return [];
  const obj = content as BlocksDoc;
  if (Array.isArray(obj.blocks)) return obj.blocks as Block[];
  // Some pages store blocks directly as an array
  if (Array.isArray(content)) return content as unknown as Block[];
  return [];
}

type Align = React.CSSProperties["textAlign"];
function alignOf(v: unknown, fallback: Align = "left"): Align {
  const s = v as string | undefined;
  if (s === "left" || s === "center" || s === "right") return s;
  return fallback;
}

// ---------- Countdown ----------
function CountdownBlock({ targetDate }: { targetDate?: string }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  if (!targetDate) return null;
  const c = getCountdown(targetDate);
  if (c.isPast) return <p className="guest-subtitle text-center">The big day is here!</p>;
  const items = [
    { label: "Days", value: c.days },
    { label: "Hours", value: c.hours },
    { label: "Min", value: c.minutes },
    { label: "Sec", value: c.seconds },
  ];
  return (
    <div className="flex justify-center gap-4">
      {items.map((it) => (
        <div key={it.label} className="event-info-card text-center" style={{ minWidth: "4.5rem", padding: "1rem" }}>
          <div className="text-2xl font-bold" style={{ color: "var(--event-heading)" }}>{String(it.value).padStart(2, "0")}</div>
          <div className="text-xs" style={{ color: "var(--event-muted)" }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}

// ---------- Single block ----------
function BlockView({ block }: { block: Block }) {
  const c = block.content;
  switch (block.type) {
    case "heading": {
      const t = resolveTypography({ text: c.text as string, align: c.align as string, fontSize: c.fontSize as number, fontWeight: c.fontWeight as number, color: c.color as string, fontFamily: c.fontFamily as string }, "");
      return <h2 className="guest-title" style={{ textAlign: alignOf(c.align, "center"), ...t.style }}>{t.text}</h2>;
    }
    case "paragraph":
      return <div className="rich-content" style={{ textAlign: alignOf(c.align, "left") }}><RichTextContent html={(c.text as string) || ""} /></div>;
    case "image":
      return (
        <div style={{ textAlign: alignOf(c.align, "center") }}>
          {c.url ? <img src={c.url as string} alt={(c.alt as string) || ""} style={{ maxWidth: "100%", borderRadius: "var(--event-radius)", margin: "0 auto" }} /> : null}
        </div>
      );
    case "spacer":
      return <div style={{ height: `${(c.spacing as number) || 32}px` }} />;
    case "divider":
      return <hr style={{ border: "none", borderTop: `1px solid var(--event-border)`, margin: "1.5rem 0" }} />;
    case "gallery": {
      const images = (c.images as string[]) ?? [];
      if (images.length === 0) return null;
      return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {images.map((src, i) => <img key={i} src={src} alt="" style={{ width: "100%", borderRadius: "var(--event-radius)", aspectRatio: "1", objectFit: "cover" }} />)}
        </div>
      );
    }
    case "video":
      return (
        <div style={{ textAlign: "center" }}>
          {c.embedUrl ? <div className="mx-auto" style={{ maxWidth: "100%", aspectRatio: "16/9" }}><iframe src={c.embedUrl as string} title={(c.caption as string) || "Video"} style={{ width: "100%", height: "100%", border: 0, borderRadius: "var(--event-radius)" }} allowFullScreen /></div> : null}
          {c.caption ? <p className="mt-2 text-sm" style={{ color: "var(--event-muted)" }}>{c.caption as string}</p> : null}
        </div>
      );
    case "button":
      return (
        <div style={{ textAlign: alignOf(c.align, "center") }}>
          {c.href ? <a href={c.href as string} target="_blank" rel="noopener noreferrer" className="event-btn-primary inline-block">{(c.buttonText as string) || "Click"}</a> : null}
        </div>
      );
    case "columns": {
      const cols = (c.columns as Block[][]) ?? [];
      return <div className="grid gap-4 md:grid-cols-2">{cols.map((col, i) => <div key={i}>{col.map((b, j) => <BlockView key={j} block={b} />)}</div>)}</div>;
    }
    case "list": {
      const items = (c.items as string[]) ?? [];
      if (items.length === 0) return null;
      return <ul className="list-disc space-y-1 pl-6" style={{ color: "var(--event-text)" }}>{items.map((it, i) => <li key={i}>{it}</li>)}</ul>;
    }
    case "quote":
      return <blockquote style={{ borderLeft: `3px solid var(--event-border)`, paddingLeft: "1rem", fontStyle: "italic", color: "var(--event-muted)" }}>{(c.text as string) || ""}{c.caption ? <footer className="mt-2 text-sm">— {c.caption as string}</footer> : null}</blockquote>;
    case "countdown":
      return <CountdownBlock targetDate={c.targetDate as string} />;
    case "map":
      return (
        <div style={{ textAlign: "center" }}>
          {c.embedUrl ? <iframe src={c.embedUrl as string} title={(c.caption as string) || "Map"} style={{ width: "100%", height: "300px", border: 0, borderRadius: "var(--event-radius)" }} loading="lazy" /> : null}
          {c.caption ? <p className="mt-2 text-sm" style={{ color: "var(--event-muted)" }}>{c.caption as string}</p> : null}
        </div>
      );
    case "rsvp-form":
      return <p className="text-center text-sm" style={{ color: "var(--event-muted)" }}>RSVP form — visit the RSVP page to respond.</p>;
    case "guest-list":
      return null;
    case "schedule":
      return <ScheduleBlock eventId={c.eventId as string} />;
    case "venue":
      return (
        <div className="event-info-card text-center">
          {c.name ? <p className="font-semibold" style={{ color: "var(--event-heading)" }}>{c.name as string}</p> : null}
          {c.address ? <p className="text-sm" style={{ color: "var(--event-muted)" }}>{c.address as string}</p> : null}
          {c.embedUrl ? <iframe src={c.embedUrl as string} title="Venue map" style={{ width: "100%", height: "240px", border: 0, borderRadius: "var(--event-radius)", marginTop: "0.75rem" }} loading="lazy" /> : null}
        </div>
      );
    case "faq": {
      const faqs = (c.items as { q?: string; a?: string }[]) ?? [];
      if (faqs.length === 0) return null;
      return (
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="event-info-card">
              {f.q ? <p className="font-semibold" style={{ color: "var(--event-heading)" }}>{f.q}</p> : null}
              {f.a ? <p className="mt-1 text-sm" style={{ color: "var(--event-text)" }}>{f.a}</p> : null}
            </div>
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}

// ---------- Schedule block (queries event_schedule) ----------
function ScheduleBlock({ eventId }: { eventId?: string }) {
  const { data: items } = useQuery({
    queryKey: ["block-schedule", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId!)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const rows = items ?? [];
  if (rows.length === 0) return null;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="event-info-card flex items-start gap-4">
          <div className="text-right" style={{ minWidth: "5rem" }}>
            {r.schedule_date ? <p className="text-xs" style={{ color: "var(--event-muted)" }}>{formatDateShort(r.schedule_date)}</p> : null}
            {r.start_time ? <p className="text-sm font-semibold" style={{ color: "var(--event-heading)" }}>{formatTime12(r.start_time)}</p> : null}
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: "var(--event-heading)" }}>{r.title}</p>
            {r.description ? <p className="mt-1 text-sm" style={{ color: "var(--event-text)" }}>{r.description}</p> : null}
            {r.venue ? <p className="mt-1 text-xs" style={{ color: "var(--event-muted)" }}>{r.venue}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------- Public NAMED export ----------
export function BlockRenderer({ content }: { content: Json | null | undefined }) {
  const blocks = parseBlocks(content);
  if (blocks.length === 0) return null;
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <BlockView key={block.id ?? i} block={block} />
      ))}
    </div>
  );
}

export default BlockRenderer;
