import type { Json } from "../../lib/supabase";

export type BlockType =
  | "heading" | "paragraph" | "image" | "spacer" | "divider"
  | "gallery" | "video" | "button" | "columns" | "list"
  | "quote" | "countdown" | "map" | "rsvp-form"
  | "guest-list" | "schedule" | "venue" | "faq";

export interface BlockContent {
  text?: string;
  html?: string;
  level?: number;
  url?: string;
  alt?: string;
  images?: string[];
  height?: number;
  label?: string;
  href?: string;
  columns?: BlockContent[];
  items?: string[];
  targetDate?: string;
  address?: string;
  zoom?: number;
  questions?: { question: string; answer: string }[];
  title?: string;
  description?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
}

export const BLOCK_TYPES: Array<{ type: BlockType; label: string; icon: string }> = [
  { type: "heading", label: "Heading", icon: "H" },
  { type: "paragraph", label: "Paragraph", icon: "¶" },
  { type: "image", label: "Image", icon: "🖼" },
  { type: "spacer", label: "Spacer", icon: "↕" },
  { type: "divider", label: "Divider", icon: "—" },
  { type: "gallery", label: "Gallery", icon: "▦" },
  { type: "video", label: "Video", icon: "▶" },
  { type: "button", label: "Button", icon: "⬚" },
  { type: "columns", label: "Columns", icon: "▥" },
  { type: "list", label: "List", icon: "•" },
  { type: "quote", label: "Quote", icon: '"' },
  { type: "countdown", label: "Countdown", icon: "⏱" },
  { type: "map", label: "Map", icon: "📍" },
  { type: "rsvp-form", label: "RSVP Form", icon: "✓" },
  { type: "guest-list", label: "Guest List", icon: "👥" },
  { type: "schedule", label: "Schedule", icon: "📅" },
  { type: "venue", label: "Venue", icon: "🏛" },
  { type: "faq", label: "FAQ", icon: "?" },
];

export function createBlock(type: BlockType): Block {
  const defaults: Record<BlockType, BlockContent> = {
    heading: { text: "New Heading", level: 2 },
    paragraph: { text: "New paragraph text." },
    image: { url: "", alt: "" },
    spacer: { height: 32 },
    divider: {},
    gallery: { images: [] },
    video: { url: "" },
    button: { label: "Click here", href: "#" },
    columns: { columns: [{ text: "Column 1" }, { text: "Column 2" }] },
    list: { items: ["First item", "Second item"] },
    quote: { text: "A memorable quote." },
    countdown: { targetDate: new Date(Date.now() + 86400000 * 30).toISOString() },
    map: { address: "", zoom: 14 },
    "rsvp-form": {},
    "guest-list": {},
    schedule: {},
    venue: { title: "", address: "" },
    faq: { questions: [{ question: "Question?", answer: "Answer." }] },
  };
  return { id: crypto.randomUUID(), type, content: defaults[type] ?? {} };
}

export function blocksToJson(blocks: Block[]): Json {
  return blocks as unknown as Json;
}

export function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as Block[];
}
