import { type ReactNode } from "react";
import type { Json } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
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

export interface BlockTypeDef {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
  defaultProps: Record<string, unknown>;
}

export const BLOCK_TYPES: BlockTypeDef[] = [
  {
    type: "heading",
    label: "Heading",
    icon: "H",
    description: "A section heading",
    defaultProps: { text: "Heading", level: "h2", align: "center" },
  },
  {
    type: "paragraph",
    label: "Paragraph",
    icon: "¶",
    description: "Rich text paragraph",
    defaultProps: { html: "" },
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼",
    description: "A single image",
    defaultProps: { src: "", alt: "", width: "full", rounded: true },
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: "↕",
    description: "Vertical spacing",
    defaultProps: { height: 48 },
  },
  {
    type: "divider",
    label: "Divider",
    icon: "—",
    description: "Horizontal line",
    defaultProps: { style: "solid" },
  },
  {
    type: "gallery",
    label: "Gallery",
    icon: "▦",
    description: "Image gallery grid",
    defaultProps: { images: [], columns: 3 },
  },
  {
    type: "video",
    label: "Video",
    icon: "▶",
    description: "Embedded video",
    defaultProps: { url: "", autoplay: false },
  },
  {
    type: "button",
    label: "Button",
    icon: "▢",
    description: "Call to action button",
    defaultProps: { text: "Click here", url: "", style: "primary" },
  },
  {
    type: "columns",
    label: "Columns",
    icon: "▥",
    description: "Multi-column layout",
    defaultProps: { columns: 2, items: [] },
  },
  {
    type: "list",
    label: "List",
    icon: "•",
    description: "Bullet or numbered list",
    defaultProps: { items: [], ordered: false },
  },
  {
    type: "quote",
    label: "Quote",
    icon: "❝",
    description: "Blockquote",
    defaultProps: { text: "", author: "" },
  },
  {
    type: "countdown",
    label: "Countdown",
    icon: "⏰",
    description: "Countdown timer",
    defaultProps: { targetDate: "" },
  },
  {
    type: "map",
    label: "Map",
    icon: "📍",
    description: "Embedded map",
    defaultProps: { address: "", query: "" },
  },
  {
    type: "rsvp-form",
    label: "RSVP Form",
    icon: "✓",
    description: "RSVP form embed",
    defaultProps: {},
  },
  {
    type: "guest-list",
    label: "Guest List",
    icon: "👥",
    description: "Guest list display",
    defaultProps: {},
  },
  {
    type: "schedule",
    label: "Schedule",
    icon: "📅",
    description: "Event schedule embed",
    defaultProps: {},
  },
  {
    type: "venue",
    label: "Venue",
    icon: "🏛",
    description: "Venue information",
    defaultProps: { name: "", address: "", image: "" },
  },
  {
    type: "faq",
    label: "FAQ",
    icon: "?",
    description: "Frequently asked questions",
    defaultProps: { items: [] },
  },
];

export function createBlock(type: BlockType): Block {
  const def = BLOCK_TYPES.find((b) => b.type === type);
  return {
    id: crypto.randomUUID(),
    type,
    props: def ? { ...def.defaultProps } : {},
  };
}

interface BlockContentProps {
  block: Block;
  className?: string;
}

export function BlockContent({ block, className }: BlockContentProps): ReactNode {
  const { props } = block;

  switch (block.type) {
    case "heading": {
      const text = (props.text as string) ?? "";
      const level = (props.level as string) ?? "h2";
      const align = (props.align as string) ?? "center";
      const alignClass =
        align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";
      const Tag = (level as keyof JSX.IntrinsicElements) ?? "h2";
      return (
        <div className={cn("guest-section-tight", alignClass, className)}>
          <Tag className="guest-title">{text}</Tag>
        </div>
      );
    }

    case "paragraph": {
      const html = (props.html as string) ?? "";
      return <RichTextContent html={html} className={cn("guest-section-tight", className)} />;
    }

    case "image": {
      const src = (props.src as string) ?? "";
      const alt = (props.alt as string) ?? "";
      const rounded = (props.rounded as boolean) ?? true;
      if (!src) {
        return (
          <div className="flex items-center justify-center bg-dash-bg p-8 text-sm text-dash-muted">
            No image selected
          </div>
        );
      }
      return (
        <div className={cn("guest-section-tight", className)}>
          <img
            src={src}
            alt={alt}
            className={cn("w-full", rounded && "rounded-lg")}
          />
        </div>
      );
    }

    case "spacer": {
      const height = (props.height as number) ?? 48;
      return <div style={{ height }} className={className} />;
    }

    case "divider": {
      return <hr className="border-dash-border" />;
    }

    case "gallery": {
      const images = (props.images as string[]) ?? [];
      const columns = (props.columns as number) ?? 3;
      if (images.length === 0) {
        return (
          <div className="p-4 text-center text-sm text-dash-muted">
            No images in gallery
          </div>
        );
      }
      return (
        <div
          className={cn("grid gap-2", className)}
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {images.map((src, i) => (
            <img key={i} src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
          ))}
        </div>
      );
    }

    case "video": {
      const url = (props.url as string) ?? "";
      if (!url) {
        return (
          <div className="p-4 text-center text-sm text-dash-muted">
            No video URL
          </div>
        );
      }
      const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
      if (isYouTube) {
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
        return (
          <div className={cn("aspect-video w-full", className)}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="h-full w-full rounded-lg"
              allowFullScreen
            />
          </div>
        );
      }
      return (
        <video src={url} controls className="w-full rounded-lg" />
      );
    }

    case "button": {
      const text = (props.text as string) ?? "Click here";
      const url = (props.url as string) ?? "#";
      const style = (props.style as string) ?? "primary";
      return (
        <div className={cn("text-center", className)}>
          <a
            href={url}
            className={cn(
              "inline-block px-6 py-3 font-medium transition-colors",
              style === "primary"
                ? "bg-dash-primary text-dash-primary-fg rounded-lg hover:bg-dash-primary-hover"
                : "border border-dash-border text-dash-text rounded-lg hover:bg-dash-bg"
            )}
          >
            {text}
          </a>
        </div>
      );
    }

    case "columns": {
      const items = (props.items as string[]) ?? [];
      const colCount = (props.columns as number) ?? 2;
      return (
        <div
          className={cn("grid gap-4", className)}
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
        >
          {items.map((item, i) => (
            <RichTextContent key={i} html={item} />
          ))}
        </div>
      );
    }

    case "list": {
      const items = (props.items as string[]) ?? [];
      const ordered = (props.ordered as boolean) ?? false;
      const Tag = ordered ? "ol" : "ul";
      return (
        <div className={cn("rich-content", className)}>
          <Tag className={ordered ? "list-decimal" : "list-disc"}>
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </Tag>
        </div>
      );
    }

    case "quote": {
      const text = (props.text as string) ?? "";
      const author = (props.author as string) ?? "";
      return (
        <blockquote className={cn("rich-content border-l-4 pl-4 italic text-dash-muted", className)}>
          {text}
          {author && <footer className="mt-2 text-sm">— {author}</footer>}
        </blockquote>
      );
    }

    case "countdown": {
      const targetDate = (props.targetDate as string) ?? "";
      if (!targetDate) return null;
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return <p className="text-center text-dash-muted">Event has passed</p>;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return (
        <div className={cn("flex justify-center gap-4", className)}>
          {[
            { label: "Days", value: days },
            { label: "Hours", value: hours },
            { label: "Minutes", value: mins },
          ].map((item) => (
            <div key={item.label} className="event-info-card min-w-[72px] text-center">
              <div className="text-2xl font-bold text-dash-primary">
                {String(item.value).padStart(2, "0")}
              </div>
              <div className="text-xs text-dash-muted">{item.label}</div>
            </div>
          ))}
        </div>
      );
    }

    case "map": {
      const query = (props.query as string) ?? (props.address as string) ?? "";
      if (!query) return null;
      return (
        <iframe
          src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
          className={cn("h-64 w-full rounded-lg", className)}
        />
      );
    }

    case "rsvp-form":
      return (
        <div className={cn("rounded-lg border border-dash-border bg-dash-bg p-4 text-center text-sm text-dash-muted", className)}>
          [RSVP Form — visible to guests]
        </div>
      );

    case "guest-list":
      return (
        <div className={cn("rounded-lg border border-dash-border bg-dash-bg p-4 text-center text-sm text-dash-muted", className)}>
          [Guest List — visible to guests]
        </div>
      );

    case "schedule":
      return (
        <div className={cn("rounded-lg border border-dash-border bg-dash-bg p-4 text-center text-sm text-dash-muted", className)}>
          [Schedule — visible to guests]
        </div>
      );

    case "venue": {
      const name = (props.name as string) ?? "";
      const address = (props.address as string) ?? "";
      const image = (props.image as string) ?? "";
      return (
        <div className={cn("event-info-card", className)}>
          {image && (
            <img src={image} alt={name} className="mb-3 w-full rounded-lg" />
          )}
          {name && <h3 className="font-semibold text-dash-text">{name}</h3>}
          {address && <p className="text-sm text-dash-muted">{address}</p>}
        </div>
      );
    }

    case "faq": {
      const items = (props.items as { question: string; answer: string }[]) ?? [];
      return (
        <div className={cn("space-y-3", className)}>
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-dash-border p-4">
              <h4 className="font-semibold text-dash-text">{item.question}</h4>
              <p className="mt-1 text-sm text-dash-muted">{item.answer}</p>
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}

export function blocksToJson(blocks: Block[]): Json {
  return blocks as unknown as Json;
}

export function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as Block[];
}
