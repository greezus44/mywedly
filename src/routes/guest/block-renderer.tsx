import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Json } from "../../lib/supabase";
import { resolveTypography } from "../../lib/typography";
import { RichTextContent } from "../../lib/sanitize";
import { getCountdown, formatDate, formatTime12 } from "../../lib/utils";

interface Block {
  id?: string;
  type: string;
  content: Record<string, unknown>;
  order_index?: number;
}

interface BlockRendererProps {
  blocks: Json | null | undefined;
  /** slug of the parent event, used for rsvp-form navigation */
  slug?: string;
}

function readBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return (json as Array<Record<string, unknown>>).map((item) => ({
    id: (item.id as string) ?? undefined,
    type: (item.type as string) ?? "paragraph",
    content: (item.content as Record<string, unknown>) ?? {},
    order_index: (item.order_index as number) ?? 0,
  }));
}

function CountdownBlock({ targetDate }: { targetDate: string | null | undefined }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  void now;
  const c = getCountdown(targetDate);
  if (c.isPast) {
    return <p className="text-center text-sm" style={{ color: "var(--event-muted)" }}>The day has arrived!</p>;
  }
  const cells = [
    { label: "Days", value: c.days },
    { label: "Hours", value: c.hours },
    { label: "Min", value: c.minutes },
    { label: "Sec", value: c.seconds },
  ];
  return (
    <div className="grid grid-cols-4 gap-3 text-center">
      {cells.map((cell) => (
        <div key={cell.label} className="event-info-card">
          <div className="text-2xl font-bold" style={{ color: "var(--event-heading)" }}>
            {String(cell.value).padStart(2, "0")}
          </div>
          <div className="text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>{cell.label}</div>
        </div>
      ))}
    </div>
  );
}

export function BlockRenderer({ blocks, slug }: BlockRendererProps) {
  const navigate = useNavigate();
  const list = readBlocks(blocks);

  if (list.length === 0) return null;

  return (
    <div className="space-y-6">
      {list.map((block, i) => {
        const c = block.content;
        const key = block.id ?? i;
        switch (block.type) {
          case "heading": {
            const t = resolveTypography(c, "");
            return <h2 key={key} className="guest-title" style={t.style}>{t.text}</h2>;
          }
          case "paragraph": {
            const html = (c.html as string) ?? (c.text as string) ?? "";
            return <RichTextContent key={key} html={html} />;
          }
          case "image": {
            const url = c.url as string | undefined;
            if (!url) return null;
            return (
              <div key={key} style={{ textAlign: ((c.align as string) ?? "center") as React.CSSProperties["textAlign"] }}>
                <img src={url} alt={(c.alt as string) ?? ""} style={{ maxWidth: c.width ? `${c.width}px` : "100%", borderRadius: "var(--event-radius)", margin: "0 auto" }} />
              </div>
            );
          }
          case "spacer":
            return <div key={key} style={{ height: `${(c.heightPx as number) ?? 40}px` }} />;
          case "divider":
            return <hr key={key} style={{ border: "none", borderTop: `1px solid var(--event-border)` }} />;
          case "gallery": {
            const images = (c.images as string[]) ?? [];
            if (images.length === 0) return null;
            return (
              <div key={key} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((url, idx) => (
                  <img key={idx} src={url} alt="" className="w-full rounded-md object-cover" style={{ aspectRatio: "1" }} />
                ))}
              </div>
            );
          }
          case "video": {
            const url = (c.url as string) ?? "";
            if (!url) return null;
            const isYoutube = /youtube\.com|youtu\.be/.test(url);
            const embed = isYoutube
              ? `https://www.youtube.com/embed/${(url.split(/v=|youtu\.be\//)[1] ?? "").split(/[&?]/)[0]}`
              : url;
            return (
              <div key={key} className="overflow-hidden rounded-md" style={{ border: "1px solid var(--event-border)" }}>
                <iframe src={embed} title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: "100%", aspectRatio: "16 / 9", border: "none" }} />
              </div>
            );
          }
          case "button": {
            const href = (c.href as string) ?? "#";
            return (
              <div key={key} style={{ textAlign: ((c.align as string) ?? "center") as React.CSSProperties["textAlign"] }}>
                <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="event-btn-primary inline-block">
                  {(c.buttonText as string) ?? "Click Here"}
                </a>
              </div>
            );
          }
          case "columns": {
            const cols = (c.columns as Array<Record<string, unknown>>) ?? [];
            return (
              <div key={key} className="grid gap-4 sm:grid-cols-2">
                {cols.map((col, idx) => (
                  <div key={idx} className="event-info-card">
                    <BlockRenderer blocks={(col.blocks as Json) ?? null} slug={slug} />
                  </div>
                ))}
              </div>
            );
          }
          case "list": {
            const items = (c.items as string[]) ?? [];
            if (items.length === 0) return null;
            const ordered = c.ordered === true;
            const Tag = ordered ? "ol" : "ul";
            return (
              <Tag key={key} className="rich-content" style={{ paddingLeft: "1.5em" }}>
                {items.map((item, idx) => <li key={idx}>{item}</li>)}
              </Tag>
            );
          }
          case "quote": {
            const text = (c.text as string) ?? "";
            const author = (c.author as string) ?? "";
            return (
              <blockquote key={key} style={{ borderLeft: `3px solid var(--event-border)`, paddingLeft: "1em", fontStyle: "italic", color: "var(--event-muted)" }}>
                {text}
                {author && <footer className="mt-2 text-sm">— {author}</footer>}
              </blockquote>
            );
          }
          case "countdown":
            return <CountdownBlock key={key} targetDate={(c.date as string) ?? (c.targetDate as string)} />;
          case "map": {
            const address = (c.address as string) ?? (c.location as string) ?? "";
            const src = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
            return (
              <div key={key} className="overflow-hidden rounded-md" style={{ border: "1px solid var(--event-border)" }}>
                <iframe title="Map" src={src} style={{ width: "100%", height: "300px", border: "none" }} loading="lazy" />
              </div>
            );
          }
          case "rsvp-form": {
            return (
              <div key={key} className="text-center">
                <button type="button" onClick={() => slug && navigate(`/e/${slug}/rsvp`)} className="event-btn-primary">
                  {(c.buttonText as string) ?? "RSVP Now"}
                </button>
              </div>
            );
          }
          case "guest-list": {
            const names = (c.names as string[]) ?? [];
            if (names.length === 0) return null;
            return (
              <div key={key} className="grid gap-2 sm:grid-cols-2">
                {names.map((n, idx) => (
                  <div key={idx} className="event-info-card text-sm" style={{ color: "var(--event-text)" }}>{n}</div>
                ))}
              </div>
            );
          }
          case "schedule": {
            const items = (c.items as Array<Record<string, unknown>>) ?? [];
            if (items.length === 0) return null;
            return (
              <div key={key} className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="event-info-card">
                    <div className="font-semibold" style={{ color: "var(--event-heading)" }}>{(item.title as string) ?? ""}</div>
                    {item.date ? <div className="text-sm" style={{ color: "var(--event-muted)" }}>{formatDate(item.date as string)}{item.time ? ` · ${formatTime12(item.time as string)}` : ""}</div> : null}
                    {item.venue ? <div className="text-sm" style={{ color: "var(--event-muted)" }}>{item.venue as string}</div> : null}
                    {item.description ? <div className="mt-1 text-sm" style={{ color: "var(--event-text)" }}>{item.description as string}</div> : null}
                  </div>
                ))}
              </div>
            );
          }
          case "venue": {
            const name = (c.name as string) ?? "";
            const address = (c.address as string) ?? "";
            return (
              <div key={key} className="event-info-card text-center">
                {name && <div className="text-lg font-bold" style={{ color: "var(--event-heading)" }}>{name}</div>}
                {address && <div className="text-sm" style={{ color: "var(--event-muted)" }}>{address}</div>}
              </div>
            );
          }
          case "faq": {
            const items = (c.items as Array<Record<string, unknown>>) ?? [];
            if (items.length === 0) return null;
            return (
              <div key={key} className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="event-info-card">
                    <div className="font-semibold" style={{ color: "var(--event-heading)" }}>{(item.question as string) ?? ""}</div>
                    <div className="mt-1 text-sm" style={{ color: "var(--event-text)" }}>{(item.answer as string) ?? ""}</div>
                  </div>
                ))}
              </div>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}

export default BlockRenderer;
