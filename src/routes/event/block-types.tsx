import type { Json } from "../../lib/supabase";

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "button"
  | "divider"
  | "spacer"
  | "gallery"
  | "video"
  | "quote"
  | "list";

export interface BlockContent {
  text?: string;
  level?: number;
  align?: "left" | "center" | "right";
  src?: string;
  alt?: string;
  width?: string;
  href?: string;
  variant?: "primary" | "secondary";
  height?: number;
  items?: string[];
  images?: string[];
  caption?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
}

export const BLOCK_TYPES: { type: BlockType; label: string; icon: string; description: string }[] = [
  { type: "heading", label: "Heading", icon: "H", description: "A section heading" },
  { type: "paragraph", label: "Paragraph", icon: "¶", description: "A block of text" },
  { type: "image", label: "Image", icon: "🖼", description: "A single image" },
  { type: "button", label: "Button", icon: "⬚", description: "A call-to-action button" },
  { type: "divider", label: "Divider", icon: "—", description: "A horizontal line" },
  { type: "spacer", label: "Spacer", icon: "⇕", description: "Vertical spacing" },
  { type: "gallery", label: "Gallery", icon: "▦", description: "Multiple images" },
  { type: "video", label: "Video", icon: "▶", description: "Embedded video URL" },
  { type: "quote", label: "Quote", icon: "❝", description: "A styled quote" },
  { type: "list", label: "List", icon: "☰", description: "A bulleted list" },
];

export function createBlock(type: BlockType): Block {
  const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const content: BlockContent = {};
  switch (type) {
    case "heading":
      content.text = "New Heading";
      content.level = 2;
      content.align = "left";
      break;
    case "paragraph":
      content.text = "Write your text here...";
      content.align = "left";
      break;
    case "image":
      content.src = "";
      content.alt = "";
      content.width = "100%";
      break;
    case "button":
      content.text = "Click here";
      content.href = "";
      content.variant = "primary";
      break;
    case "divider":
      break;
    case "spacer":
      content.height = 40;
      break;
    case "gallery":
      content.images = [];
      break;
    case "video":
      content.src = "";
      break;
    case "quote":
      content.text = "A memorable quote";
      content.caption = "";
      break;
    case "list":
      content.items = ["First item", "Second item"];
      break;
  }
  return { id, type, content };
}

export function blocksToJson(blocks: Block[]): Json {
  return blocks as unknown as Json;
}

export function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || typeof json !== "object" || !Array.isArray(json)) return [];
  return json as unknown as Block[];
}
