import type { Json } from "../../lib/supabase";

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "divider"
  | "spacer"
  | "button"
  | "gallery"
  | "quote";

export interface Block {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
}

export interface BlockTypeMeta {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
}

export const BLOCK_TYPES: BlockTypeMeta[] = [
  {
    type: "heading",
    label: "Heading",
    icon: "H",
    description: "A section heading or title.",
  },
  {
    type: "paragraph",
    label: "Text",
    icon: "¶",
    description: "A block of rich text content.",
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼️",
    description: "A single image with optional caption.",
  },
  {
    type: "gallery",
    label: "Gallery",
    icon: "📷",
    description: "A grid of multiple images.",
  },
  {
    type: "button",
    label: "Button",
    icon: "🔘",
    description: "A clickable button with a link.",
  },
  {
    type: "quote",
    label: "Quote",
    icon: "❝",
    description: "A styled blockquote.",
  },
  {
    type: "divider",
    label: "Divider",
    icon: "—",
    description: "A horizontal line separator.",
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: "␣",
    description: "Empty vertical space.",
  },
];

let blockIdCounter = 0;

export function createBlock(type: BlockType): Block {
  blockIdCounter += 1;
  const id = `block-${Date.now()}-${blockIdCounter}`;
  const defaultData: Record<BlockType, Record<string, unknown>> = {
    heading: { text: "New Heading", level: "h2", align: "left" },
    paragraph: { html: "" },
    image: { url: "", caption: "", alt: "" },
    gallery: { images: [] as string[] },
    button: { text: "Click Here", url: "", align: "center" },
    quote: { text: "", author: "" },
    divider: {},
    spacer: { height: 40 },
  };
  return {
    id,
    type,
    data: { ...defaultData[type] },
  };
}

export function blocksToJson(blocks: Block[]): Json {
  return blocks as unknown as Json;
}

export function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return (json as unknown as Block[]).filter(
    (b) => b && typeof b === "object" && "id" in b && "type" in b && "data" in b
  );
}

export type BlockContent = Block["data"];
