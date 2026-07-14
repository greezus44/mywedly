import type { Json } from "../../lib/supabase";

export type BlockType =
  | "heading"
  | "text"
  | "image"
  | "gallery"
  | "divider"
  | "button"
  | "spacer"
  | "video"
  | "quote";

export interface BlockContent {
  text?: string;
  level?: number;
  align?: string;
  url?: string | null;
  alt?: string;
  images?: string[];
  label?: string;
  href?: string;
  height?: number;
  caption?: string;
  embedUrl?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
  order_index: number;
}

export const BLOCK_TYPES: { type: BlockType; label: string; icon: string; description: string }[] = [
  { type: "heading", label: "Heading", icon: "H", description: "A section heading" },
  { type: "text", label: "Text", icon: "¶", description: "Rich text content" },
  { type: "image", label: "Image", icon: "🖼", description: "A single image" },
  { type: "gallery", label: "Gallery", icon: "▦", description: "Multiple images in a grid" },
  { type: "divider", label: "Divider", icon: "—", description: "A horizontal line" },
  { type: "button", label: "Button", icon: "⬜", description: "A clickable button" },
  { type: "spacer", label: "Spacer", icon: "↕", description: "Vertical spacing" },
  { type: "video", label: "Video", icon: "▶", description: "Embedded video" },
  { type: "quote", label: "Quote", icon: "❝", description: "A styled quote" },
];

export function createBlock(type: BlockType, orderIndex: number): Block {
  const id = crypto.randomUUID();
  const defaultContent: Record<BlockType, BlockContent> = {
    heading: { text: "", level: 2, align: "left" },
    text: { text: "", align: "left" },
    image: { url: "", alt: "" },
    gallery: { images: [] },
    divider: {},
    button: { label: "", href: "" },
    spacer: { height: 40 },
    video: { embedUrl: "" },
    quote: { text: "", caption: "" },
  };
  return {
    id,
    type,
    content: defaultContent[type],
    order_index: orderIndex,
  };
}

export function blocksToJson(blocks: Block[]): Json {
  return blocks.map((b) => ({
    id: b.id,
    type: b.type,
    content: b.content,
    order_index: b.order_index,
  })) as unknown as Json;
}

export function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return (json as unknown as Block[]).map((b) => ({
    id: b.id ?? crypto.randomUUID(),
    type: b.type ?? "text",
    content: b.content ?? {},
    order_index: b.order_index ?? 0,
  }));
}
