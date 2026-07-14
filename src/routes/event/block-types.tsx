import React from "react";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";
import { cn } from "../../lib/utils";

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
  props: Record<string, unknown>;
}

export const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
  { type: "heading", label: "Heading", icon: "H" },
  { type: "paragraph", label: "Paragraph", icon: "¶" },
  { type: "image", label: "Image", icon: "🖼" },
  { type: "spacer", label: "Spacer", icon: "␣" },
  { type: "divider", label: "Divider", icon: "—" },
  { type: "gallery", label: "Gallery", icon: "▦" },
  { type: "video", label: "Video", icon: "▶" },
  { type: "button", label: "Button", icon: "▢" },
  { type: "columns", label: "Columns", icon: "▥" },
  { type: "list", label: "List", icon: "☰" },
  { type: "quote", label: "Quote", icon: "❝" },
  { type: "countdown", label: "Countdown", icon: "⏰" },
  { type: "map", label: "Map", icon: "📍" },
  { type: "rsvp-form", label: "RSVP Form", icon: "✓" },
  { type: "guest-list", label: "Guest List", icon: "👥" },
  { type: "schedule", label: "Schedule", icon: "📅" },
  { type: "venue", label: "Venue", icon: "🏛" },
  { type: "faq", label: "FAQ", icon: "?" },
];

export function createBlock(type: BlockType): Block {
  const defaults: Record<BlockType, Record<string, unknown>> = {
    heading: { text: "", level: "h2", align: "left" },
    paragraph: { text: "", align: "left" },
    image: { url: "", alt: "", width: "full" },
    spacer: { height: 32 },
    divider: { style: "solid" },
    gallery: { images: [], columns: 3 },
    video: { url: "", autoplay: false },
    button: { label: "Click here", url: "", style: "primary" },
    columns: { count: 2, content: ["", ""] },
    list: { items: [], ordered: false },
    quote: { text: "", author: "" },
    countdown: { targetDate: "", label: "" },
    map: { address: "", zoom: 15 },
    "rsvp-form": { title: "RSVP", description: "" },
    "guest-list": { title: "Guest List" },
    schedule: { title: "Schedule" },
    venue: { name: "", address: "", mapUrl: "" },
    faq: { items: [{ question: "", answer: "" }] },
  };

  return {
    id: crypto.randomUUID(),
    type,
    props: defaults[type] ?? {},
  };
}

export function BlockContent({ block }: { block: Block }) {
  const p = block.props;

  switch (block.type) {
    case "heading": {
      const Tag = (p.level as string) || "h2";
      const align = ((p.align as string) || "left") as React.CSSProperties["textAlign"];
      return React.createElement(Tag, {
        style: { textAlign: align },
        className: "font-bold",
        children: (p.text as string) || "Heading text",
      });
    }

    case "paragraph":
      return (
        <div style={{ textAlign: ((p.align as string) || "left") as React.CSSProperties["textAlign"] }}>
          <RichTextContent html={(p.text as string) || "Paragraph text..."} />
        </div>
      );

    case "image":
      return p.url ? (
        <img
          src={p.url as string}
          alt={(p.alt as string) || ""}
          className={cn("rounded-lg", p.width === "full" ? "w-full" : "mx-auto max-w-md")}
        />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dash-border bg-dash-bg text-sm text-dash-muted">
          Image placeholder
        </div>
      );

    case "spacer":
      return <div style={{ height: (p.height as number) || 32 }} />;

    case "divider":
      return <hr className={cn("border-dash-border", p.style === "dashed" && "border-dashed")} />;

    case "gallery": {
      const images = (p.images as string[]) || [];
      const cols = (p.columns as number) || 3;
      if (images.length === 0) {
        return (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dash-border bg-dash-bg text-sm text-dash-muted">
            Gallery placeholder
          </div>
        );
      }
      return (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {images.map((url, i) => (
            <img key={i} src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />
          ))}
        </div>
      );
    }

    case "video":
      return p.url ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <iframe
            src={p.url as string}
            className="h-full w-full"
            allow="autoplay; fullscreen"
            allowFullScreen
            title="Video"
          />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dash-border bg-dash-bg text-sm text-dash-muted">
          Video placeholder
        </div>
      );

    case "button":
      return (
        <div className="py-2">
          <a
            href={(p.url as string) || "#"}
            className={cn(
              "inline-block rounded-md px-6 py-2.5 font-medium transition-colors",
              p.style === "secondary"
                ? "border border-dash-border text-dash-text"
                : "bg-dash-primary text-dash-primary-fg"
            )}
          >
            {(p.label as string) || "Button"}
          </a>
        </div>
      );

    case "columns": {
      const content = (p.content as string[]) || [];
      const count = (p.count as number) || 2;
      return (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}
        >
          {content.map((html, i) => (
            <div key={i}>
              <RichTextContent html={html} />
            </div>
          ))}
        </div>
      );
    }

    case "list": {
      const items = (p.items as string[]) || [];
      const ordered = p.ordered as boolean;
      const Tag = ordered ? "ol" : "ul";
      return (
        <Tag className={cn("pl-6", ordered ? "list-decimal" : "list-disc")}>
          {items.length > 0 ? (
            items.map((item, i) => <li key={i}>{item as string}</li>)
          ) : (
            <li className="text-dash-muted">List item</li>
          )}
        </Tag>
      );
    }

    case "quote":
      return (
        <blockquote className="border-l-4 border-dash-border pl-4 italic text-dash-muted">
          <p>{(p.text as string) || "Quote text..."}</p>
          {(p.author as string) && <footer className="mt-2 text-sm">— {p.author as string}</footer>}
        </blockquote>
      );

    case "countdown": {
      const target = p.targetDate as string;
      const countdown = getCountdown(target);
      if (countdown.isPast) {
        return (
          <div className="rounded-lg bg-dash-bg p-4 text-center text-sm text-dash-muted">
            {p.label as string || "Event day has arrived!"}
          </div>
        );
      }
      return (
        <div className="rounded-lg bg-dash-bg p-4 text-center">
          {(p.label as string) && <p className="mb-2 text-sm text-dash-muted">{p.label as string}</p>}
          <div className="flex justify-center gap-4">
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <div key={unit}>
                <div className="text-2xl font-bold text-dash-text">
                  {countdown[unit]}
                </div>
                <div className="text-xs capitalize text-dash-muted">{unit}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "map":
      return p.address ? (
        <div className="overflow-hidden rounded-lg">
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(p.address as string)}&z=${p.zoom ?? 15}&output=embed`}
            className="h-64 w-full"
            title="Map"
          />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dash-border bg-dash-bg text-sm text-dash-muted">
          Map placeholder
        </div>
      );

    case "rsvp-form":
      return (
        <div className="rounded-lg border border-dash-border bg-dash-surface p-6">
          <h3 className="text-lg font-semibold">{(p.title as string) || "RSVP"}</h3>
          {(p.description as string) && <p className="mt-1 text-sm text-dash-muted">{p.description as string}</p>}
          <div className="mt-4 flex flex-col gap-3">
            <input className="rounded-md border border-dash-border px-3 py-2" placeholder="Your name" disabled />
            <div className="flex gap-2">
              <button className="flex-1 rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg" disabled>
                Attending
              </button>
              <button className="flex-1 rounded-md border border-dash-border px-4 py-2 text-sm font-medium" disabled>
                Not Attending
              </button>
            </div>
          </div>
        </div>
      );

    case "guest-list":
      return (
        <div className="rounded-lg border border-dash-border bg-dash-surface p-6">
          <h3 className="text-lg font-semibold">{(p.title as string) || "Guest List"}</h3>
          <p className="mt-1 text-sm text-dash-muted">Guest list will be displayed here.</p>
        </div>
      );

    case "schedule":
      return (
        <div className="rounded-lg border border-dash-border bg-dash-surface p-6">
          <h3 className="text-lg font-semibold">{(p.title as string) || "Schedule"}</h3>
          <p className="mt-1 text-sm text-dash-muted">Event schedule will be displayed here.</p>
        </div>
      );

    case "venue":
      return (
        <div className="rounded-lg border border-dash-border bg-dash-surface p-6">
          <h3 className="text-lg font-semibold">{(p.name as string) || "Venue Name"}</h3>
          {(p.address as string) && <p className="mt-1 text-sm text-dash-muted">{p.address as string}</p>}
        </div>
      );

    case "faq": {
      const items = (p.items as { question: string; answer: string }[]) || [];
      return (
        <div className="flex flex-col gap-3">
          {items.length > 0 ? (
            items.map((item, i) => (
              <div key={i} className="rounded-lg border border-dash-border bg-dash-surface p-4">
                <h4 className="font-semibold text-dash-text">{item.question || "Question"}</h4>
                <p className="mt-1 text-sm text-dash-muted">{item.answer || "Answer"}</p>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
              <h4 className="font-semibold text-dash-text">Question</h4>
              <p className="mt-1 text-sm text-dash-muted">Answer</p>
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}
