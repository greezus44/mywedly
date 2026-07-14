import type { Json } from "../../lib/supabase";

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "gallery"
  | "button"
  | "divider"
  | "spacer"
  | "video"
  | "quote"
  | "list";

export interface BlockContent {
  text?: string;
  level?: 1 | 2 | 3;
  src?: string;
  alt?: string;
  images?: string[];
  url?: string;
  label?: string;
  height?: number;
  align?: "left" | "center" | "right";
  items?: string[];
  videoUrl?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
}

export interface BlockTypeMeta {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
  defaultContent: BlockContent;
}

export const BLOCK_TYPES: BlockTypeMeta[] = [
  {
    type: "heading",
    label: "Heading",
    icon: "H",
    description: "A section heading",
    defaultContent: { text: "New Heading", level: 2, align: "left" },
  },
  {
    type: "paragraph",
    label: "Paragraph",
    icon: "¶",
    description: "A block of text",
    defaultContent: { text: "Write something here...", align: "left" },
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼",
    description: "A single image",
    defaultContent: { src: "", alt: "", align: "center" },
  },
  {
    type: "gallery",
    label: "Gallery",
    icon: "▦",
    description: "Multiple images in a grid",
    defaultContent: { images: [], align: "center" },
  },
  {
    type: "button",
    label: "Button",
    icon: "◉",
    description: "A clickable button link",
    defaultContent: { label: "Click Here", url: "", align: "center" },
  },
  {
    type: "divider",
    label: "Divider",
    icon: "—",
    description: "A horizontal line",
    defaultContent: {},
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: "⇕",
    description: "Vertical spacing",
    defaultContent: { height: 40 },
  },
  {
    type: "video",
    label: "Video",
    icon: "▶",
    description: "Embed a video URL",
    defaultContent: { videoUrl: "", align: "center" },
  },
  {
    type: "quote",
    label: "Quote",
    icon: "❝",
    description: "A styled quote block",
    defaultContent: { text: "A memorable quote", align: "center" },
  },
  {
    type: "list",
    label: "List",
    icon: "☰",
    description: "A bulleted list",
    defaultContent: { items: ["First item", "Second item"], align: "left" },
  },
];

export function createBlock(type: BlockType): Block {
  const meta = BLOCK_TYPES.find((b) => b.type === type);
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    content: { ...(meta?.defaultContent ?? {}) },
  };
}

export function blocksToJson(blocks: Block[]): Json {
  return blocks as unknown as Json;
}

export function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as Block[];
}
