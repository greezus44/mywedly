import type { Json } from "../../lib/supabase";

// ---------------------------------------------------------------------------
// Block Type Definitions
// ---------------------------------------------------------------------------

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
  | "countdown"
  | "rsvp"
  | "html";

export interface BlockTypeDefinition {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
  defaultProps: Record<string, unknown>;
}

export const BLOCK_TYPES: BlockTypeDefinition[] = [
  {
    type: "heading",
    label: "Heading",
    icon: "M4.5 5.25h15M4.5 9.75h15M4.5 14.25h7.5m-7.5 4.5h7.5",
    description: "A section heading with customisable text and typography.",
    defaultProps: { text: "New Heading", level: 2, align: "center" },
  },
  {
    type: "paragraph",
    label: "Paragraph",
    icon: "M3.75 5.25h16.5M3.75 9h16.5M3.75 12.75h16.5M3.75 16.5h10.5",
    description: "A block of rich text content.",
    defaultProps: { text: "", align: "left" },
  },
  {
    type: "image",
    label: "Image",
    icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z",
    description: "A single image with optional caption.",
    defaultProps: { url: "", alt: "", caption: "", width: "full" },
  },
  {
    type: "gallery",
    label: "Gallery",
    icon: "M3.75 3.75v10.5M10.5 3.75v10.5M17.25 3.75v10.5M3.75 18.75h13.5",
    description: "A grid of multiple images.",
    defaultProps: { images: [], columns: 3 },
  },
  {
    type: "button",
    label: "Button",
    icon: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    description: "A call-to-action button linking to a URL or page.",
    defaultProps: { text: "Click Here", url: "", style: "primary" },
  },
  {
    type: "divider",
    label: "Divider",
    icon: "M3.75 12h16.5",
    description: "A horizontal line to separate content.",
    defaultProps: { style: "solid" },
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: "M12 4.5v15m0-15a1.5 1.5 0 011.5 1.5M12 4.5a1.5 1.5 0 00-1.5 1.5",
    description: "Empty vertical space between blocks.",
    defaultProps: { height: 48 },
  },
  {
    type: "video",
    label: "Video",
    icon: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75v6m3-3H9",
    description: "Embed a video from YouTube or Vimeo.",
    defaultProps: { url: "", title: "" },
  },
  {
    type: "quote",
    label: "Quote",
    icon: "M7.5 8.25h3.75v7.5H6V11.25h1.5V8.25zM16.5 8.25h3.75v7.5H15V11.25h1.5V8.25z",
    description: "A styled blockquote with attribution.",
    defaultProps: { text: "", author: "", align: "center" },
  },
  {
    type: "countdown",
    label: "Countdown",
    icon: "M12 6v6h4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    description: "A live countdown timer to the event date.",
    defaultProps: { targetDate: "", label: "" },
  },
  {
    type: "rsvp",
    label: "RSVP Form",
    icon: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    description: "An interactive RSVP form for guests.",
    defaultProps: { heading: "Will you attend?", buttonText: "Submit RSVP" },
  },
  {
    type: "html",
    label: "Custom HTML",
    icon: "M17.25 6.75L10.5 13.5m0 0L17.25 20.4M10.5 13.5h10.5",
    description: "Raw HTML for advanced customisation.",
    defaultProps: { html: "" },
  },
];

export const BLOCK_TYPE_MAP: Record<BlockType, BlockTypeDefinition> = BLOCK_TYPES.reduce(
  (acc, def) => { acc[def.type] = def; return acc; },
  {} as Record<BlockType, BlockTypeDefinition>
);

// ---------------------------------------------------------------------------
// Block Instance
// ---------------------------------------------------------------------------

export interface Block {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
}

function generateId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createBlock(type: BlockType): Block {
  const def = BLOCK_TYPE_MAP[type];
  if (!def) throw new Error(`Unknown block type: ${type}`);
  return {
    id: generateId(),
    type,
    props: { ...def.defaultProps },
  };
}

// ---------------------------------------------------------------------------
// Block Content (stored on CustomPage.blocks)
// ---------------------------------------------------------------------------

export interface BlockContent {
  blocks: Block[];
}

export function emptyBlockContent(): BlockContent {
  return { blocks: [] };
}

export function parseBlockContent(raw: Json | null | undefined): BlockContent {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return emptyBlockContent();
  }
  const obj = raw as { blocks?: unknown };
  if (!Array.isArray(obj.blocks)) return emptyBlockContent();
  return { blocks: obj.blocks as Block[] };
}

export function serializeBlockContent(content: BlockContent): Json {
  return content as unknown as Json;
}
