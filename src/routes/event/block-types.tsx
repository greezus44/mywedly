import type { Json } from "../../lib/supabase";

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "gallery"
  | "divider"
  | "button"
  | "spacer"
  | "quote"
  | "video"
  | "list";

export interface BlockContent {
  text?: string;
  level?: 1 | 2 | 3;
  align?: "left" | "center" | "right";
  url?: string;
  alt?: string;
  caption?: string;
  images?: string[];
  href?: string;
  label?: string;
  height?: number;
  videoUrl?: string;
  items?: string[];
  ordered?: boolean;
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
    description: "A section heading (H1, H2, or H3)",
    defaultContent: { text: "New Heading", level: 2, align: "left" },
  },
  {
    type: "paragraph",
    label: "Paragraph",
    icon: "¶",
    description: "A block of rich text content",
    defaultContent: { text: "", align: "left" },
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼",
    description: "A single image with optional caption",
    defaultContent: { url: "", alt: "", caption: "", align: "center" },
  },
  {
    type: "gallery",
    label: "Gallery",
    icon: "🖼",
    description: "A grid of multiple images",
    defaultContent: { images: [], caption: "" },
  },
  {
    type: "divider",
    label: "Divider",
    icon: "—",
    description: "A horizontal line separator",
    defaultContent: {},
  },
  {
    type: "button",
    label: "Button",
    icon: "▢",
    description: "A clickable button with a link",
    defaultContent: { label: "Click Here", href: "", align: "center" },
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: "↕",
    description: "Empty vertical space",
    defaultContent: { height: 40 },
  },
  {
    type: "quote",
    label: "Quote",
    icon: "❝",
    description: "A blockquote with attribution",
    defaultContent: { text: "", align: "center" },
  },
  {
    type: "video",
    label: "Video",
    icon: "▶",
    description: "An embedded video (YouTube, Vimeo)",
    defaultContent: { videoUrl: "", caption: "" },
  },
  {
    type: "list",
    label: "List",
    icon: "•",
    description: "An ordered or unordered list",
    defaultContent: { items: [], ordered: false },
  },
];

export function createBlock(type: BlockType): Block {
  const meta = BLOCK_TYPES.find((b) => b.type === type);
  const content = meta ? { ...meta.defaultContent } : {};
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    type,
    content,
  };
}

export function blocksToJson(blocks: Block[]): Json {
  return blocks as unknown as Json;
}

export function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || typeof json !== "object" || Array.isArray(json)) return [];
  if (Array.isArray(json)) return json as unknown as Block[];
  // If it's an object, check if it has a blocks array
  const obj = json as Record<string, unknown>;
  if (Array.isArray(obj.blocks)) return obj.blocks as unknown as Block[];
  return [];
}
