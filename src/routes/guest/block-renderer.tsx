import React, { useEffect, useState } from "react";
import { resolveTypography } from "../../lib/typography";
import { RichTextContent } from "../../lib/sanitize";
import { getCountdown } from "../../lib/utils";

export interface Block {
  id: string;
  type: string;
  content: Record<string, unknown>;
  order_index: number;
}

interface BlockRendererProps {
  blocks: Block[];
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  if (!Array.isArray(blocks)) return null;
  return (
    <>
      {blocks.map((block) => (
        <BlockView key={block.id ?? block.order_index} block={block} />
      ))}
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  const c = block.content ?? {};
  switch (block.type) {
    case "heading": return <HeadingBlock c={c} />;
    case "paragraph":
    case "text": return <ParagraphBlock c={c} />;
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
    case "rsvp-form": return <PlaceholderBlock label="RSVP Form" />;
    case "guest-list": return <PlaceholderBlock label="Guest List" />;
    case "schedule": return <PlaceholderBlock label="Schedule" />;
    case "venue": return <PlaceholderBlock label="Venue" />;
    case "faq": return <FaqBlock c={c} />;
    default: return null;
  }
}

function HeadingBlock({ c }: { c: Record<string, unknown> }) {
  const resolved = resolveTypography(c, "");
  const level = (c.level as number) ?? 2;
  const align = (c.align as string) ?? "left";
  const style = { ...resolved.style, textAlign: align as React.CSSProperties["textAlign"] };
  const Tag = (`h${Math.min(Math.max(level, 1), 6)}`) as keyof React.JSX.IntrinsicElements;
  return (
    <div className="guest-section-tight">
      <div className="mx-auto max-w-3xl">
        <Tag className="guest-title" style={style}>{resolved.text}</Tag>
      </div>
    </div>
  );
}

function ParagraphBlock({ c }: { c: Record<string, unknown> }) {
  const text = (c.text as string) ?? "";
  const align = (c.align as string) ?? "left";
  return (
    <div className="guest-section-tight">
      <div className="mx-auto max-w-3xl" style={{ textAlign: align as React.CSSProperties["textAlign"] }}>
        <RichTextContent html={text} />
      </div>
    </div>
  );
}

function ImageBlock({ c }: { c: Record<string, unknown> }) {
  const url = c.url as string | null | undefined;
  const alt = (c.alt as string) ?? "";
  const align = (c.align as string) ?? "center";
  if (!url) return null;
  const justify = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
  return (
    <div className="guest-section-tight">
      <div className="mx-auto max-w-3xl flex" style={{ justifyContent: justify }}>
        <img src={url} alt={alt} className="max-w-full" style={{ borderRadius: "var(--event-radius)" }} />
      </div>
    </div>
  );
}

function SpacerBlock({ c }: { c: Record<string, unknown> }) {
  const height = (c.height as number) ?? 40;
  return <div style={{ height: `${height}px` }} />;
}

function DividerBlock() {
  return (
    <div className="mx-auto max-w-3xl py-2">
      <hr style={{ borderColor: "var(--event-border)", borderWidth: 0, borderTopWidth: "1px" }} />
    </div>
  );
}

function GalleryBlock({ c }: { c: Record<string, unknown> }) {
  const images = (c.images as string[]) ?? [];
  if (images.length === 0) return null;
  return (
    <div className="guest-section-tight">
      <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((src, i) => (
          <img key={i} src={src} alt="" className="w-full h-48 object-cover" style={{ borderRadius: "var(--event-radius)" }} />
        ))}
      </div>
    </div>
  );
}

function VideoBlock({ c }: { c: Record<string, unknown> }) {
  const embedUrl = c.embedUrl as string | undefined;
  if (!embedUrl) return null;
  return (
    <div className="guest-section-tight">
      <div className="mx-auto max-w-3xl" style={{ aspectRatio: "16 / 9" }}>
        <iframe src={embedUrl} className="w-full h-full" style={{ borderRadius: "var(--event-radius)", border: "none" }} allowFullScreen />
      </div>
    </div>
  );
}

function ButtonBlock({ c }: { c: Record<string, unknown> }) {
  const label = (c.label as string) ?? "";
  const href = (c.href as string) ?? "";
  const align = (c.align as string) ?? "center";
  if (!label) return null;
  const justify = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
  return (
    <div className="guest-section-tight">
      <div className="mx-auto max-w-3xl flex" style={{ justifyContent: justify }}>
        <button type="button" className="event-btn-primary" onClick={() => { if (href) window.open(href, "_blank", "noopener,noreferrer"); }}>
          {label}
        </button>
      </div>
    </div>
  );
}

function ColumnsBlock({ c }: { c: Record<string, unknown> }) {
  const columns = (c.columns as Array<{ blocks?: Block[] }>) ?? [];
  if (columns.length === 0) return null;
  return (
    <div className="guest-section-tight">
      <div className="mx-auto max-w-4xl grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((col, i) => (
          <div key={i}>{col.blocks && <BlockRenderer blocks={col.blocks} />}</div>
        ))}
      </div>
    </div>
  );
}

function ListBlock({ c }: { c: Record<string, unknown> }) {
  const items = (c.items as string[]) ?? [];
  const ordered = (c.ordered as boolean) ?? false;
  if (items.length === 0) return null;
  const Tag = ordered ? "ol" : "ul";
  return (
    <div className="guest-section-tight">
      <div className="mx-auto max-w-3xl">
        <Tag className="rich-content" style={{ paddingLeft: "1.5em" }}>
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </Tag>
      </div>
    </div>
  );
}

function QuoteBlock({ c }: { c: Record<string, unknown> }) {
  const text = (c.text as string) ?? "";
  const caption = (c.caption as string) ?? "";
  if (!text) return null;
  return (
    <div className="guest-section-tight">
      <div className="mx-auto max-w-3xl">
        <blockquote className="rich-content" style={{ borderLeft: "3px solid var(--event-border)", paddingLeft: "1em", fontStyle: "italic", color: "var(--event-muted)" }}>
          {text}
          {caption && <footer className="mt-2 text-sm" style={{ color: "var(--event-muted)" }}>— {caption}</footer>}
        </blockquote>
      </div>
    </div>
  );
}

function CountdownBlock({ c }: { c: Record<string, unknown> }) {
  const target = c.targetDate as string | undefined;
  const [count, setCount] = useState(getCountdown(target));
  useEffect(() => {
    const t = setInterval(() => setCount(getCountdown(target)), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (count.isPast) return <PlaceholderBlock label="The event has begun!" />;
  const items = [
    { label: "Days", value: count.days },
    { label: "Hours", value: count.hours },
    { label: "Minutes", value: count.minutes },
    { label: "Seconds", value: count.seconds },
  ];
  return (
    <div className="guest-section-tight">
      <div className="mx-auto max-w-3xl flex justify-center gap-4 md:gap-8">
        {items.map((it) => (
          <div key={it.label} className="text-center">
            <div className="text-3xl md:text-5xl font-bold" style={{ color: "var(--event-heading)" }}>{String(it.value).padStart(2, "0")}</div>
            <div className="text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapBlock({ c }: { c: Record<string, unknown> }) {
  const address = (c.address as string) ?? "";
  const query = encodeURIComponent(address || "venue");
  return (
    <div className="guest-section-tight">
      <div className="mx-auto max-w-3xl" style={{ aspectRatio: "16 / 9" }}>
        <iframe title="Map" src={`https://www.google.com/maps?q=${query}&output=embed`} className="w-full h-full" style={{ borderRadius: "var(--event-radius)", border: "none" }} />
      </div>
    </div>
  );
}

function PlaceholderBlock({ label }: { label: string }) {
  return (
    <div className="guest-section-tight text-center">
      <p className="guest-subtitle mx-auto">{label}</p>
    </div>
  );
}

function FaqBlock({ c }: { c: Record<string, unknown> }) {
  const items = (c.items as Array<{ question?: string; answer?: string }>) ?? [];
  if (items.length === 0) return null;
  return (
    <div className="guest-section-tight">
      <div className="mx-auto max-w-3xl space-y-4">
        {items.map((item, i) => (
          <details key={i} className="event-card" style={{ padding: "1rem 1.5rem" }}>
            <summary className="cursor-pointer font-semibold" style={{ color: "var(--event-heading)" }}>{item.question ?? ""}</summary>
            <p className="mt-2 rich-content">{item.answer ?? ""}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
