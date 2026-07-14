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
  | "quote";

export interface BlockContent {
  text?: string;
  html?: string;
  url?: string;
  alt?: string;
  caption?: string;
  images?: string[];
  label?: string;
  href?: string;
  variant?: string;
  height?: number;
  embed?: string;
  align?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
  order: number;
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
    defaultContent: { text: "New Heading", align: "left" },
  },
  {
    type: "paragraph",
    label: "Paragraph",
    icon: "¶",
    description: "A block of rich text",
    defaultContent: { html: "" },
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼",
    description: "A single image with optional caption",
    defaultContent: { url: "", alt: "", caption: "" },
  },
  {
    type: "gallery",
    label: "Gallery",
    icon: "🖼",
    description: "A grid of images",
    defaultContent: { images: [] },
  },
  {
    type: "button",
    label: "Button",
    icon: "🔘",
    description: "A clickable button link",
    defaultContent: { label: "Click Here", href: "", variant: "primary" },
  },
  {
    type: "divider",
    label: "Divider",
    icon: "—",
    description: "A horizontal divider line",
    defaultContent: {},
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: "␣",
    description: "Empty vertical space",
    defaultContent: { height: 32 },
  },
  {
    type: "video",
    label: "Video",
    icon: "🎬",
    description: "An embedded video (YouTube, Vimeo)",
    defaultContent: { embed: "", caption: "" },
  },
  {
    type: "quote",
    label: "Quote",
    icon: "❝",
    description: "A blockquote with attribution",
    defaultContent: { text: "", caption: "" },
  },
];

export function createBlock(type: BlockType, order: number): Block {
  const meta = BLOCK_TYPES.find((b) => b.type === type);
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    content: { ...(meta?.defaultContent ?? {}) },
    order,
  };
}

export function blocksToJson(blocks: Block[]): Json {
  return blocks.map((b) => ({
    id: b.id,
    type: b.type,
    content: b.content,
    order: b.order,
  })) as unknown as Json;
}

export function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return (json as Array<Record<string, unknown>>).map((item) => ({
    id: (item.id as string) ?? `block-${Math.random().toString(36).slice(2)}`,
    type: (item.type as BlockType) ?? "paragraph",
    content: (item.content as BlockContent) ?? {},
    order: (item.order as number) ?? 0,
  }));
}
