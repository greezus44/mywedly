import { type ReactNode } from "react";
import type { Json } from "../../lib/supabase";

export type BlockType =
  | "heading"
  | "text"
  | "image"
  | "divider"
  | "button"
  | "spacer";

export interface Block {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
}

export interface BlockTypeDef {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
  defaultContent: Record<string, unknown>;
}

export const BLOCK_TYPES: BlockTypeDef[] = [
  {
    type: "heading",
    label: "Heading",
    icon: "H",
    description: "A section heading",
    defaultContent: { text: "New Heading", fontSize: 24, align: "center" },
  },
  {
    type: "text",
    label: "Text",
    icon: "¶",
    description: "Rich text paragraph",
    defaultContent: { html: "" },
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼",
    description: "An image",
    defaultContent: { url: null, alt: "", width: "full" },
  },
  {
    type: "divider",
    label: "Divider",
    icon: "—",
    description: "A horizontal line",
    defaultContent: {},
  },
  {
    type: "button",
    label: "Button",
    icon: "▢",
    description: "A call-to-action button",
    defaultContent: { text: "Click Here", url: "" },
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: "⇕",
    description: "Vertical spacing",
    defaultContent: { height: 32 },
  },
];

export function createBlock(type: BlockType): Block {
  const def = BLOCK_TYPES.find((b) => b.type === type);
  const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    type,
    content: def ? { ...def.defaultContent } : {},
  };
}

export function blocksFromContent(content: Json | null | undefined): Block[] {
  if (!content || typeof content !== "object" || Array.isArray(content)) return [];
  const obj = content as Record<string, unknown>;
  const blocks = obj.blocks;
  if (!Array.isArray(blocks)) return [];
  return blocks as Block[];
}

export function blocksToContent(blocks: Block[]): Record<string, unknown> {
  return { blocks };
}

export interface BlockContentProps {
  block: Block;
  className?: string;
}

export function BlockContent({ block, className }: BlockContentProps): ReactNode {
  const c = block.content;
  switch (block.type) {
    case "heading": {
      const text = (c.text as string) || "";
      const fontSize = (c.fontSize as number) || 24;
      const align = (c.align as string) || "center";
      return (
        <h2
          className={className}
          style={{ fontSize: `${fontSize}px`, textAlign: align as "left" | "center" | "right", fontWeight: 700 }}
        >
          {text}
        </h2>
      );
    }
    case "text": {
      const html = (c.html as string) || "";
      return (
        <div
          className={className}
          style={{ lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    case "image": {
      const url = c.url as string | null;
      const alt = (c.alt as string) || "";
      const width = (c.width as string) || "full";
      if (!url) {
        return (
          <div className={`${className} flex items-center justify-center rounded-lg border-2 border-dashed border-dash-border p-8 text-sm text-dash-muted`}>
            No image selected
          </div>
        );
      }
      return (
        <img
          src={url}
          alt={alt}
          className={className}
          style={{ width: width === "full" ? "100%" : "auto", maxWidth: "100%", borderRadius: "0.5rem" }}
        />
      );
    }
    case "divider": {
      return <hr className={className} style={{ border: "none", borderTop: "1px solid var(--event-border, #e2e8f0)", margin: "1rem 0" }} />;
    }
    case "button": {
      const text = (c.text as string) || "Button";
      return (
        <div className={className} style={{ textAlign: "center" }}>
          <button
            type="button"
            className="event-btn-primary"
            disabled
            style={{ cursor: "default" }}
          >
            {text}
          </button>
        </div>
      );
    }
    case "spacer": {
      const height = (c.height as number) || 32;
      return <div className={className} style={{ height }} />;
    }
    default:
      return null;
  }
}
