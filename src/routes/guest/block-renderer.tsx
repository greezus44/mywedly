import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SubEvent, type EventSchedule, type EventGuest } from "../../lib/supabase";
import { resolveTypography } from "../../lib/typography";
import { RichTextContent } from "../../lib/sanitize";
import { getCountdown, formatDate, formatTime12, cn } from "../../lib/utils";

type CSS = React.CSSProperties;
type TextAlign = CSS["textAlign"];

const str = (v: unknown, f = ""): string => (typeof v === "string" ? v : f);
const num = (v: unknown, f = 0): number => (typeof v === "number" ? v : f);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const al = (v: unknown, f: TextAlign = "left"): TextAlign => {
  const s = str(v, f as string);
  return s === "left" || s === "center" || s === "right" || s === "justify" ? s : f;
};
const toEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  return vm ? `https://player.vimeo.com/video/${vm[1]}` : null;
};
const Spinner = () => (
  <div className="guest-section flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
  </div>
);
const mapSrc = (q: string) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;

/* ---- Renderer ---- */

interface BlockBase {
  id?: string;
  type?: string;
  content?: Record<string, unknown>;
  columns?: BlockBase[][];
}

export function BlockRenderer({ blocks }: { blocks: Record<string, unknown>[] }) {
  return (
    <>
      {(blocks as BlockBase[]).map((block, i) => <Block key={block.id ?? i} block={block} />)}
    </>
  );
}

function Block({ block }: { block: BlockBase }) {
  const c = block.content ?? {};
  switch (block.type ?? "") {
    case "heading": return <HeadingBlock c={c} />;
    case "paragraph": return <ParagraphBlock c={c} />;
    case "image": return <ImageBlock c={c} />;
    case "spacer": return <div style={{ height: num(c.height, 40) }} />;
    case "divider": return <section className="guest-section-tight"><div className="mx-auto max-w-3xl"><hr style={{ borderColor: "var(--event-border)" }} /></div></section>;
    case "gallery": return <GalleryBlock c={c} />;
    case "video": return <VideoBlock c={c} />;
    case "button": return <ButtonBlock c={c} />;
    case "columns": return <ColumnsBlock block={block} />;
    case "list": return <ListBlock c={c} />;
    case "quote": return <QuoteBlock c={c} />;
    case "countdown": return <CountdownBlock c={c} />;
    case "map": return <MapBlock c={c} />;
    case "rsvp-form": return <RsvpFormBlock />;
    case "guest-list": return <GuestListBlock />;
    case "schedule": return <ScheduleBlock />;
    case "venue": return <VenueBlock c={c} />;
    case "faq": return <FaqBlock c={c} />;
    default: return null;
  }
}

/* ---- Text blocks ---- */

function HeadingBlock({ c }: { c: Record<string, unknown> }) {
  const { text, style } = resolveTypography(c.text, "");
  const Tag = `h${Math.min(Math.max(num(c.level, 2), 1), 6)}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return <section className="guest-section"><div className="mx-auto max-w-2xl"><Tag className="guest-title" style={{ textAlign: al(c.align, "left"), ...style }}>{text}</Tag></div></section>;
}

function ParagraphBlock({ c }: { c: Record<string, unknown> }) {
  const { text, style } = resolveTypography(c.text, "");
  return <section className="guest-section"><div className="mx-auto max-w-2xl">{text ? <RichTextContent html={text} className="rich-content" /> : <p style={{ textAlign: al(c.align, "left"), ...style }}>&nbsp;</p>}</div></section>;
}

function QuoteBlock({ c }: { c: Record<string, unknown> }) {
  const { text, style } = resolveTypography(c.text, "");
  const attr = str(c.caption) || str(c.attribution);
  return (
    <section className="guest-section"><div className="mx-auto max-w-2xl text-center">
      <blockquote className="rich-content italic" style={{ textAlign: al(c.align, "center"), ...style, borderLeft: "none", fontSize: "1.25rem" }}>{text || "\u201C\u201D"}</blockquote>
      {attr && <p className="guest-eyebrow mt-3">— {attr}</p>}
    </div></section>
  );
}

function ListBlock({ c }: { c: Record<string, unknown> }) {
  const items = arr(c.items).map((i) => str(i));
  const Tag = Boolean(c.ordered) ? "ol" : "ul";
  return <section className="guest-section"><div className="mx-auto max-w-2xl"><Tag className="rich-content space-y-1.5" style={{ paddingLeft: "1.5em" }}>{items.map((item, i) => <li key={i}>{item}</li>)}</Tag></div></section>;
}

/* ---- Media blocks ---- */

function ImageBlock({ c }: { c: Record<string, unknown> }) {
  const url = str(c.url);
  if (!url) return null;
  return <section className="guest-section"><div className="mx-auto max-w-3xl" style={{ textAlign: al(c.align, "center") }}><img src={url} alt={str(c.alt)} className="mx-auto rounded-2xl object-cover max-h-[60vh]" />{str(c.caption) && <p className="guest-eyebrow mt-3">{str(c.caption)}</p>}</div></section>;
}

function GalleryBlock({ c }: { c: Record<string, unknown> }) {
  const imgs = arr(c.images).map((i) => str(i)).filter(Boolean);
  if (imgs.length === 0) return null;
  return (
    <section className="guest-section"><div className="mx-auto max-w-4xl">
      <div className={cn("grid gap-3", imgs.length === 1 ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3")}>
        {imgs.map((src, i) => <img key={i} src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />)}
      </div>
      {str(c.caption) && <p className="guest-eyebrow mt-4 text-center">{str(c.caption)}</p>}
    </div></section>
  );
}

function VideoBlock({ c }: { c: Record<string, unknown> }) {
  const embed = toEmbedUrl(str(c.videoUrl));
  if (!embed) return null;
  return (
    <section className="guest-section"><div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: "16 / 9" }}>
        <iframe src={embed} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={str(c.caption) || "Video"} />
      </div>
      {str(c.caption) && <p className="guest-eyebrow mt-3 text-center">{str(c.caption)}</p>}
    </div></section>
  );
}

function ButtonBlock({ c }: { c: Record<string, unknown> }) {
  const label = str(c.label, "Click Here");
  const href = str(c.href);
  return <section className="guest-section text-center" style={{ textAlign: al(c.align, "center") }}>{href ? <a href={href} target="_blank" rel="noopener noreferrer" className="event-btn-primary inline-block">{label}</a> : <button className="event-btn-primary">{label}</button>}</section>;
}

function ColumnsBlock({ block }: { block: BlockBase }) {
  const cols = (block.columns ?? []) as BlockBase[][];
  if (cols.length === 0) return null;
  return (
    <section className="guest-section">
      <div className={cn("mx-auto max-w-4xl grid gap-6", cols.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3")}>
        {cols.map((col, i) => <div key={i}>{col.map((b, j) => <Block key={b.id ?? j} block={b} />)}</div>)}
      </div>
    </section>
  );
}

/* ---- Countdown ---- */

function CountdownBlock({ c }: { c: Record<string, unknown> }) {
  const target = str(c.date) || str(c.targetDate) || str(c.target);
  const [t, setT] = useState(() => getCountdown(target));
  useEffect(() => {
    const id = setInterval(() => setT(getCountdown(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  const label = str(c.label, "Counting down");
  if (t.isPast) return <section className="guest-section text-center"><p className="guest-eyebrow">{label}</p><p className="guest-title">Today's the day!</p></section>;
  const units = [["Days", t.days], ["Hours", t.hours], ["Minutes", t.minutes], ["Seconds", t.seconds]] as const;
  return (
    <section className="guest-section text-center">
      <p className="guest-eyebrow mb-4">{label}</p>
      <div className="mx-auto flex max-w-md justify-center gap-4">
        {units.map(([u, v]) => (
          <div key={u} className="event-card flex min-w-[4.5rem] flex-col items-center" style={{ padding: "1.25rem" }}>
            <span className="text-3xl font-bold" style={{ color: "var(--event-heading)" }}>{String(v).padStart(2, "0")}</span>
            <span className="guest-eyebrow mt-1" style={{ marginBottom: 0 }}>{u}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---- Map & Venue ---- */

function MapBlock({ c }: { c: Record<string, unknown> }) {
  const q = str(c.query) || str(c.address) || str(c.location);
  if (!q) return null;
  return (
    <section className="guest-section"><div className="mx-auto max-w-3xl">
      {str(c.label) && <p className="guest-eyebrow mb-3 text-center">{str(c.label)}</p>}
      <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: "16 / 10" }}><iframe src={mapSrc(q)} className="h-full w-full" loading="lazy" title="Map" /></div>
    </div></section>
  );
}

function VenueBlock({ c }: { c: Record<string, unknown> }) {
  const name = str(c.name) || str(c.venue);
  const addr = str(c.address);
  const q = str(c.mapQuery) || addr || name;
  return (
    <section className="guest-section"><div className="mx-auto max-w-3xl"><div className="event-card">
      {name && <h3 className="mb-2 text-xl font-semibold" style={{ color: "var(--event-heading)" }}>{name}</h3>}
      {addr && <p className="mb-4" style={{ color: "var(--event-muted)" }}>{addr}</p>}
      {q && <div className="overflow-hidden rounded-xl" style={{ aspectRatio: "16 / 10" }}><iframe src={mapSrc(q)} className="h-full w-full" loading="lazy" title="Venue map" /></div>}
    </div></div></section>
  );
}

/* ---- FAQ ---- */

function FaqBlock({ c }: { c: Record<string, unknown> }) {
  const items = arr(c.items).map((i) => { const o = i as Record<string, unknown>; return { q: str(o.question) || str(o.q), a: str(o.answer) || str(o.a) }; }).filter((i) => i.q);
  if (items.length === 0) return null;
  return (
    <section className="guest-section"><div className="mx-auto max-w-2xl space-y-3">
      {items.map((item, i) => <div key={i} className="event-card"><h3 className="mb-2 font-semibold" style={{ color: "var(--event-heading)" }}>{item.q}</h3><p style={{ color: "var(--event-text)" }}>{item.a}</p></div>)}
    </div></section>
  );
}

/* ---- Data-fetching blocks ---- */

function ScheduleBlock() {
  const { data, isLoading } = useQuery({
    queryKey: ["block-schedule"],
    queryFn: async () => { const { data } = await supabase.from("event_schedules").select("*").order("order_index", { ascending: true }); return (data ?? []) as EventSchedule[]; },
  });
  if (isLoading) return <Spinner />;
  const items = data ?? [];
  if (items.length === 0) return null;
  return (
    <section className="guest-section"><div className="mx-auto max-w-2xl">
      <p className="guest-eyebrow text-center">Schedule</p>
      <div className="mt-6 space-y-4">
        {items.map((s) => (
          <div key={s.id} className="event-card flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold" style={{ color: "var(--event-heading)" }}>{s.title}</h3>
              {s.description && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{s.description}</p>}
              {s.venue && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{s.venue}</p>}
            </div>
            <div className="text-sm sm:text-right" style={{ color: "var(--event-muted)" }}>
              {s.schedule_date && <p>{formatDate(s.schedule_date)}</p>}
              {s.start_time && <p>{formatTime12(s.start_time)}{s.end_time ? ` – ${formatTime12(s.end_time)}` : ""}</p>}
            </div>
          </div>
        ))}
      </div>
    </div></section>
  );
}

function RsvpFormBlock() {
  const { data, isLoading } = useQuery({
    queryKey: ["block-rsvp-sub-events"],
    queryFn: async () => { const { data } = await supabase.from("sub_events").select("*").order("display_order", { ascending: true }); return (data ?? []) as SubEvent[]; },
  });
  if (isLoading) return <Spinner />;
  const events = data ?? [];
  if (events.length === 0) return null;
  return (
    <section className="guest-section"><div className="mx-auto max-w-2xl">
      <p className="guest-eyebrow text-center">RSVP</p>
      <h2 className="guest-title text-center">Let us know if you can make it</h2>
      <div className="mt-6 space-y-4">
        {events.map((e) => (
          <div key={e.id} className="event-card">
            <h3 className="mb-1 font-semibold" style={{ color: "var(--event-heading)" }}>{e.name}</h3>
            {e.date && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{formatDate(e.date)}{e.start_time ? ` at ${formatTime12(e.start_time)}` : ""}</p>}
            {e.venue && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{e.venue}</p>}
          </div>
        ))}
        <p className="text-center text-sm" style={{ color: "var(--event-muted)" }}>Please visit the RSVP page to submit your response.</p>
      </div>
    </div></section>
  );
}

function GuestListBlock() {
  const { data, isLoading } = useQuery({
    queryKey: ["block-guest-list"],
    queryFn: async () => { const { data } = await supabase.from("event_guests").select("name").order("name", { ascending: true }); return (data ?? []) as Pick<EventGuest, "name">[]; },
  });
  if (isLoading) return <Spinner />;
  const guests = data ?? [];
  if (guests.length === 0) return null;
  return (
    <section className="guest-section"><div className="mx-auto max-w-2xl text-center">
      <p className="guest-eyebrow">Our Guests</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {guests.map((g, i) => <span key={i} className="event-card inline-block" style={{ padding: "0.5rem 1rem" }}>{g.name}</span>)}
      </div>
    </div></section>
  );
}
