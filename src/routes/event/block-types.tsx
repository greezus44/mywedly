import type { Json } from "../../lib/supabase";

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "divider"
  | "spacer"
  | "button";

export interface BlockContent {
  text?: string;
  url?: string;
  alt?: string;
  align?: "left" | "center" | "right";
  level?: 1 | 2 | 3;
  variant?: "primary" | "secondary";
}

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
}

export const BLOCK_TYPES: Array<{
  type: BlockType;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    type: "heading",
    label: "Heading",
    icon: "H",
    description: "Add a section heading",
  },
  {
    type: "paragraph",
    label: "Text",
    icon: "¶",
    description: "Add a paragraph of text",
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼",
    description: "Upload or link an image",
  },
  {
    type: "button",
    label: "Button",
    icon: "◉",
    description: "Add a call-to-action button",
  },
  {
    type: "divider",
    label: "Divider",
    icon: "—",
    description: "Add a horizontal divider",
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: "␣",
    description: "Add vertical spacing",
  },
];

export function createBlock(type: BlockType): Block {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    content: getDefaultContent(type),
  };
}

function getDefaultContent(type: BlockType): BlockContent {
  switch (type) {
    case "heading":
      return { text: "New Heading", level: 2, align: "left" };
    case "paragraph":
      return { text: "Write your text here...", align: "left" };
    case "image":
      return { url: "", alt: "", align: "center" };
    case "button":
      return { text: "Click here", url: "", variant: "primary", align: "center" };
    case "divider":
      return { align: "center" };
    case "spacer":
      return {};
    default:
      return {};
  }
}

export function blocksToJson(blocks: Block[]): Json {
  return blocks as unknown as Json;
}

export function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as Block[];
}
