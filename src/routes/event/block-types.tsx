import type { Json } from "../../lib/supabase";

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "divider"
  | "spacer"
  | "button"
  | "gallery"
  | "map"
  | "video"
  | "quote";

export interface BlockContent {
  text?: string;
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
  align?: "left" | "center" | "right";
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: number;
  href?: string;
  buttonText?: string;
  images?: string[];
  embedUrl?: string;
  caption?: string;
  spacing?: number;
}

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
}

export interface BlockTypeDef {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
  defaultContent: BlockContent;
}

export const BLOCK_TYPES: BlockTypeDef[] = [
  {
    type: "heading",
    label: "Heading",
    icon: "H",
    description: "A section heading or title.",
    defaultContent: { text: "New Heading", fontSize: 28, fontWeight: 700, align: "center" },
  },
  {
    type: "paragraph",
    label: "Text",
    icon: "¶",
    description: "A paragraph of rich text.",
    defaultContent: { text: "", align: "left" },
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼",
    description: "A single image.",
    defaultContent: { url: "", alt: "", align: "center" },
  },
  {
    type: "gallery",
    label: "Gallery",
    icon: "▦",
    description: "A grid of images.",
    defaultContent: { images: [] },
  },
  {
    type: "button",
    label: "Button",
    icon: "▭",
    description: "A clickable button with a link.",
    defaultContent: { buttonText: "Click here", href: "", align: "center" },
  },
  {
    type: "divider",
    label: "Divider",
    icon: "—",
    description: "A horizontal line separator.",
    defaultContent: {},
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: "⇕",
    description: "Empty vertical space.",
    defaultContent: { spacing: 32 },
  },
  {
    type: "quote",
    label: "Quote",
    icon: "❝",
    description: "A styled blockquote.",
    defaultContent: { text: "", caption: "", align: "center" },
  },
  {
    type: "map",
    label: "Map",
    icon: "📍",
    description: "An embedded map location.",
    defaultContent: { embedUrl: "", caption: "" },
  },
  {
    type: "video",
    label: "Video",
    icon: "▶",
    description: "An embedded video (YouTube/Vimeo).",
    defaultContent: { embedUrl: "", caption: "" },
  },
];

export function getBlockTypeDef(type: BlockType): BlockTypeDef | undefined {
  return BLOCK_TYPES.find((b) => b.type === type);
}

let blockIdCounter = 0;

export function createBlock(type: BlockType): Block {
  const def = getBlockTypeDef(type);
  return {
    id: `block-${Date.now()}-${blockIdCounter++}`,
    type,
    content: { ...(def?.defaultContent ?? {}) },
  };
}

export function blocksToJson(blocks: Block[]): Json {
  return blocks as unknown as Json;
}

export function parseBlocks(content: Json | null | undefined): Block[] {
  if (!content || typeof content !== "object") return [];
  const obj = content as { blocks?: unknown };
  if (!Array.isArray(obj.blocks)) return [];
  return obj.blocks as Block[];
}
