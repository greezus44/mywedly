import React, { useState, useEffect } from "react";
import { resolveTypography } from "../../lib/typography";
import { RichTextContent } from "../../lib/sanitize";
import { getCountdown } from "../../lib/utils";
import type { Json } from "../../lib/supabase";

export interface Block {
  id: string;
  type: string;
  content: Record<string, unknown>;
  order?: number;
}

function parseBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return (json as Array<Record<string, unknown>>).map((item) => ({
    id: (item.id as string) ?? `block-${Math.random().toString(36).slice(2)}`,
    type: (item.type as string) ?? "paragraph",
    content: (item.content as Record<string, unknown>) ?? {},
    order: (item.order as number) ?? 0,
  }));
}

export function BlockRenderer({ blocks }: { blocks: Json | null | undefined }) {
  const parsed = parseBlocks(blocks);
  if (parsed.length === 0) return null;
  return (
    <div className="space-y-6">
      {parsed.map((block) => (
        <BlockItem key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockItem({ block }: { block: Block }) {
  const c = block.content;
  switch (block.type) {
    case "heading": return <HeadingBlock c={c} />;
    case "paragraph": return <ParagraphBlock c={c} />;
    case "image": return <ImageBlock c={c} />;
    case "spacer": return <SpacerBlock c={c} />;
    case "divider": return <DividerBlock />;
    case "gallery": return <GalleryBlock c={c} />;
    case "video": return <VideoBlock c={c} />;
    case "button": return <ButtonBlock c={c} />;
    case "columns": return <ColumnsBlock c={c} />;
    case "list": return <ListBlock c={c} />;
    case "quote": return <QuoteBlock c={c} />;
    case "countdown": return <CountdownBlock c={c} />;
    case "map": return <MapBlock c={c} />;
    case "rsvp-form": return <RsvpFormBlock c={c} />;
    case "guest-list": return <GuestListBlock c={c} />;
    case "schedule": return <ScheduleBlock c={c} />;
    case "venue": return <VenueBlock c={c} />;
    case "faq": return <FaqBlock c={c} />;
    default: return null;
  }
}

function HeadingBlock({ c }: { c: Record<string, unknown> }) {
  const t = resolveTypography(c, "");
  return <h2 className="guest-title" style={t.style}>{t.text}</h2>;
}

function ParagraphBlock({ c }: { c: Record<string, unknown> }) {
  const html = (c.html as string) ?? (c.text as string) ?? "";
  if (!html) return null;
  return <RichTextContent html={html} />;
}

function ImageBlock({ c }: { c: Record<string, unknown> }) {
  const url = c.url as string | undefined;
  const caption = c.caption as string | undefined;
  if (!url) return null;
  return (
    <figure className="overflow-hidden rounded-xl">
      <img src={url} alt={(c.alt as string) ?? ""} className="w-full object-cover" />
      {caption && <figcaption className="mt-2 text-center text-sm" style={{ color: "var(--event-muted)" }}>{caption}</figcaption>}
    </figure>
  );
}

function SpacerBlock({ c }: { c: Record<string, unknown> }) {
  const h = typeof c.height === "number" ? c.height : 32;
  return <div style={{ height: `${h}px` }} />;
}

function DividerBlock() {
  return <hr className="border-t" style={{ borderColor: "var(--event-border)" }} />;
}

function GalleryBlock({ c }: { c: Record<string, unknown> }) {
  const images = (c.images as string[]) ?? [];
  if (images.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((src, i) => (
        <div key={i} className="overflow-hidden rounded-lg">
          <img src={src} alt="" className="aspect-square w-full object-cover" />
        </div>
      ))}
    </div>
  );
}

function VideoBlock({ c }: { c: Record<string, unknown> }) {
  const embed = c.embed as string | undefined;
  const caption = c.caption as string | undefined;
  if (!embed) return null;
  return (
    <figure>
      <div className="overflow-hidden rounded-xl" dangerouslySetInnerHTML={{ __html: embed }} />
      {caption && <figcaption className="mt-2 text-center text-sm" style={{ color: "var(--event-muted)" }}>{caption}</figcaption>}
    </figure>
  );
}

function ButtonBlock({ c }: { c: Record<string, unknown> }) {
  const label = c.label as string | undefined;
  const href = c.href as string | undefined;
  if (!label) return null;
  const cls = c.variant === "secondary" ? "event-btn-secondary" : "event-btn-primary";
  return (
    <div className="text-center">
      {href ? <a href={href} className={cls} target="_blank" rel="noopener noreferrer">{label}</a> : <button type="button" className={cls}>{label}</button>}
    </div>
  );
}

function ColumnsBlock({ c }: { c: Record<string, unknown> }) {
  const columns = (c.columns as Json[]) ?? [];
  if (columns.length === 0) return null;
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {columns.map((col, i) => (
        <div key={i}><BlockRenderer blocks={Array.isArray(col) ? col : [col]} /></div>
      ))}
    </div>
  );
}

function ListBlock({ c }: { c: Record<string, unknown> }) {
  const items = (c.items as string[]) ?? [];
  if (items.length === 0) return null;
  const ordered = c.ordered === true;
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className="space-y-1 pl-5" style={{ color: "var(--event-text)" }}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </Tag>
  );
}

function QuoteBlock({ c }: { c: Record<string, unknown> }) {
  const text = c.text as string | undefined;
  const caption = c.caption as string | undefined;
  if (!text) return null;
  return (
    <blockquote className="border-l-4 py-2 pl-4 italic" style={{ borderColor: "var(--event-border)", color: "var(--event-muted)" }}>
      <p>{text}</p>
      {caption && <footer className="mt-2 text-sm not-italic">— {caption}</footer>}
    </blockquote>
  );
}

function CountdownBlock({ c }: { c: Record<string, unknown> }) {
  const target = c.date as string | undefined;
  const [t, setT] = useState(() => getCountdown(target));
  useEffect(() => {
    const id = setInterval(() => setT(getCountdown(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (t.done) return <p className="text-center text-lg font-semibold" style={{ color: "var(--event-heading)" }}>The big day is here!</p>;
  return (
    <div className="grid grid-cols-4 gap-3 text-center">
      {[{ l: "Days", v: t.days }, { l: "Hours", v: t.hours }, { l: "Mins", v: t.minutes }, { l: "Secs", v: t.seconds }].map((u) => (
        <div key={u.l} className="event-info-card">
          <p className="text-2xl font-bold" style={{ color: "var(--event-heading)" }}>{u.v}</p>
          <p className="text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>{u.l}</p>
        </div>
      ))}
    </div>
  );
}

function MapBlock({ c }: { c: Record<string, unknown> }) {
  const query = (c.query as string) ?? (c.address as string) ?? "";
  if (!query) return null;
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  return (
    <div className="overflow-hidden rounded-xl">
      <iframe title="Map" src={src} width="100%" height="300" style={{ border: 0 }} loading="lazy" />
    </div>
  );
}

function RsvpFormBlock({ c }: { c: Record<string, unknown> }) {
  return (
    <div className="event-card text-center">
      <p className="guest-eyebrow mb-2">{(c.label as string) ?? "RSVP"}</p>
      <a href="./rsvp" className="event-btn-primary">Go to RSVP</a>
    </div>
  );
}

function GuestListBlock({ c }: { c: Record<string, unknown> }) {
  const names = (c.names as string[]) ?? [];
  if (names.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {names.map((n, i) => (
        <span key={i} className="rounded-full px-3 py-1 text-sm" style={{ backgroundColor: "var(--event-surface-alt)", color: "var(--event-text)" }}>{n}</span>
      ))}
    </div>
  );
}

function ScheduleBlock({ c }: { c: Record<string, unknown> }) {
  const items = (c.items as Array<Record<string, unknown>>) ?? [];
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const time = (item.time as string) ?? "";
        const title = (item.title as string) ?? "";
        const desc = item.description as string | undefined;
        return (
          <div key={i} className="flex gap-4 rounded-lg p-3" style={{ backgroundColor: "var(--event-surface-alt)" }}>
            <div className="min-w-[80px] text-sm font-semibold" style={{ color: "var(--event-heading)" }}>{time}</div>
            <div>
              <p className="font-medium" style={{ color: "var(--event-text)" }}>{title}</p>
              {desc && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{desc}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VenueBlock({ c }: { c: Record<string, unknown> }) {
  const name = c.name as string | undefined;
  const address = c.address as string | undefined;
  return (
    <div className="event-info-card">
      {name && <p className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>{name}</p>}
      {address && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{address}</p>}
    </div>
  );
}

function FaqBlock({ c }: { c: Record<string, unknown> }) {
  const items = (c.items as Array<Record<string, unknown>>) ?? [];
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <details key={i} className="event-info-card">
          <summary className="cursor-pointer font-medium" style={{ color: "var(--event-heading)" }}>{(item.question as string) ?? ""}</summary>
          <p className="mt-2 text-sm" style={{ color: "var(--event-text)" }}>{(item.answer as string) ?? ""}</p>
        </details>
      ))}
    </div>
  );
}

export default BlockRenderer;
