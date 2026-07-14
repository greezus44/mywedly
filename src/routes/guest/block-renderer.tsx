import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { resolveTypography } from "../../lib/typography";
import { supabase, type Json, type EventSchedule, type EventMessage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { formatDate, formatTime12, getCountdown, cn } from "../../lib/utils";

export interface Block {
  id: string;
  type: string;
  content: Record<string, unknown>;
}

export function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as Block[];
}

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, index) => (
        <BlockView key={block.id ?? index} block={block} index={index} />
      ))}
    </div>
  );
}

type BP = { block: Block; className?: string; style?: React.CSSProperties };

function BlockView({ block, index }: { block: Block; index: number }) {
  const p = { block, className: "animate-slideUpStagger", style: { animationDelay: `${index * 60}ms` } as React.CSSProperties };
  switch (block.type) {
    case "heading": return <HeadingBlock {...p} />;
    case "paragraph": return <ParagraphBlock {...p} />;
    case "image": return <ImageBlock {...p} />;
    case "spacer": return <SpacerBlock block={block} />;
    case "divider": return <DividerBlock {...p} />;
    case "gallery": return <GalleryBlock {...p} />;
    case "video": return <VideoBlock {...p} />;
    case "button": return <ButtonBlock {...p} />;
    case "columns": return <ColumnsBlock {...p} />;
    case "list": return <ListBlock {...p} />;
    case "quote": return <QuoteBlock {...p} />;
    case "countdown": return <CountdownBlock {...p} />;
    case "map": return <MapBlock {...p} />;
    case "rsvp-form": return <RsvpFormBlock {...p} />;
    case "guest-list": return <GuestListBlock {...p} />;
    case "schedule": return <ScheduleBlock {...p} />;
    case "venue": return <VenueBlock {...p} />;
    case "faq": return <FaqBlock {...p} />;
    default: return null;
  }
}
function HeadingBlock({ block, className, style }: BP) {
  const { text, style: ts } = resolveTypography(block.content.text, "");
  const level = (block.content.level as number) ?? 2;
  const align = ((block.content.align as string) ?? "left") as React.CSSProperties["textAlign"];
  const Tag = `h${Math.min(Math.max(level, 1), 6)}` as keyof React.JSX.IntrinsicElements;
  return React.createElement(Tag, { className, style: { textAlign: align, ...ts, ...style } }, text);
}
function ParagraphBlock({ block, className, style }: BP) {
  const { text, style: ts } = resolveTypography(block.content.text, "");
  const align = ((block.content.align as string) ?? "left") as React.CSSProperties["textAlign"];
  return <p className={className} style={{ textAlign: align, ...ts, ...style }}>{text}</p>;
}
function ImageBlock({ block, className, style }: BP) {
  const url = (block.content.url as string) ?? "";
  const alt = (block.content.alt as string) ?? "";
  const align = (block.content.align as string) ?? "center";
  const cap = (block.content.caption as string) ?? "";
  if (!url) return null;
  const j = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";
  return (
    <figure className={cn("flex flex-col", j, className)} style={style}>
      <img src={url} alt={alt} className="max-w-full rounded-lg" style={{ borderRadius: "var(--event-radius)" }} />
      {cap && <figcaption className="mt-2 text-sm" style={{ color: "var(--event-muted)" }}>{cap}</figcaption>}
    </figure>
  );
}
function SpacerBlock({ block }: { block: Block }) {
  return <div style={{ height: `${(block.content.height as number) ?? 48}px` }} />;
}
function DividerBlock({ className, style }: BP) {
  return <hr className={cn("border-0 border-t", className)} style={{ borderColor: "var(--event-border)", ...style }} />;
}
function ButtonBlock({ block, className, style }: BP) {
  const { text } = resolveTypography(block.content.text, "Click here");
  const url = (block.content.url as string) ?? "";
  const variant = (block.content.variant as string) ?? "primary";
  const align = (block.content.align as string) ?? "center";
  const j = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";
  const cls = variant === "secondary" ? "event-btn-secondary" : "event-btn-primary";
  return (
    <div className={cn("flex", j, className)} style={style}>
      {url ? <a href={url} className={cls} target="_blank" rel="noopener noreferrer">{text}</a> : <button className={cls}>{text}</button>}
    </div>
  );
}
function GalleryBlock({ block, className, style }: BP) {
  const images = (block.content.images as Array<{ url?: string; alt?: string }>) ?? [];
  if (!images.length) return null;
  const cols = Math.min(Math.max((block.content.columns as number) ?? 3, 1), 4);
  return (
    <div className={cn("grid gap-4", className)} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, ...style }}>
      {images.filter((i) => i.url).map((img, i) => (
        <img key={i} src={img.url} alt={img.alt ?? ""} className="w-full rounded-lg object-cover" style={{ borderRadius: "var(--event-radius)" }} />
      ))}
    </div>
  );
}
function VideoBlock({ block, className, style }: BP) {
  const url = (block.content.url as string) ?? "";
  const cap = (block.content.caption as string) ?? "";
  if (!url) return null;
  const isYT = /youtube\.com|youtu\.be/.test(url);
  const embed = isYT ? url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/") : url;
  return (
    <figure className={className} style={style}>
      <div className="overflow-hidden rounded-lg" style={{ borderRadius: "var(--event-radius)" }}>
        {isYT ? (
          <iframe src={embed} title={cap || "Video"} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <video src={url} controls className="aspect-video w-full rounded-lg" style={{ borderRadius: "var(--event-radius)" }} />
        )}
      </div>
      {cap && <figcaption className="mt-2 text-sm" style={{ color: "var(--event-muted)" }}>{cap}</figcaption>}
    </figure>
  );
}
function ColumnsBlock({ block, className, style }: BP) {
  const columns = (block.content.columns as Array<{ text?: unknown }>) ?? [];
  if (!columns.length) return null;
  return (
    <div className={cn("grid gap-6", className)} style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`, ...style }}>
      {columns.map((col, i) => {
        const { text, style: ts } = resolveTypography(col.text, "");
        return <div key={i} className="rich-content" style={ts}>{text}</div>;
      })}
    </div>
  );
}
function ListBlock({ block, className, style }: BP) {
  const items = (block.content.items as string[]) ?? [];
  if (!items.length) return null;
  const Tag = (block.content.ordered as boolean) ? "ol" : "ul";
  return (
    <Tag className={cn("space-y-1.5 pl-6", className)} style={{ color: "var(--event-text)", ...style }}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </Tag>
  );
}
function QuoteBlock({ block, className, style }: BP) {
  const { text, style: ts } = resolveTypography(block.content.text, "");
  const author = (block.content.author as string) ?? "";
  return (
    <blockquote className={cn("border-l-4 pl-6 italic", className)} style={{ borderColor: "var(--event-primary)", color: "var(--event-muted)", ...ts, ...style }}>
      <p>"{text}"</p>
      {author && <footer className="mt-2 text-sm not-italic" style={{ color: "var(--event-muted)" }}>— {author}</footer>}
    </blockquote>
  );
}
function CountdownBlock({ block, className, style }: BP) {
  const target = (block.content.target as string) ?? "";
  const { text: label } = resolveTypography(block.content.label, "");
  const [c, setC] = useState(() => getCountdown(target));
  useEffect(() => {
    const id = setInterval(() => setC(getCountdown(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (c.done) return <div className={cn("text-center", className)} style={style}><p className="guest-subtitle">{label || "The big day is here!"}</p></div>;
  const units = [{ v: c.days, l: "Days" }, { v: c.hours, l: "Hours" }, { v: c.minutes, l: "Minutes" }, { v: c.seconds, l: "Seconds" }];
  return (
    <div className={cn("text-center", className)} style={style}>
      {label && <p className="guest-eyebrow mb-4">{label}</p>}
      <div className="flex justify-center gap-4">
        {units.map((u) => (
          <div key={u.l} className="event-card text-center" style={{ minWidth: "5rem", padding: "1.25rem 0.5rem" }}>
            <div className="text-3xl font-bold" style={{ color: "var(--event-heading)" }}>{String(u.v).padStart(2, "0")}</div>
            <div className="mt-1 text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>{u.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function MapBlock({ block, className, style }: BP) {
  const q = encodeURIComponent(((block.content.address as string) ?? "") || ((block.content.label as string) ?? ""));
  return (
    <div className={cn("overflow-hidden rounded-lg", className)} style={{ borderRadius: "var(--event-radius)", ...style }}>
      <iframe src={`https://www.google.com/maps?q=${q}&output=embed`} title="Map" className="h-72 w-full" loading="lazy" />
    </div>
  );
}
function RsvpFormBlock({ className, style }: BP) {
  const { slug } = useGuestOutletContext();
  const navigate = useNavigate();
  return (
    <div className={cn("text-center", className)} style={style}>
      <p className="guest-subtitle mb-6">Let us know if you can make it.</p>
      <button onClick={() => navigate(`/e/${slug}/rsvp`)} className="event-btn-primary">RSVP Now</button>
    </div>
  );
}
function GuestListBlock({ className, style }: BP) {
  const { event } = useGuestOutletContext();
  const { data: messages } = useQuery({
    queryKey: ["event-messages", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_messages").select("*").eq("event_id", event.id).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as EventMessage[];
    },
  });
  const list = messages ?? [];
  if (!list.length) return <p className={cn("text-sm", className)} style={{ color: "var(--event-muted)", ...style }}>No messages yet.</p>;
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)} style={style}>
      {list.map((m) => (
        <div key={m.id} className="event-card" style={{ padding: "1.25rem" }}>
          <p className="text-sm" style={{ color: "var(--event-text)" }}>{m.message}</p>
          <p className="mt-2 text-xs font-medium" style={{ color: "var(--event-muted)" }}>— {m.guest_name}</p>
        </div>
      ))}
    </div>
  );
}
function ScheduleBlock({ className, style }: BP) {
  const { event } = useGuestOutletContext();
  const { data: schedule } = useQuery({
    queryKey: ["guest-schedule", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_schedule").select("*").eq("event_id", event.id).order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventSchedule[];
    },
  });
  const items = schedule ?? [];
  if (!items.length) return null;
  return (
    <div className={cn("space-y-4", className)} style={style}>
      {items.map((s) => (
        <div key={s.id} className="event-card flex items-start gap-4" style={{ padding: "1.5rem" }}>
          {s.cover_image && <img src={s.cover_image} alt="" className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" style={{ borderRadius: "var(--event-radius)" }} />}
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>{s.title}</h3>
            {s.schedule_date && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{formatDate(s.schedule_date)}{s.start_time ? ` at ${formatTime12(s.start_time)}` : ""}</p>}
            {s.venue && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{s.venue}</p>}
            {s.description && <p className="mt-1 text-sm" style={{ color: "var(--event-text)" }}>{s.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
function VenueBlock({ block, className, style }: BP) {
  const name = (block.content.name as string) ?? "";
  const address = (block.content.address as string) ?? "";
  const q = encodeURIComponent(`${name} ${address}`.trim());
  return (
    <div className={cn("event-card", className)} style={{ padding: "1.75rem", ...style }}>
      {name && <h3 className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>{name}</h3>}
      {address && <p className="mt-1 text-sm" style={{ color: "var(--event-muted)" }}>{address}</p>}
      {q && (
        <div className="mt-4 overflow-hidden rounded-lg" style={{ borderRadius: "var(--event-radius)" }}>
          <iframe src={`https://www.google.com/maps?q=${q}&output=embed`} title="Venue map" className="h-64 w-full" loading="lazy" />
        </div>
      )}
    </div>
  );
}
function FaqBlock({ block, className, style }: BP) {
  const items = (block.content.items as Array<{ question?: string; answer?: string }>) ?? [];
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  if (!items.length) return null;
  return (
    <div className={cn("space-y-3", className)} style={style}>
      {items.map((item, i) => (
        <div key={i} className="event-card" style={{ padding: "1.25rem 1.5rem" }}>
          <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="flex w-full items-center justify-between text-left">
            <span className="font-semibold" style={{ color: "var(--event-heading)" }}>{item.question}</span>
            <span className="ml-4 flex-shrink-0" style={{ color: "var(--event-primary)" }}>{openIdx === i ? "−" : "+"}</span>
          </button>
          {openIdx === i && item.answer && <p className="mt-3 text-sm animate-fadeIn" style={{ color: "var(--event-text)" }}>{item.answer}</p>}
        </div>
      ))}
    </div>
  );
}
