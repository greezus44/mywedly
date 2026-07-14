import type { Json } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, cn } from "../../lib/utils";

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

export const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
  { type: "heading", label: "Heading", icon: "H" },
  { type: "paragraph", label: "Paragraph", icon: "¶" },
  { type: "image", label: "Image", icon: "🖼" },
  { type: "spacer", label: "Spacer", icon: "␣" },
  { type: "divider", label: "Divider", icon: "—" },
  { type: "gallery", label: "Gallery", icon: "▦" },
  { type: "video", label: "Video", icon: "▶" },
  { type: "button", label: "Button", icon: "⬚" },
  { type: "columns", label: "Columns", icon: "▥" },
  { type: "list", label: "List", icon: "☰" },
  { type: "quote", label: "Quote", icon: '"' },
  { type: "countdown", label: "Countdown", icon: "⏳" },
  { type: "map", label: "Map", icon: "📍" },
  { type: "rsvp-form", label: "RSVP Form", icon: "✉" },
  { type: "guest-list", label: "Guest List", icon: "👥" },
  { type: "schedule", label: "Schedule", icon: "📅" },
  { type: "venue", label: "Venue", icon: "🏛" },
  { type: "faq", label: "FAQ", icon: "?" },
];

export function createBlock(type: BlockType): Block {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const defaultData: Record<BlockType, Record<string, unknown>> = {
    heading: { text: "New Heading", level: "h2" },
    paragraph: { text: "Write your paragraph here..." },
    image: { url: "", alt: "" },
    spacer: { height: 40 },
    divider: {},
    gallery: { images: [] },
    video: { url: "" },
    button: { text: "Click here", url: "#" },
    columns: { columns: [{ text: "Column 1" }, { text: "Column 2" }] },
    list: { items: ["Item 1", "Item 2"] },
    quote: { text: "A memorable quote", author: "" },
    countdown: { target: "" },
    map: { address: "", zoom: 14 },
    "rsvp-form": {},
    "guest-list": {},
    schedule: {},
    venue: { name: "", address: "" },
    faq: { items: [{ question: "Question?", answer: "Answer." }] },
  };
  return { id, type, data: defaultData[type] };
}

interface BlockContentProps {
  block: Block;
}

export function BlockContent({ block }: BlockContentProps) {
  switch (block.type) {
    case "heading": {
      const level = (block.data.level as string) ?? "h2";
      const text = (block.data.text as string) ?? "";
      const Tag = level as "h1" | "h2" | "h3";
      return <Tag className="font-bold text-foreground">{text}</Tag>;
    }

    case "paragraph":
      return (
        <RichTextContent
          html={(block.data.text as string) ?? ""}
          className="text-sm text-foreground"
        />
      );

    case "image": {
      const url = block.data.url as string;
      const alt = (block.data.alt as string) ?? "";
      return url ? (
        <img src={url} alt={alt} className="max-w-full rounded-lg" />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-surface-alt text-muted">
          No image
        </div>
      );
    }

    case "spacer":
      return <div style={{ height: (block.data.height as number) ?? 40 }} />;

    case "divider":
      return <hr className="border-border" />;

    case "gallery": {
      const images = (block.data.images as string[]) ?? [];
      return images.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Gallery ${i + 1}`}
              className="h-24 w-full rounded-md object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-surface-alt text-muted text-sm">
          No images in gallery
        </div>
      );
    }

    case "video": {
      const url = block.data.url as string;
      return url ? (
        <div className="aspect-video overflow-hidden rounded-lg">
          <iframe
            src={url}
            className="h-full w-full"
            title="Video"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-surface-alt text-muted">
          No video URL
        </div>
      );
    }

    case "button": {
      const text = (block.data.text as string) ?? "Button";
      const url = (block.data.url as string) ?? "#";
      return (
        <a
          href={url}
          className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          {text}
        </a>
      );
    }

    case "columns": {
      const columns = (block.data.columns as { text: string }[]) ?? [];
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {columns.map((col, i) => (
            <div key={i} className="text-sm text-foreground">
              {col.text}
            </div>
          ))}
        </div>
      );
    }

    case "list": {
      const items = (block.data.items as string[]) ?? [];
      return (
        <ul className="list-disc pl-5 text-sm text-foreground">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }

    case "quote": {
      const text = (block.data.text as string) ?? "";
      const author = (block.data.author as string) ?? "";
      return (
        <blockquote className="border-l-4 border-primary pl-4 italic text-foreground">
          <p>{text}</p>
          {author && <p className="mt-1 text-sm text-muted">— {author}</p>}
        </blockquote>
      );
    }

    case "countdown": {
      const target = block.data.target as string;
      const days = target
        ? Math.max(
            0,
            Math.floor(
              (new Date(target).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
          )
        : 0;
      return (
        <div className="flex items-center justify-center gap-4 rounded-lg bg-surface-alt p-6">
          <div className="text-center">
            <span className="text-3xl font-bold text-primary">{days}</span>
            <p className="text-xs text-muted">days remaining</p>
          </div>
        </div>
      );
    }

    case "map": {
      const address = (block.data.address as string) ?? "";
      return address ? (
        <div className="overflow-hidden rounded-lg">
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=14&output=embed`}
            className="h-64 w-full"
            title="Map"
          />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-surface-alt text-muted">
          No address set
        </div>
      );
    }

    case "rsvp-form":
      return (
        <div className="rounded-lg border border-border bg-surface-alt p-4 text-center text-sm text-muted">
          RSVP Form (renders on guest page)
        </div>
      );

    case "guest-list":
      return (
        <div className="rounded-lg border border-border bg-surface-alt p-4 text-center text-sm text-muted">
          Guest List (renders on guest page)
        </div>
      );

    case "schedule":
      return (
        <div className="rounded-lg border border-border bg-surface-alt p-4 text-center text-sm text-muted">
          Schedule (renders on guest page)
        </div>
      );

    case "venue": {
      const name = (block.data.name as string) ?? "";
      const address = (block.data.address as string) ?? "";
      return (
        <div className="rounded-lg border border-border bg-surface p-4">
          {name && <h4 className="font-semibold text-foreground">{name}</h4>}
          {address && <p className="text-sm text-muted">{address}</p>}
        </div>
      );
    }

    case "faq": {
      const items =
        (block.data.items as { question: string; answer: string }[]) ?? [];
      return (
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-3">
              <p className="font-medium text-foreground">{item.question}</p>
              <p className="mt-1 text-sm text-muted">{item.answer}</p>
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
