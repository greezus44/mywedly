import { useState, useEffect } from "react";
import type { BlockContent } from "../../routes/event/block-types";
import { getCountdown, formatTime12, formatDate } from "../../lib/utils";

interface BlockRendererProps {
  block: BlockContent;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  const d = block.data;
  const style: React.CSSProperties = {};

  switch (block.type) {
    case "heading": {
      const level = (d.level as number) ?? 2;
      const text = (d.text as string) ?? "";
      const align = (d.align as string) ?? "center";
      style.textAlign = align as "left" | "center" | "right";
      const Tag = (`h${level}` as "h1" | "h2" | "h3");
      return <Tag style={style} className="guest-title">{text}</Tag>;
    }

    case "paragraph": {
      return <div className="rich-content" dangerouslySetInnerHTML={{ __html: (d.html as string) ?? "" }} />;
    }

    case "image": {
      const url = d.url as string;
      if (!url) return null;
      return <img src={url} alt={(d.alt as string) ?? ""} className="mx-auto max-w-full rounded-lg" style={{ width: d.width === "full" ? "100%" : "auto" }} />;
    }

    case "spacer": {
      return <div style={{ height: `${(d.height as number) ?? 40}px` }} />;
    }

    case "divider": {
      return <hr style={{ border: "none", borderTop: `1px solid var(--event-border)`, margin: "1rem 0" }} />;
    }

    case "gallery": {
      const images = (d.images as string[]) ?? [];
      const cols = (d.columns as number) ?? 3;
      if (images.length === 0) return null;
      return (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(cols, images.length)}, 1fr)` }}>
          {images.map((url, i) => (
            <img key={i} src={url} alt="" className="w-full rounded-lg object-cover" />
          ))}
        </div>
      );
    }

    case "video": {
      const url = d.url as string;
      if (!url) return null;
      const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      const vimeo = url.match(/vimeo\.com\/(\d+)/);
      if (youtube) {
        return (
          <div className="aspect-video w-full">
            <iframe src={`https://www.youtube.com/embed/${youtube[1]}`} className="h-full w-full rounded-lg" allowFullScreen title={(d.title as string) ?? "Video"} />
          </div>
        );
      }
      if (vimeo) {
        return (
          <div className="aspect-video w-full">
            <iframe src={`https://player.vimeo.com/video/${vimeo[1]}`} className="h-full w-full rounded-lg" allowFullScreen title={(d.title as string) ?? "Video"} />
          </div>
        );
      }
      return <video src={url} controls className="w-full rounded-lg" />;
    }

    case "button": {
      const text = (d.text as string) ?? "";
      const url = (d.url as string) ?? "";
      if (!text) return null;
      const cls = d.style === "secondary" ? "event-btn-secondary" : "event-btn-primary";
      if (url) {
        return <a href={url} target="_blank" rel="noopener noreferrer" className={cls}>{text}</a>;
      }
      return <button type="button" className={cls}>{text}</button>;
    }

    case "columns": {
      const columns = (d.columns as Array<{ html: string }>) ?? [];
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {columns.map((col, i) => (
            <div key={i} className="rich-content" dangerouslySetInnerHTML={{ __html: col.html ?? "" }} />
          ))}
        </div>
      );
    }

    case "list": {
      const items = (d.items as string[]) ?? [];
      const ordered = d.ordered as boolean;
      const Tag = ordered ? "ol" : "ul";
      return (
        <Tag className="rich-content pl-6">
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </Tag>
      );
    }

    case "quote": {
      const text = (d.text as string) ?? "";
      const author = (d.author as string) ?? "";
      return (
        <blockquote className="rich-content border-l-4 pl-4 italic" style={{ borderColor: "var(--event-border)", color: "var(--event-muted)" }}>
          {text}
          {author && <footer className="mt-2 text-sm not-italic">— {author}</footer>}
        </blockquote>
      );
    }

    case "countdown": {
      const target = d.targetDate as string;
      const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });
      useEffect(() => {
        if (!target) return;
        const tick = () => setCountdown(getCountdown(target));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
      }, [target]);
      if (!target) return null;
      return (
        <div className="text-center">
          {d.label ? <p className="guest-subtitle mb-4">{d.label as string}</p> : null}
          <div className="flex justify-center gap-4">
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <div key={unit} className="flex flex-col items-center">
                <span className="text-3xl font-bold" style={{ color: "var(--event-primary)" }}>
                  {String(countdown[unit]).padStart(2, "0")}
                </span>
                <span className="text-xs uppercase" style={{ color: "var(--event-muted)" }}>{unit}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "map": {
      const address = (d.address as string) ?? "";
      if (!address) return null;
      const encoded = encodeURIComponent(address);
      const zoom = (d.zoom as number) ?? 15;
      return (
        <div className="overflow-hidden rounded-lg">
          <iframe
            src={`https://maps.google.com/maps?q=${encoded}&z=${zoom}&output=embed`}
            className="h-64 w-full border-0"
            title="Map"
            loading="lazy"
          />
        </div>
      );
    }

    case "rsvp-form": {
      return (
        <div className="text-center">
          <h3 className="guest-title mb-4">{(d.title as string) ?? "RSVP"}</h3>
          <p className="guest-subtitle" style={{ color: "var(--event-muted)" }}>Please use the RSVP page to respond.</p>
        </div>
      );
    }

    case "guest-list": {
      return (
        <div>
          <h3 className="guest-title mb-4 text-center">{(d.title as string) ?? "Guests"}</h3>
          <p style={{ color: "var(--event-muted)" }} className="text-center">Guest list will appear here.</p>
        </div>
      );
    }

    case "schedule": {
      return (
        <div>
          <h3 className="guest-title mb-4 text-center">{(d.title as string) ?? "Schedule"}</h3>
          <p style={{ color: "var(--event-muted)" }} className="text-center">Schedule will appear here.</p>
        </div>
      );
    }

    case "venue": {
      const name = (d.name as string) ?? "";
      const address = (d.address as string) ?? "";
      return (
        <div className="event-card text-center">
          {name && <h3 className="guest-title mb-2">{name}</h3>}
          {address && <p className="guest-subtitle">{address}</p>}
          {address && (
            <a href={`https://maps.google.com/maps?q=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" className="event-btn-secondary mt-4 inline-block">
              View on Map
            </a>
          )}
        </div>
      );
    }

    case "faq": {
      const items = (d.items as Array<{ question: string; answer: string }>) ?? [];
      return (
        <div className="space-y-4">
          {items.map((item, i) => (
            <details key={i} className="event-card">
              <summary className="cursor-pointer font-medium" style={{ color: "var(--event-heading)" }}>{item.question}</summary>
              <p className="mt-2 text-sm" style={{ color: "var(--event-text)" }}>{item.answer}</p>
            </details>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}
