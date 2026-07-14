import React from "react";
import type { Json } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, getCountdown } from "../../lib/utils";

export interface Block {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
}

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

export interface BlockTypeMeta {
  type: BlockType;
  label: string;
  icon: string;
  defaultData: Record<string, unknown>;
}

export const BLOCK_TYPES: BlockTypeMeta[] = [
  { type: "heading", label: "Heading", icon: "H", defaultData: { text: "", level: 2 } },
  { type: "paragraph", label: "Paragraph", icon: "¶", defaultData: { text: "" } },
  { type: "image", label: "Image", icon: "🖼", defaultData: { url: "", alt: "", width: "full" } },
  { type: "spacer", label: "Spacer", icon: "␣", defaultData: { height: 32 } },
  { type: "divider", label: "Divider", icon: "—", defaultData: {} },
  { type: "gallery", label: "Gallery", icon: "▦", defaultData: { images: [], columns: 3 } },
  { type: "video", label: "Video", icon: "▶", defaultData: { url: "", caption: "" } },
  { type: "button", label: "Button", icon: "⬚", defaultData: { text: "", url: "", style: "primary" } },
  { type: "columns", label: "Columns", icon: "▥", defaultData: { left: "", right: "" } },
  { type: "list", label: "List", icon: "☰", defaultData: { items: [], ordered: false } },
  { type: "quote", label: "Quote", icon: "❝", defaultData: { text: "", author: "" } },
  { type: "countdown", label: "Countdown", icon: "⏰", defaultData: { targetDate: "" } },
  { type: "map", label: "Map", icon: "📍", defaultData: { address: "", zoom: 15 } },
  { type: "rsvp-form", label: "RSVP Form", icon: "✓", defaultData: {} },
  { type: "guest-list", label: "Guest List", icon: "👥", defaultData: {} },
  { type: "schedule", label: "Schedule", icon: "📅", defaultData: {} },
  { type: "venue", label: "Venue", icon: "🏛", defaultData: { name: "", address: "" } },
  { type: "faq", label: "FAQ", icon: "?", defaultData: { items: [] } },
];

export function createBlock(type: BlockType): Block {
  const meta = BLOCK_TYPES.find((b) => b.type === type);
  return {
    id: crypto.randomUUID(),
    type,
    data: meta ? { ...meta.defaultData } : {},
  };
}

export function BlockContent({
  block,
}: {
  block: Block;
}) {
  const d = block.data;

  switch (block.type) {
    case "heading": {
      const level = (d.level as number) || 2;
      const text = (d.text as string) || "";
      const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
      return <Tag className="text-event-heading font-bold">{text}</Tag>;
    }

    case "paragraph":
      return <RichTextContent html={(d.text as string) || ""} />;

    case "image":
      return d.url ? (
        <img
          src={d.url as string}
          alt={(d.alt as string) || ""}
          className="w-full rounded-lg"
        />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dash-border bg-dash-bg text-sm text-dash-muted">
          No image
        </div>
      );

    case "spacer":
      return <div style={{ height: (d.height as number) || 32 }} />;

    case "divider":
      return <hr className="border-event-border" />;

    case "gallery": {
      const images = (d.images as string[]) || [];
      const columns = (d.columns as number) || 3;
      return images.length > 0 ? (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {images.map((url, i) => (
            <img key={i} src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />
          ))}
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dash-border bg-dash-bg text-sm text-dash-muted">
          No images in gallery
        </div>
      );
    }

    case "video":
      return d.url ? (
        <div>
          <div className="aspect-video overflow-hidden rounded-lg">
            <iframe
              src={d.url as string}
              className="h-full w-full"
              title={(d.caption as string) || "Video"}
              allowFullScreen
            />
          </div>
          {(d.caption as string) && (
            <p className="mt-1 text-center text-sm text-event-muted">
              {d.caption as string}
            </p>
          )}
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dash-border bg-dash-bg text-sm text-dash-muted">
          No video URL
        </div>
      );

    case "button": {
      const style = (d.style as string) || "primary";
      return d.text && d.url ? (
        <a
          href={d.url as string}
          className={`inline-block rounded-md px-6 py-3 font-medium ${
            style === "primary"
              ? "bg-event-primary text-event-primary-fg"
              : "border border-event-border text-event-text"
          }`}
        >
          {d.text as string}
        </a>
      ) : (
        <div className="text-sm text-dash-muted">Button (no link)</div>
      );
    }

    case "columns":
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <RichTextContent html={(d.left as string) || ""} />
          </div>
          <div>
            <RichTextContent html={(d.right as string) || ""} />
          </div>
        </div>
      );

    case "list": {
      const items = (d.items as string[]) || [];
      const ordered = d.ordered as boolean;
      return items.length > 0 ? (
        ordered ? (
          <ol className="list-inside list-decimal space-y-1 text-event-text">
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-event-text">
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )
      ) : (
        <div className="text-sm text-dash-muted">Empty list</div>
      );
    }

    case "quote":
      return (
        <blockquote className="border-l-4 border-event-primary pl-4 italic text-event-text">
          <p>{(d.text as string) || ""}</p>
          {(d.author as string) && (
            <footer className="mt-2 text-sm text-event-muted">
              — {d.author as string}
            </footer>
          )}
        </blockquote>
      );

    case "countdown": {
      const target = d.targetDate as string;
      const countdown = getCountdown(target);
      return target ? (
        <div className="text-center">
          {countdown.isPast ? (
            <p className="text-event-muted">Event has passed</p>
          ) : (
            <div className="flex justify-center gap-4">
              {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
                <div key={unit} className="text-center">
                  <div className="text-3xl font-bold text-event-heading">
                    {countdown[unit]}
                  </div>
                  <div className="text-xs uppercase text-event-muted">
                    {unit}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-dash-muted">No date set</div>
      );
    }

    case "map":
      return d.address ? (
        <div className="overflow-hidden rounded-lg">
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(d.address as string)}&z=${d.zoom || 15}&output=embed`}
            className="h-64 w-full"
            title="Map"
          />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dash-border bg-dash-bg text-sm text-dash-muted">
          No address
        </div>
      );

    case "rsvp-form":
      return (
        <div className="rounded-lg border border-event-border p-4 text-center text-event-muted">
          RSVP form will appear here on the guest page
        </div>
      );

    case "guest-list":
      return (
        <div className="rounded-lg border border-event-border p-4 text-center text-event-muted">
          Guest list will appear here on the guest page
        </div>
      );

    case "schedule":
      return (
        <div className="rounded-lg border border-event-border p-4 text-center text-event-muted">
          Schedule will appear here on the guest page
        </div>
      );

    case "venue":
      return (
        <div className="rounded-lg border border-event-border p-4">
          {(d.name as string) && (
            <h3 className="text-lg font-semibold text-event-heading">
              {d.name as string}
            </h3>
          )}
          {(d.address as string) && (
            <p className="text-sm text-event-muted">{d.address as string}</p>
          )}
        </div>
      );

    case "faq": {
      const items = (d.items as { question: string; answer: string }[]) || [];
      return items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-event-border p-3">
              <h4 className="font-semibold text-event-heading">
                {item.question}
              </h4>
              <p className="mt-1 text-sm text-event-text">{item.answer}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-dash-muted">No FAQ items</div>
      );
    }

    default:
      return null;
  }
}
