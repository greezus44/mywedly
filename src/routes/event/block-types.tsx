import React from "react";
import type { Json } from "../../lib/supabase";

// ─── Block Types ────────────────────────────────────────────────────────────

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "gallery"
  | "divider"
  | "spacer"
  | "button"
  | "video";

export interface BlockContent {
  text?: string;
  html?: string;
  src?: string;
  url?: string;
  alt?: string;
  images?: string[];
  align?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg";
  label?: string;
  link?: string;
  height?: number;
}

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
}

// ─── Block Type Definitions ──────────────────────────────────────────────────

export interface BlockTypeDef {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
}

export const BLOCK_TYPES: BlockTypeDef[] = [
  {
    type: "heading",
    label: "Heading",
    icon: "H",
    description: "A section heading",
  },
  {
    type: "paragraph",
    label: "Text",
    icon: "¶",
    description: "Rich text paragraph",
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼",
    description: "A single image",
  },
  {
    type: "gallery",
    label: "Gallery",
    icon: "▦",
    description: "Multiple images in a grid",
  },
  {
    type: "divider",
    label: "Divider",
    icon: "—",
    description: "A horizontal line",
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: "␣",
    description: "Vertical spacing",
  },
  {
    type: "button",
    label: "Button",
    icon: "▢",
    description: "A clickable button link",
  },
  {
    type: "video",
    label: "Video",
    icon: "▶",
    description: "Embedded video URL",
  },
];

// ─── Block Factory ──────────────────────────────────────────────────────────

let blockCounter = 0;

export function createBlock(type: BlockType): Block {
  const id = `block-${Date.now()}-${++blockCounter}`;
  const defaultContent: Record<BlockType, BlockContent> = {
    heading: { text: "New Heading", align: "center", size: "lg" },
    paragraph: { html: "" },
    image: { src: "", alt: "", align: "center" },
    gallery: { images: [] },
    divider: {},
    spacer: { height: 32 },
    button: { label: "Click Here", link: "", align: "center" },
    video: { url: "", align: "center" },
  };
  return {
    id,
    type,
    content: defaultContent[type],
  };
}

// ─── Block Serialization ─────────────────────────────────────────────────────

export function blocksToJson(blocks: Block[]): Json {
  return blocks as unknown as Json;
}

export function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return (json as unknown[]).map((item) => {
    const obj = item as Record<string, unknown>;
    return {
      id: (obj.id as string) ?? `block-${Math.random()}`,
      type: (obj.type as BlockType) ?? "paragraph",
      content: (obj.content as BlockContent) ?? {},
    };
  });
}
