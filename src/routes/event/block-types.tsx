import type { Json } from "../../lib/supabase";

export type BlockType = "heading" | "paragraph" | "image" | "divider" | "spacer" | "button" | "gallery";

export interface BlockContent {
  text?: string;
  html?: string;
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
  align?: "left" | "center" | "right";
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: number;
  href?: string;
  buttonText?: string;
  images?: string[];
  heightPx?: number;
}

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
  order_index: number;
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
    description: "A section heading with customizable font and colour.",
  },
  {
    type: "paragraph",
    label: "Text Block",
    icon: "¶",
    description: "Rich text content with formatting support.",
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼",
    description: "A single image with optional link.",
  },
  {
    type: "divider",
    label: "Divider",
    icon: "—",
    description: "A horizontal line to separate sections.",
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: "␣",
    description: "Empty vertical space between blocks.",
  },
  {
    type: "button",
    label: "Button",
    icon: "🔘",
    description: "A call-to-action button with a link.",
  },
  {
    type: "gallery",
    label: "Gallery",
    icon: "🖼",
    description: "A grid of multiple images.",
  },
];

export function createBlock(type: BlockType, orderIndex: number): Block {
  const id = crypto.randomUUID();
  const defaultContent: Record<BlockType, BlockContent> = {
    heading: { text: "New Heading", fontSize: 32, fontFamily: "'Playfair Display', serif", color: "#78350f", fontWeight: 700, align: "center" },
    paragraph: { html: "<p>Write your text here...</p>" },
    image: { url: "", alt: "", align: "center" },
    divider: {},
    spacer: { heightPx: 40 },
    button: { buttonText: "Click Here", href: "", align: "center" },
    gallery: { images: [] },
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

export function jsonToBlocks(json: Json | null): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return (json as Array<Record<string, unknown>>).map((item) => ({
    id: (item.id as string) ?? crypto.randomUUID(),
    type: (item.type as BlockType) ?? "paragraph",
    content: (item.content as BlockContent) ?? {},
    order_index: (item.order_index as number) ?? 0,
  }));
}

export function renderBlockPreview(block: Block): React.ReactNode {
  const { content, type } = block;
  switch (type) {
    case "heading":
      return (
        <h2
          style={{
            fontSize: `${content.fontSize ?? 32}px`,
            fontFamily: content.fontFamily ?? "Georgia, serif",
            color: content.color ?? "#78350f",
            fontWeight: content.fontWeight ?? 700,
            textAlign: content.align ?? "center",
          }}
        >
          {content.text ?? "Heading"}
        </h2>
      );
    case "paragraph":
      return (
        <div
          className="rich-content"
          dangerouslySetInnerHTML={{ __html: content.html ?? content.text ?? "" }}
        />
      );
    case "image":
      return content.url ? (
        <div style={{ textAlign: content.align ?? "center" }}>
          <img
            src={content.url}
            alt={content.alt ?? ""}
            style={{
              maxWidth: content.width ? `${content.width}px` : "100%",
              borderRadius: "0.5rem",
            }}
          />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-dash-border text-dash-muted">
          <span className="text-sm">No image selected</span>
        </div>
      );
    case "divider":
      return <hr className="border-dash-border" />;
    case "spacer":
      return <div style={{ height: `${content.heightPx ?? 40}px` }} />;
    case "button":
      return (
        <div style={{ textAlign: content.align ?? "center" }}>
          <a
            href={content.href || "#"}
            className="inline-block rounded-md bg-dash-primary px-6 py-2.5 text-sm font-medium text-dash-primary-fg"
          >
            {content.buttonText ?? "Click Here"}
          </a>
        </div>
      );
    case "gallery":
      return (content.images ?? []).length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(content.images ?? []).map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="h-24 w-full rounded-md object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-dash-border text-dash-muted">
          <span className="text-sm">No images in gallery</span>
        </div>
      );
    default:
      return null;
  }
}

export default Block;
