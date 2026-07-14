import React from "react";
import type { Json } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { cn, formatDate, formatTime12, getCountdown } from "../../lib/utils";

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "spacer"
  | "divider"
  | "gallery"
  | "video"
  | "button"
  | "columns"
  | "list"
  | "quote"
  | "countdown"
  | "map"
  | "rsvp-form"
  | "guest-list"
  | "schedule"
  | "venue"
  | "faq";

export interface Block {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
}

export interface BlockTypeMeta {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
}

export const BLOCK_TYPES: BlockTypeMeta[] = [
  { type: "heading", label: "Heading", icon: "H", description: "A section heading" },
  { type: "paragraph", label: "Paragraph", icon: "¶", description: "Rich text paragraph" },
  { type: "image", label: "Image", icon: "🖼", description: "A single image" },
  { type: "spacer", label: "Spacer", icon: "↕", description: "Vertical spacing" },
  { type: "divider", label: "Divider", icon: "—", description: "A horizontal line" },
  { type: "gallery", label: "Gallery", icon: "▦", description: "Multiple images" },
  { type: "video", label: "Video", icon: "▶", description: "Embedded video" },
  { type: "button", label: "Button", icon: "⬚", description: "A call-to-action button" },
  { type: "columns", label: "Columns", icon: "▥", description: "Two-column layout" },
  { type: "list", label: "List", icon: "☰", description: "Bullet or numbered list" },
  { type: "quote", label: "Quote", icon: "❝", description: "A blockquote" },
  { type: "countdown", label: "Countdown", icon: "⏱", description: "Countdown timer" },
  { type: "map", label: "Map", icon: "📍", description: "Embedded map" },
  { type: "rsvp-form", label: "RSVP Form", icon: "✓", description: "RSVP form block" },
  { type: "guest-list", label: "Guest List", icon: "👥", description: "Display guest list" },
  { type: "schedule", label: "Schedule", icon: "📅", description: "Event schedule" },
  { type: "venue", label: "Venue", icon: "🏛", description: "Venue information" },
  { type: "faq", label: "FAQ", icon: "?", description: "Frequently asked questions" },
];

export function createBlock(type: BlockType): Block {
  const defaults: Record<BlockType, Record<string, unknown>> = {
    heading: { text: "", level: "h2", align: "center" },
    paragraph: { html: "" },
    image: { url: "", alt: "", width: "full" },
    spacer: { height: 40 },
    divider: { style: "solid" },
    gallery: { images: [] },
    video: { url: "", title: "" },
    button: { text: "Click here", url: "", style: "primary" },
    columns: { left: "", right: "" },
    list: { items: [], ordered: false },
    quote: { text: "", author: "" },
    countdown: { targetDate: "" },
    map: { address: "", url: "" },
    "rsvp-form": { heading: "RSVP", submitText: "Send RSVP" },
    "guest-list": { title: "Guest List" },
    schedule: { title: "Schedule" },
    venue: { name: "", address: "", mapUrl: "" },
    faq: { items: [] },
  };
  return {
    id: crypto.randomUUID(),
    type,
    data: defaults[type] ?? {},
  };
}

export interface BlockContentProps {
  block: Block;
  className?: string;
}

export function BlockContent({ block, className }: BlockContentProps): React.ReactElement {
  const d = block.data;
  switch (block.type) {
    case "heading": {
      const level = (d.level as string) || "h2";
      const align = (d.align as string) || "center";
      const text = (d.text as string) || "";
      const Tag = (level === "h1" ? "h1" : level === "h3" ? "h3" : "h2") as keyof React.JSX.IntrinsicElements;
      return React.createElement(Tag, {
        className: cn("event-font", className),
        style: { textAlign: align as React.CSSProperties["textAlign"] },
        children: text || "Heading text",
      });
    }
    case "paragraph":
      return <RichTextContent html={(d.html as string) || ""} className={className} />;
    case "image":
      return d.url ? (
        <img
          src={d.url as string}
          alt={(d.alt as string) || ""}
          className={cn("w-full rounded-lg", className)}
        />
      ) : (
        <div className={cn("flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-dash-border bg-dash-bg text-dash-muted", className)}>
          Image placeholder
        </div>
      );
    case "spacer":
      return <div style={{ height: Number(d.height) || 40 }} className={className} />;
    case "divider":
      return <hr className={cn("border-dash-border my-4", className)} />;
    case "gallery": {
      const images = (d.images as { url: string; alt?: string }[]) || [];
      return images.length > 0 ? (
        <div className={cn("grid grid-cols-2 gap-2", className)}>
          {images.map((img, i) => (
            <img key={i} src={img.url} alt={img.alt ?? ""} className="w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className={cn("flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-dash-border bg-dash-bg text-dash-muted", className)}>
          Gallery placeholder
        </div>
      );
    }
    case "video":
      return d.url ? (
        <div className={cn("aspect-video w-full rounded-lg overflow-hidden", className)}>
          <iframe src={d.url as string} title={(d.title as string) || "Video"} className="h-full w-full" allowFullScreen />
        </div>
      ) : (
        <div className={cn("flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-dash-border bg-dash-bg text-dash-muted", className)}>
          Video placeholder
        </div>
      );
    case "button":
      return (
        <div className={cn("text-center", className)}>
          <button
            type="button"
            className={cn(
              "event-btn-primary",
              d.style === "secondary" && "event-btn-secondary",
            )}
            onClick={() => d.url && window.open(d.url as string, "_blank")}
          >
            {(d.text as string) || "Button"}
          </button>
        </div>
      );
    case "columns":
      return (
        <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2", className)}>
          <div><RichTextContent html={(d.left as string) || ""} /></div>
          <div><RichTextContent html={(d.right as string) || ""} /></div>
        </div>
      );
    case "list": {
      const items = (d.items as string[]) || [];
      const ordered = d.ordered as boolean;
      return ordered ? (
        <ol className={cn("list-decimal pl-6 space-y-1", className)}>
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      ) : (
        <ul className={cn("list-disc pl-6 space-y-1", className)}>
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    }
    case "quote":
      return (
        <blockquote className={cn("border-l-4 border-event-border pl-4 italic text-event-muted", className)}>
          "{(d.text as string) || "Quote text"}"
          {(d.author as string) && <footer className="mt-2 text-sm not-italic">— {d.author as string}</footer>}
        </blockquote>
      );
    case "countdown": {
      const target = d.targetDate as string;
      const c = getCountdown(target);
      return (
        <div className={cn("text-center", className)}>
          {!c.isPast ? (
            <div className="flex items-center justify-center gap-6">
              {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
                <div key={unit} className="text-center">
                  <div className="text-4xl font-bold event-font">{c[unit]}</div>
                  <div className="text-xs uppercase tracking-wider text-event-muted mt-1">
                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-event-muted">Countdown complete</p>
          )}
        </div>
      );
    }
    case "map":
      return d.url ? (
        <div className={cn("aspect-video w-full rounded-lg overflow-hidden", className)}>
          <iframe src={d.url as string} title="Map" className="h-full w-full" loading="lazy" />
        </div>
      ) : (
        <div className={cn("flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-dash-border bg-dash-bg text-dash-muted", className)}>
          Map placeholder
        </div>
      );
    case "rsvp-form":
      return (
        <div className={cn("event-card max-w-lg mx-auto", className)}>
          <h2 className="guest-title text-center">{(d.heading as string) || "RSVP"}</h2>
          <p className="guest-subtitle text-center mt-2">Will you be joining us?</p>
          <div className="mt-6 space-y-3">
            <input type="text" className="event-input" placeholder="Your name" readOnly />
            <div className="flex gap-2">
              <button className="event-btn-secondary flex-1">Accept</button>
              <button className="event-btn-secondary flex-1">Decline</button>
            </div>
            <button className="event-btn-primary w-full">{(d.submitText as string) || "Send RSVP"}</button>
          </div>
        </div>
      );
    case "guest-list":
      return (
        <div className={cn("text-center", className)}>
          <h2 className="guest-title">{(d.title as string) || "Guest List"}</h2>
          <p className="guest-subtitle mt-2">Guest list will appear here</p>
        </div>
      );
    case "schedule":
      return (
        <div className={cn("text-center", className)}>
          <h2 className="guest-title">{(d.title as string) || "Schedule"}</h2>
          <p className="guest-subtitle mt-2">Event schedule will appear here</p>
        </div>
      );
    case "venue":
      return (
        <div className={cn("event-info-card max-w-2xl mx-auto text-center", className)}>
          <p className="guest-eyebrow">Venue</p>
          <h3 className="guest-title">{(d.name as string) || "Venue name"}</h3>
          {(d.address as string) && <p className="guest-subtitle mt-2">{d.address as string}</p>}
        </div>
      );
    case "faq": {
      const items = (d.items as { question: string; answer: string }[]) || [];
      return items.length > 0 ? (
        <div className={cn("space-y-4 max-w-2xl mx-auto", className)}>
          {items.map((item, i) => (
            <div key={i} className="event-card">
              <h3 className="text-sm font-semibold text-event-heading">{item.question}</h3>
              <p className="mt-2 text-sm text-event-text">{item.answer}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn("text-center", className)}>
          <p className="text-event-muted">FAQ items will appear here</p>
        </div>
      );
    }
    default:
      return <div className={className}>Unknown block type</div>;
  }
}
