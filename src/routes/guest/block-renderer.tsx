import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Json, type SubEvent, type EventSchedule } from "../../lib/supabase";
import { resolveTypography } from "../../lib/typography";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

type BlockType =
  | "heading" | "paragraph" | "image" | "spacer" | "divider" | "gallery"
  | "video" | "button" | "columns" | "list" | "quote" | "countdown"
  | "map" | "rsvp-form" | "guest-list" | "schedule" | "venue" | "faq";

interface BlockContent {
  text?: string; html?: string; url?: string; alt?: string; label?: string;
  href?: string; align?: "left" | "center" | "right"; height?: number;
  images?: string[]; items?: string[]; columns?: string[]; quote?: string;
  author?: string; date?: string; address?: string; lat?: number; lng?: number;
  zoom?: number; questions?: { q: string; a: string }[]; title?: string;
}

interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
}

function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as Block[];
}

const alignClass = (align?: string) =>
  align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";

/* ---------- Text blocks ---------- */

function HeadingBlock({ content }: { content: BlockContent }) {
  const t = resolveTypography(content.text, "Heading");
  return <h2 className="guest-title" style={{ ...t.style, textAlign: content.align || "center" }}>{t.text}</h2>;
}

function ParagraphBlock({ content }: { content: BlockContent }) {
  const t = resolveTypography(content.text, "");
  return <p className={`text-base leading-relaxed ${alignClass(content.align)}`} style={t.style}>{t.text}</p>;
}

function QuoteBlock({ content }: { content: BlockContent }) {
  const quote = resolveTypography(content.quote, "");
  const author = resolveTypography(content.author, "");
  return (
    <blockquote className="mx-auto max-w-2xl border-l-4 pl-6 italic" style={{ borderColor: "var(--event-primary)" }}>
      <p className="text-lg" style={quote.style}>{quote.text}</p>
      {author.text && <footer className="mt-3 text-sm" style={{ color: "var(--event-muted)" }}>— {author.text}</footer>}
    </blockquote>
  );
}

function ListBlock({ content }: { content: BlockContent }) {
  const items = content.items ?? [];
  return (
    <ul className={`mx-auto max-w-2xl space-y-2 ${alignClass(content.align)}`}>
      {items.map((item, i) => <li key={i} className="text-base" style={{ color: "var(--event-text)" }}>{item}</li>)}
    </ul>
  );
}

/* ---------- Media blocks ---------- */

function ImageBlock({ content }: { content: BlockContent }) {
  if (!content.url) return null;
  return (
    <div className={alignClass(content.align)}>
      <img src={content.url} alt={content.alt || ""} className="max-w-full rounded-lg" style={{ borderRadius: "var(--event-radius)" }} />
    </div>
  );
}

function GalleryBlock({ content }: { content: BlockContent }) {
  const images = content.images ?? [];
  if (images.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {images.map((src, i) => (
        <div key={i} className="overflow-hidden rounded-lg" style={{ borderRadius: "var(--event-radius)" }}>
          <img src={src} alt={`Gallery ${i + 1}`} className="h-40 w-full object-cover transition-transform duration-300 hover:scale-105 md:h-56" />
        </div>
      ))}
    </div>
  );
}

function VideoBlock({ content }: { content: BlockContent }) {
  if (!content.url) return null;
  const isYouTube = content.url.includes("youtube.com") || content.url.includes("youtu.be");
  if (isYouTube) {
    const videoId = content.url.includes("youtu.be/")
      ? content.url.split("youtu.be/")[1]?.split("?")[0]
      : content.url.split("v=")[1]?.split("&")[0];
    return (
      <div className={alignClass(content.align)}>
        <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-lg" style={{ borderRadius: "var(--event-radius)" }}>
          <iframe src={`https://www.youtube.com/embed/${videoId}`} title="Video" className="h-full w-full" allowFullScreen frameBorder={0} />
        </div>
      </div>
    );
  }
  return (
    <div className={alignClass(content.align)}>
      <video src={content.url} controls className="max-w-full rounded-lg" style={{ borderRadius: "var(--event-radius)" }} />
    </div>
  );
}

/* ---------- Layout blocks ---------- */

function SpacerBlock({ content }: { content: BlockContent }) {
  return <div style={{ height: `${content.height ?? 40}px` }} />;
}

function DividerBlock() {
  return <hr className="mx-auto max-w-md" style={{ borderColor: "var(--event-border)" }} />;
}

function ButtonBlock({ content }: { content: BlockContent }) {
  const label = resolveTypography(content.label, "Click Here");
  if (!content.href) return <div className={alignClass(content.align)}><button className="event-btn-primary">{label.text}</button></div>;
  return (
    <div className={alignClass(content.align)}>
      <a href={content.href} target="_blank" rel="noopener noreferrer" className="event-btn-primary inline-block no-underline">{label.text}</a>
    </div>
  );
}

function ColumnsBlock({ content }: { content: BlockContent }) {
  const cols = content.columns ?? [];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {cols.map((col, i) => (
        <div key={i} className="rich-content" dangerouslySetInnerHTML={{ __html: col }} />
      ))}
    </div>
  );
}

/* ---------- Special blocks ---------- */

function CountdownBlock({ content }: { content: BlockContent }) {
  const [countdown, setCountdown] = useState(() => getCountdown(content.date));
  useEffect(() => {
    const timer = setInterval(() => setCountdown(getCountdown(content.date)), 1000);
    return () => clearInterval(timer);
  }, [content.date]);
  if (countdown.isPast) return <p className="text-center text-lg" style={{ color: "var(--event-muted)" }}>The day has arrived!</p>;
  const units = [{ label: "Days", value: countdown.days }, { label: "Hours", value: countdown.hours }, { label: "Minutes", value: countdown.minutes }, { label: "Seconds", value: countdown.seconds }];
  return (
    <div className="flex justify-center gap-4 md:gap-8">
      {units.map((u) => (
        <div key={u.label} className="text-center">
          <div className="text-3xl font-bold md:text-5xl" style={{ color: "var(--event-heading)" }}>{u.value}</div>
          <div className="text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>{u.label}</div>
        </div>
      ))}
    </div>
  );
}

function MapBlock({ content }: { content: BlockContent }) {
  const query = content.address || "";
  const src = content.lat && content.lng
    ? `https://www.google.com/maps?q=${content.lat},${content.lng}&z=${content.zoom ?? 14}&output=embed`
    : `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  return (
    <div className="overflow-hidden rounded-lg" style={{ borderRadius: "var(--event-radius)" }}>
      <iframe src={src} title="Map" className="h-72 w-full" loading="lazy" frameBorder={0} />
    </div>
  );
}

function VenueBlock({ content }: { content: BlockContent }) {
  const title = resolveTypography(content.title, "Venue");
  return (
    <div className="event-card mx-auto max-w-2xl text-center">
      {title.text && <h3 className="mb-2 text-xl font-semibold" style={{ color: "var(--event-heading)" }}>{title.text}</h3>}
      {content.address && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{content.address}</p>}
      {content.url && <a href={content.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm hover:underline" style={{ color: "var(--event-primary)" }}>View on Map</a>}
    </div>
  );
}

function ScheduleBlock({ eventId }: { eventId: string }) {
  const { data: schedule, isLoading } = useQuery({
    queryKey: ["guest-schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_schedule").select("*").eq("event_id", eventId).order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventSchedule[];
    },
    enabled: !!eventId,
  });
  if (isLoading) return <div className="flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
  const items = schedule ?? [];
  if (items.length === 0) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {items.map((item) => (
        <div key={item.id} className="event-card flex items-start gap-4">
          {item.cover_image && <img src={item.cover_image} alt={item.title} className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />}
          <div className="flex-1">
            <h4 className="font-semibold" style={{ color: "var(--event-heading)" }}>{item.title}</h4>
            <p className="text-sm" style={{ color: "var(--event-muted)" }}>{formatDate(item.schedule_date)}{item.start_time ? ` at ${formatTime12(item.start_time)}` : ""}</p>
            {item.venue && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{item.venue}</p>}
            {item.description && <p className="mt-1 text-sm" style={{ color: "var(--event-text)" }}>{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function FaqBlock({ content }: { content: BlockContent }) {
  const questions = content.questions ?? [];
  if (questions.length === 0) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {questions.map((item, i) => (
        <details key={i} className="event-card group">
          <summary className="cursor-pointer font-semibold" style={{ color: "var(--event-heading)" }}>{item.q}</summary>
          <p className="mt-2 text-sm" style={{ color: "var(--event-text)" }}>{item.a}</p>
        </details>
      ))}
    </div>
  );
}

function GuestListBlock({ eventId }: { eventId: string }) {
  const { data: guests, isLoading } = useQuery({
    queryKey: ["guest-list-block", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_guests").select("name").eq("event_id", eventId).order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as { name: string }[];
    },
    enabled: !!eventId,
  });
  if (isLoading) return <div className="flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
  const list = guests ?? [];
  if (list.length === 0) return null;
  return (
    <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
      {list.map((g, i) => (
        <span key={i} className="rounded-full px-4 py-1.5 text-sm" style={{ backgroundColor: "var(--event-surface-alt)", color: "var(--event-text)", border: "1px solid var(--event-border)" }}>{g.name}</span>
      ))}
    </div>
  );
}

/* ---------- Main renderer ---------- */

export function BlockRenderer({ blocks, eventId }: { blocks: Json | null | undefined; eventId: string }) {
  const parsed = jsonToBlocks(blocks);
  if (parsed.length === 0) return null;
  return (
    <div className="space-y-8">
      {parsed.map((block) => {
        const c = block.content;
        switch (block.type) {
          case "heading": return <HeadingBlock key={block.id} content={c} />;
          case "paragraph": return <ParagraphBlock key={block.id} content={c} />;
          case "image": return <ImageBlock key={block.id} content={c} />;
          case "spacer": return <SpacerBlock key={block.id} content={c} />;
          case "divider": return <DividerBlock key={block.id} />;
          case "gallery": return <GalleryBlock key={block.id} content={c} />;
          case "video": return <VideoBlock key={block.id} content={c} />;
          case "button": return <ButtonBlock key={block.id} content={c} />;
          case "columns": return <ColumnsBlock key={block.id} content={c} />;
          case "list": return <ListBlock key={block.id} content={c} />;
          case "quote": return <QuoteBlock key={block.id} content={c} />;
          case "countdown": return <CountdownBlock key={block.id} content={c} />;
          case "map": return <MapBlock key={block.id} content={c} />;
          case "venue": return <VenueBlock key={block.id} content={c} />;
          case "schedule": return <ScheduleBlock key={block.id} eventId={eventId} />;
          case "faq": return <FaqBlock key={block.id} content={c} />;
          case "guest-list": return <GuestListBlock key={block.id} eventId={eventId} />;
          case "rsvp-form": return null; // handled by dedicated RSVP page
          default: return null;
        }
      })}
    </div>
  );
}
