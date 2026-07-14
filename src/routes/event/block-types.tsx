import type { Json } from "../../lib/supabase";

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "divider"
  | "spacer"
  | "button"
  | "quote";

export interface BlockContent {
  text?: string;
  level?: 1 | 2 | 3;
  align?: "left" | "center" | "right";
  src?: string;
  alt?: string;
  width?: string;
  href?: string;
  label?: string;
  variant?: "primary" | "secondary";
  height?: number;
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
    description: "A section heading (H1, H2, or H3).",
    defaultContent: { text: "New Heading", level: 2, align: "left" },
  },
  {
    type: "paragraph",
    label: "Paragraph",
    icon: "¶",
    description: "A block of rich text content.",
    defaultContent: { text: "Write your text here...", align: "left" },
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼",
    description: "An image with optional caption.",
    defaultContent: { src: "", alt: "", width: "100%" },
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
    icon: "␣",
    description: "Empty vertical space.",
    defaultContent: { height: 32 },
  },
  {
    type: "button",
    label: "Button",
    icon: "🔘",
    description: "A clickable button with a link.",
    defaultContent: { label: "Click Here", href: "#", variant: "primary", align: "left" },
  },
  {
    type: "quote",
    label: "Quote",
    icon: "❝",
    description: "A styled blockquote.",
    defaultContent: { text: "A beautiful quote...", align: "center" },
  },
];

export function createBlock(type: BlockType): Block {
  const meta = BLOCK_TYPES.find((b) => b.type === type);
  if (!meta) throw new Error(`Unknown block type: ${type}`);
  return {
    id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    content: { ...meta.defaultContent },
  };
}

export function blocksToJson(blocks: Block[]): Json {
  return blocks as unknown as Json;
}

export function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as Block[];
}
