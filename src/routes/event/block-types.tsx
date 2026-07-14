import type { Json } from "../../lib/supabase";

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "divider"
  | "button"
  | "spacer"
  | "html";

export interface BlockContent {
  text?: string;
  html?: string;
  url?: string;
  alt?: string;
  label?: string;
  href?: string;
  align?: "left" | "center" | "right";
  height?: number;
}

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
}

export const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
  { type: "heading", label: "Heading", icon: "📝" },
  { type: "paragraph", label: "Paragraph", icon: "📄" },
  { type: "image", label: "Image", icon: "🖼️" },
  { type: "divider", label: "Divider", icon: "➖" },
  { type: "button", label: "Button", icon: "🔘" },
  { type: "spacer", label: "Spacer", icon: "↕️" },
  { type: "html", label: "Custom HTML", icon: "⚙️" },
];

export function createBlock(type: BlockType): Block {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const content: BlockContent = {};

  switch (type) {
    case "heading":
      content.text = "New Heading";
      content.align = "center";
      break;
    case "paragraph":
      content.text = "Write your text here...";
      content.align = "left";
      break;
    case "image":
      content.url = "";
      content.alt = "";
      content.align = "center";
      break;
    case "divider":
      break;
    case "button":
      content.label = "Click Here";
      content.href = "";
      content.align = "center";
      break;
    case "spacer":
      content.height = 40;
      break;
    case "html":
      content.html = "<p>Custom HTML</p>";
      break;
  }

  return { id, type, content };
}

export function blocksToJson(blocks: Block[]): Json {
  return blocks as unknown as Json;
}

export function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as Block[];
}
