import type { Json } from "../../lib/supabase";

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

export interface BlockContent {
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
  { type: "spacer", label: "Spacer", icon: "␣", description: "Vertical spacing" },
  { type: "divider", label: "Divider", icon: "—", description: "A horizontal line" },
  { type: "gallery", label: "Gallery", icon: "▦", description: "Image gallery grid" },
  { type: "video", label: "Video", icon: "▶", description: "Embedded video" },
  { type: "button", label: "Button", icon: "⬚", description: "Call-to-action button" },
  { type: "columns", label: "Columns", icon: "▦", description: "Multi-column layout" },
  { type: "list", label: "List", icon: "☰", description: "Bulleted or numbered list" },
  { type: "quote", label: "Quote", icon: "❝", description: "A blockquote" },
  { type: "countdown", label: "Countdown", icon: "⏱", description: "Countdown timer" },
  { type: "map", label: "Map", icon: "📍", description: "Location map" },
  { type: "rsvp-form", label: "RSVP Form", icon: "✓", description: "RSVP form for guests" },
  { type: "guest-list", label: "Guest List", icon: "👥", description: "List of guests" },
  { type: "schedule", label: "Schedule", icon: "📅", description: "Event schedule" },
  { type: "venue", label: "Venue", icon: "🏛", description: "Venue information" },
  { type: "faq", label: "FAQ", icon: "?", description: "Frequently asked questions" },
];

export function createBlock(type: BlockType): BlockContent {
  return {
    id: crypto.randomUUID(),
    type,
    data: defaultBlockData(type),
  };
}

function defaultBlockData(type: BlockType): Record<string, unknown> {
  switch (type) {
    case "heading": return { text: "New Heading", level: 2, align: "center" };
    case "paragraph": return { html: "" };
    case "image": return { url: "", alt: "", width: "full" };
    case "spacer": return { height: 40 };
    case "divider": return { style: "solid" };
    case "gallery": return { images: [] as string[], columns: 3 };
    case "video": return { url: "", title: "" };
    case "button": return { text: "Click Here", url: "", style: "primary" };
    case "columns": return { columns: [{ html: "" }, { html: "" }] };
    case "list": return { items: ["Item 1", "Item 2"], ordered: false };
    case "quote": return { text: "", author: "" };
    case "countdown": return { targetDate: "", label: "" };
    case "map": return { address: "", zoom: 15 };
    case "rsvp-form": return { title: "RSVP" };
    case "guest-list": return { title: "Guests" };
    case "schedule": return { title: "Schedule" };
    case "venue": return { name: "", address: "", mapUrl: "" };
    case "faq": return { items: [{ question: "", answer: "" }] };
    default: return {};
  }
}

export function blocksToJson(blocks: BlockContent[]): Json {
  return blocks as unknown as Json;
}

export function jsonToBlocks(json: Json | null | undefined): BlockContent[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as BlockContent[];
}
