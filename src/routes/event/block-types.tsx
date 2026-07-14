import { type ReactNode } from "react";
import { cn, formatDate, getCountdown } from "../../lib/utils";

// ─── Block type definitions ───────────────────────────────────────────────

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "spacer"
  | "divider"
  | "gallery"
  | "video"
  | "button"
  | "columns"
  | "list"
  | "quote"
  | "countdown"
  | "map"
  | "rsvp-form"
  | "guest-list"
  | "schedule"
  | "venue"
  | "faq";

export interface BlockBase {
  id: string;
  type: BlockType;
}

export interface HeadingBlock extends BlockBase {
  type: "heading";
  text: string;
  level: 1 | 2 | 3;
  align: "left" | "center" | "right";
}
export interface ParagraphBlock extends BlockBase {
  type: "paragraph";
  text: string;
  align: "left" | "center" | "right";
}
export interface ImageBlock extends BlockBase {
  type: "image";
  src: string;
  alt: string;
  width: "small" | "medium" | "full";
  rounded: boolean;
}
export interface SpacerBlock extends BlockBase {
  type: "spacer";
  height: "sm" | "md" | "lg" | "xl";
}
export interface DividerBlock extends BlockBase {
  type: "divider";
  style: "solid" | "dashed" | "dotted";
}
export interface GalleryBlock extends BlockBase {
  type: "gallery";
  images: { src: string; alt: string }[];
  columns: 2 | 3 | 4;
}
export interface VideoBlock extends BlockBase {
  type: "video";
  url: string;
  autoplay: boolean;
}
export interface ButtonBlock extends BlockBase {
  type: "button";
  label: string;
  url: string;
  variant: "primary" | "outline";
  align: "left" | "center" | "right";
}
export interface ColumnsBlock extends BlockBase {
  type: "columns";
  count: 2 | 3;
  items: string[];
}
export interface ListBlock extends BlockBase {
  type: "list";
  items: string[];
  ordered: boolean;
}
export interface QuoteBlock extends BlockBase {
  type: "quote";
  text: string;
  author: string;
  align: "left" | "center" | "right";
}
export interface CountdownBlock extends BlockBase {
  type: "countdown";
  targetDate: string;
  label: string;
}
export interface MapBlock extends BlockBase {
  type: "map";
  embedUrl: string;
  height: number;
}
export interface RsvpFormBlock extends BlockBase {
  type: "rsvp-form";
  heading: string;
  body: string;
}
export interface GuestListBlock extends BlockBase {
  type: "guest-list";
  heading: string;
  columns: 2 | 3 | 4;
}
export interface ScheduleBlock extends BlockBase {
  type: "schedule";
  heading: string;
  showTime: boolean;
}
export interface VenueBlock extends BlockBase {
  type: "venue";
  name: string;
  address: string;
  mapUrl: string;
}
export interface FaqBlock extends BlockBase {
  type: "faq";
  items: { question: string; answer: string }[];
}

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | SpacerBlock
  | DividerBlock
  | GalleryBlock
  | VideoBlock
  | ButtonBlock
  | ColumnsBlock
  | ListBlock
  | QuoteBlock
  | CountdownBlock
  | MapBlock
  | RsvpFormBlock
  | GuestListBlock
  | ScheduleBlock
  | VenueBlock
  | FaqBlock;

// ─── Block type registry ──────────────────────────────────────────────────

export interface BlockTypeDef {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
}

export const BLOCK_TYPES: BlockTypeDef[] = [
  { type: "heading", label: "Heading", icon: "H", description: "A section heading" },
  { type: "paragraph", label: "Paragraph", icon: "¶", description: "Body text" },
  { type: "image", label: "Image", icon: "🖼", description: "A single image" },
  { type: "spacer", label: "Spacer", icon: "↕", description: "Vertical spacing" },
  { type: "divider", label: "Divider", icon: "—", description: "A horizontal line" },
  { type: "gallery", label: "Gallery", icon: "▦", description: "Image grid" },
  { type: "video", label: "Video", icon: "▶", description: "Embedded video" },
  { type: "button", label: "Button", icon: "⬚", description: "Call-to-action button" },
  { type: "columns", label: "Columns", icon: "▥", description: "Multi-column text" },
  { type: "list", label: "List", icon: "☰", description: "Bullet or numbered list" },
  { type: "quote", label: "Quote", icon: "❝", description: "A blockquote" },
  { type: "countdown", label: "Countdown", icon: "⏰", description: "Event countdown timer" },
  { type: "map", label: "Map", icon: "📍", description: "Embedded map" },
  { type: "rsvp-form", label: "RSVP Form", icon: "✓", description: "Guest RSVP form" },
  { type: "guest-list", label: "Guest List", icon: "👥", description: "Display attending guests" },
  { type: "schedule", label: "Schedule", icon: "📅", description: "Event schedule" },
  { type: "venue", label: "Venue", icon: "🏛", description: "Venue information" },
  { type: "faq", label: "FAQ", icon: "?", description: "Frequently asked questions" },
];

// ─── Block factory ────────────────────────────────────────────────────────

let blockCounter = 0;
function genId(): string {
  blockCounter += 1;
  return `block-${Date.now()}-${blockCounter}`;
}

export function createBlock(type: BlockType): Block {
  const id = genId();
  switch (type) {
    case "heading":
      return { id, type, text: "New Heading", level: 2, align: "center" };
    case "paragraph":
      return { id, type, text: "Write your text here...", align: "left" };
    case "image":
      return { id, type, src: "", alt: "", width: "medium", rounded: true };
    case "spacer":
      return { id, type, height: "md" };
    case "divider":
      return { id, type, style: "solid" };
    case "gallery":
      return { id, type, images: [], columns: 3 };
    case "video":
      return { id, type, url: "", autoplay: false };
    case "button":
      return { id, type, label: "Click Here", url: "#", variant: "primary", align: "center" };
    case "columns":
      return { id, type, count: 2, items: ["Column 1", "Column 2"] };
    case "list":
      return { id, type, items: ["First item", "Second item"], ordered: false };
    case "quote":
      return { id, type, text: "A memorable quote", author: "", align: "center" };
    case "countdown":
      return { id, type, targetDate: "", label: "Counting down to..." };
    case "map":
      return { id, type, embedUrl: "", height: 300 };
    case "rsvp-form":
      return { id, type, heading: "RSVP", body: "Will you be joining us?" };
    case "guest-list":
      return { id, type, heading: "Our Guests", columns: 3 };
    case "schedule":
      return { id, type, heading: "Schedule", showTime: true };
    case "venue":
      return { id, type, name: "", address: "", mapUrl: "" };
    case "faq":
      return { id, type, items: [{ question: "Question?", answer: "Answer." }] };
  }
}

// ─── Block content renderer ───────────────────────────────────────────────

const alignClass: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const spacerHeight: Record<string, string> = {
  sm: "h-4",
  md: "h-8",
  lg: "h-16",
  xl: "h-24",
};

const imageWidth: Record<string, string> = {
  small: "max-w-xs",
  medium: "max-w-md",
  full: "max-w-full",
};

export function BlockContent({
  block,
  theme,
}: {
  block: Block;
  theme?: { primary?: string; heading?: string };
}): ReactNode {
  const primaryColor = theme?.primary ?? "var(--event-primary, #b45309)";
  const headingColor = theme?.heading ?? "var(--event-heading, #78350f)";

  switch (block.type) {
    case "heading": {
      const cls = cn("font-bold", alignClass[block.align]);
      const style = { color: headingColor };
      if (block.level === 1) return <h1 className={cn(cls, "text-4xl")} style={style}>{block.text}</h1>;
      if (block.level === 2) return <h2 className={cn(cls, "text-3xl")} style={style}>{block.text}</h2>;
      return <h3 className={cn(cls, "text-2xl")} style={style}>{block.text}</h3>;
    }
    case "paragraph":
      return (
        <p className={cn("text-base leading-relaxed", alignClass[block.align])} style={{ color: "var(--event-text, #78350f)" }}>
          {block.text}
        </p>
      );
    case "image":
      if (!block.src) {
        return (
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-dash-border bg-dash-bg p-12 text-dash-muted">
            <span className="text-sm">No image selected</span>
          </div>
        );
      }
      return (
        <div className={cn("mx-auto", imageWidth[block.width])}>
          <img
            src={block.src}
            alt={block.alt}
            className={cn("w-full h-auto", block.rounded && "rounded-lg")}
          />
        </div>
      );
    case "spacer":
      return <div className={spacerHeight[block.height]} />;
    case "divider":
      return (
        <hr
          className={cn("border-t border-dash-border my-2", block.style === "dashed" && "border-dashed", block.style === "dotted" && "border-dotted")}
        />
      );
    case "gallery": {
      if (block.images.length === 0) {
        return (
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-dash-border bg-dash-bg p-12 text-dash-muted">
            <span className="text-sm">No images in gallery</span>
          </div>
        );
      }
      const cols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[block.columns];
      return (
        <div className={cn("grid gap-3", cols)}>
          {block.images.map((img, i) => (
            <img key={i} src={img.src} alt={img.alt} className="w-full h-40 object-cover rounded-lg" />
          ))}
        </div>
      );
    }
    case "video": {
      if (!block.url) {
        return (
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-dash-border bg-dash-bg p-12 text-dash-muted">
            <span className="text-sm">No video URL</span>
          </div>
        );
      }
      const isYoutube = block.url.includes("youtube.com") || block.url.includes("youtu.be");
      const isVimeo = block.url.includes("vimeo.com");
      if (isYoutube || isVimeo) {
        let embedUrl = block.url;
        if (isYoutube) {
          const m = block.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
          if (m) embedUrl = `https://www.youtube.com/embed/${m[1]}`;
        }
        return (
          <div className="aspect-video w-full">
            <iframe
              src={embedUrl}
              className="w-full h-full rounded-lg"
              allowFullScreen
              title="Embedded video"
            />
          </div>
        );
      }
      return (
        <video src={block.url} controls autoPlay={block.autoplay} className="w-full rounded-lg" />
      );
    }
    case "button":
      return (
        <div className={alignClass[block.align]}>
          <a
            href={block.url}
            className={cn(
              "inline-block rounded-md px-6 py-3 text-sm font-medium transition-colors",
              block.variant === "primary" ? "text-white" : "border-2"
            )}
            style={
              block.variant === "primary"
                ? { backgroundColor: primaryColor }
                : { borderColor: primaryColor, color: primaryColor }
            }
          >
            {block.label}
          </a>
        </div>
      );
    case "columns": {
      const cols = { 2: "grid-cols-2", 3: "grid-cols-3" }[block.count];
      return (
        <div className={cn("grid gap-6", cols)}>
          {block.items.map((item, i) => (
            <div key={i} className="text-sm leading-relaxed" style={{ color: "var(--event-text, #78350f)" }}>
              {item}
            </div>
          ))}
        </div>
      );
    }
    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag className={cn("space-y-2 pl-6", block.ordered ? "list-decimal" : "list-disc")}>
          {block.items.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed" style={{ color: "var(--event-text, #78350f)" }}>
              {item}
            </li>
          ))}
        </ListTag>
      );
    }
    case "quote":
      return (
        <blockquote className={cn("border-l-4 pl-4 italic", alignClass[block.align])} style={{ borderColor: primaryColor }}>
          <p className="text-lg" style={{ color: "var(--event-text, #78350f)" }}>{block.text}</p>
          {block.author && (
            <footer className="mt-2 text-sm" style={{ color: "var(--event-muted, #92400e)" }}>
              — {block.author}
            </footer>
          )}
        </blockquote>
      );
    case "countdown": {
      const cd = getCountdown(block.targetDate);
      const items = [
        { label: "Days", value: cd.days },
        { label: "Hours", value: cd.hours },
        { label: "Minutes", value: cd.minutes },
        { label: "Seconds", value: cd.seconds },
      ];
      return (
        <div className="text-center">
          {block.label && (
            <p className="mb-4 text-lg font-medium" style={{ color: headingColor }}>{block.label}</p>
          )}
          <div className="flex justify-center gap-4">
            {items.map((it) => (
              <div key={it.label} className="rounded-lg p-4" style={{ backgroundColor: "var(--event-surface, #fff)" }}>
                <div className="text-3xl font-bold" style={{ color: primaryColor }}>
                  {String(it.value).padStart(2, "0")}
                </div>
                <div className="text-xs uppercase tracking-wide" style={{ color: "var(--event-muted, #92400e)" }}>
                  {it.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "map":
      if (!block.embedUrl) {
        return (
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-dash-border bg-dash-bg p-12 text-dash-muted">
            <span className="text-sm">No map URL</span>
          </div>
        );
      }
      return (
        <iframe
          src={block.embedUrl}
          className="w-full rounded-lg"
          style={{ height: `${block.height}px` }}
          loading="lazy"
          title="Map"
        />
      );
    case "rsvp-form":
      return (
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2" style={{ color: headingColor }}>{block.heading}</h3>
          <p className="mb-6 text-sm" style={{ color: "var(--event-muted, #92400e)" }}>{block.body}</p>
          <div className="mx-auto max-w-sm space-y-3">
            <div className="rounded-md border p-3 text-sm" style={{ borderColor: "var(--event-border, #fde68a)", color: "var(--event-text, #78350f)" }}>
              RSVP form will appear here for guests.
            </div>
          </div>
        </div>
      );
    case "guest-list":
      return (
        <div>
          <h3 className="mb-4 text-2xl font-bold text-center" style={{ color: headingColor }}>{block.heading}</h3>
          <div className={cn("grid gap-3", { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[block.columns])}>
            <div className="rounded-md border p-3 text-sm text-center" style={{ borderColor: "var(--event-border, #fde68a)", color: "var(--event-muted, #92400e)" }}>
              Guest list will appear here.
            </div>
          </div>
        </div>
      );
    case "schedule":
      return (
        <div>
          <h3 className="mb-4 text-2xl font-bold text-center" style={{ color: headingColor }}>{block.heading}</h3>
          <div className="mx-auto max-w-md space-y-2">
            <div className="flex justify-between rounded-md border p-3 text-sm" style={{ borderColor: "var(--event-border, #fde68a)", color: "var(--event-text, #78350f)" }}>
              <span>Schedule items will appear here.</span>
            </div>
          </div>
        </div>
      );
    case "venue":
      return (
        <div className="text-center">
          {block.name && <h3 className="text-2xl font-bold mb-1" style={{ color: headingColor }}>{block.name}</h3>}
          {block.address && <p className="text-sm" style={{ color: "var(--event-muted, #92400e)" }}>{block.address}</p>}
          {block.mapUrl && (
            <iframe src={block.mapUrl} className="mt-4 w-full rounded-lg" style={{ height: 250 }} loading="lazy" title="Venue map" />
          )}
        </div>
      );
    case "faq":
      return (
        <div className="space-y-4">
          {block.items.map((item, i) => (
            <div key={i} className="rounded-lg border p-4" style={{ borderColor: "var(--event-border, #fde68a)" }}>
              <h4 className="font-semibold mb-1" style={{ color: headingColor }}>{item.question}</h4>
              <p className="text-sm" style={{ color: "var(--event-text, #78350f)" }}>{item.answer}</p>
            </div>
          ))}
        </div>
      );
  }
}

// ─── Block editor ─────────────────────────────────────────────────────────

export function BlockEditor({
  block,
  onChange,
  onRemove,
}: {
  block: Block;
  onChange: (block: Block) => void;
  onRemove: () => void;
}): ReactNode {
  const update = (patch: Partial<Block>) => onChange({ ...block, ...patch } as Block);
  const inputCls =
    "w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30";

  const renderEditor = (): ReactNode => {
    switch (block.type) {
      case "heading":
        return (
          <div className="space-y-3">
            <input className={inputCls} value={block.text} onChange={(e) => update({ text: e.target.value })} placeholder="Heading text" />
            <div className="flex gap-2">
              <select className={inputCls} value={block.level} onChange={(e) => update({ level: Number(e.target.value) as 1 | 2 | 3 })}>
                <option value={1}>H1</option>
                <option value={2}>H2</option>
                <option value={3}>H3</option>
              </select>
              <select className={inputCls} value={block.align} onChange={(e) => update({ align: e.target.value as "left" | "center" | "right" })}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        );
      case "paragraph":
        return (
          <div className="space-y-3">
            <textarea className={cn(inputCls, "min-h-[100px]")} value={block.text} onChange={(e) => update({ text: e.target.value })} placeholder="Paragraph text" />
            <select className={inputCls} value={block.align} onChange={(e) => update({ align: e.target.value as "left" | "center" | "right" })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        );
      case "image":
        return (
          <div className="space-y-3">
            <input className={inputCls} value={block.src} onChange={(e) => update({ src: e.target.value })} placeholder="Image URL" />
            <input className={inputCls} value={block.alt} onChange={(e) => update({ alt: e.target.value })} placeholder="Alt text" />
            <div className="flex gap-2">
              <select className={inputCls} value={block.width} onChange={(e) => update({ width: e.target.value as "small" | "medium" | "full" })}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="full">Full Width</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-dash-text">
                <input type="checkbox" checked={block.rounded} onChange={(e) => update({ rounded: e.target.checked })} />
                Rounded
              </label>
            </div>
          </div>
        );
      case "spacer":
        return (
          <select className={inputCls} value={block.height} onChange={(e) => update({ height: e.target.value as "sm" | "md" | "lg" | "xl" })}>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">Extra Large</option>
          </select>
        );
      case "divider":
        return (
          <select className={inputCls} value={block.style} onChange={(e) => update({ style: e.target.value as "solid" | "dashed" | "dotted" })}>
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        );
      case "gallery":
        return (
          <div className="space-y-3">
            {block.images.map((img, i) => (
              <div key={i} className="flex gap-2">
                <input className={inputCls} value={img.src} onChange={(e) => {
                  const images = [...block.images]; images[i] = { ...img, src: e.target.value }; update({ images });
                }} placeholder={`Image ${i + 1} URL`} />
                <button type="button" className="rounded-md border border-dash-border px-2 text-xs text-dash-danger" onClick={() => {
                  update({ images: block.images.filter((_, idx) => idx !== i) });
                }}>✕</button>
              </div>
            ))}
            <button type="button" className="text-sm text-dash-primary" onClick={() => update({ images: [...block.images, { src: "", alt: "" }] })}>
              + Add image
            </button>
            <select className={inputCls} value={block.columns} onChange={(e) => update({ columns: Number(e.target.value) as 2 | 3 | 4 })}>
              <option value={2}>2 columns</option>
              <option value={3}>3 columns</option>
              <option value={4}>4 columns</option>
            </select>
          </div>
        );
      case "video":
        return (
          <div className="space-y-3">
            <input className={inputCls} value={block.url} onChange={(e) => update({ url: e.target.value })} placeholder="Video URL (YouTube, Vimeo, or direct)" />
            <label className="flex items-center gap-2 text-sm text-dash-text">
              <input type="checkbox" checked={block.autoplay} onChange={(e) => update({ autoplay: e.target.checked })} />
              Autoplay
            </label>
          </div>
        );
      case "button":
        return (
          <div className="space-y-3">
            <input className={inputCls} value={block.label} onChange={(e) => update({ label: e.target.value })} placeholder="Button label" />
            <input className={inputCls} value={block.url} onChange={(e) => update({ url: e.target.value })} placeholder="Button URL" />
            <div className="flex gap-2">
              <select className={inputCls} value={block.variant} onChange={(e) => update({ variant: e.target.value as "primary" | "outline" })}>
                <option value="primary">Primary</option>
                <option value="outline">Outline</option>
              </select>
              <select className={inputCls} value={block.align} onChange={(e) => update({ align: e.target.value as "left" | "center" | "right" })}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        );
      case "columns":
        return (
          <div className="space-y-3">
            <select className={inputCls} value={block.count} onChange={(e) => {
              const count = Number(e.target.value) as 2 | 3;
              const items = [...block.items];
              while (items.length < count) items.push("");
              items.length = count;
              update({ count, items });
            }}>
              <option value={2}>2 columns</option>
              <option value={3}>3 columns</option>
            </select>
            {block.items.map((item, i) => (
              <textarea key={i} className={cn(inputCls, "min-h-[60px]")} value={item} onChange={(e) => {
                const items = [...block.items]; items[i] = e.target.value; update({ items });
              }} placeholder={`Column ${i + 1}`} />
            ))}
          </div>
        );
      case "list":
        return (
          <div className="space-y-3">
            {block.items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input className={inputCls} value={item} onChange={(e) => {
                  const items = [...block.items]; items[i] = e.target.value; update({ items });
                }} placeholder={`Item ${i + 1}`} />
                <button type="button" className="rounded-md border border-dash-border px-2 text-xs text-dash-danger" onClick={() => {
                  update({ items: block.items.filter((_, idx) => idx !== i) });
                }}>✕</button>
              </div>
            ))}
            <div className="flex items-center gap-4">
              <button type="button" className="text-sm text-dash-primary" onClick={() => update({ items: [...block.items, ""] })}>
                + Add item
              </button>
              <label className="flex items-center gap-2 text-sm text-dash-text">
                <input type="checkbox" checked={block.ordered} onChange={(e) => update({ ordered: e.target.checked })} />
                Ordered
              </label>
            </div>
          </div>
        );
      case "quote":
        return (
          <div className="space-y-3">
            <textarea className={cn(inputCls, "min-h-[80px]")} value={block.text} onChange={(e) => update({ text: e.target.value })} placeholder="Quote text" />
            <input className={inputCls} value={block.author} onChange={(e) => update({ author: e.target.value })} placeholder="Author (optional)" />
            <select className={inputCls} value={block.align} onChange={(e) => update({ align: e.target.value as "left" | "center" | "right" })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        );
      case "countdown":
        return (
          <div className="space-y-3">
            <input className={inputCls} value={block.label} onChange={(e) => update({ label: e.target.value })} placeholder="Label" />
            <input className={inputCls} type="date" value={block.targetDate?.split("T")[0] ?? ""} onChange={(e) => update({ targetDate: e.target.value })} />
          </div>
        );
      case "map":
        return (
          <div className="space-y-3">
            <input className={inputCls} value={block.embedUrl} onChange={(e) => update({ embedUrl: e.target.value })} placeholder="Map embed URL" />
            <input className={inputCls} type="number" value={block.height} onChange={(e) => update({ height: Number(e.target.value) })} placeholder="Height (px)" />
          </div>
        );
      case "rsvp-form":
        return (
          <div className="space-y-3">
            <input className={inputCls} value={block.heading} onChange={(e) => update({ heading: e.target.value })} placeholder="Heading" />
            <textarea className={cn(inputCls, "min-h-[60px]")} value={block.body} onChange={(e) => update({ body: e.target.value })} placeholder="Body text" />
          </div>
        );
      case "guest-list":
        return (
          <div className="space-y-3">
            <input className={inputCls} value={block.heading} onChange={(e) => update({ heading: e.target.value })} placeholder="Heading" />
            <select className={inputCls} value={block.columns} onChange={(e) => update({ columns: Number(e.target.value) as 2 | 3 | 4 })}>
              <option value={2}>2 columns</option>
              <option value={3}>3 columns</option>
              <option value={4}>4 columns</option>
            </select>
          </div>
        );
      case "schedule":
        return (
          <div className="space-y-3">
            <input className={inputCls} value={block.heading} onChange={(e) => update({ heading: e.target.value })} placeholder="Heading" />
            <label className="flex items-center gap-2 text-sm text-dash-text">
              <input type="checkbox" checked={block.showTime} onChange={(e) => update({ showTime: e.target.checked })} />
              Show time
            </label>
          </div>
        );
      case "venue":
        return (
          <div className="space-y-3">
            <input className={inputCls} value={block.name} onChange={(e) => update({ name: e.target.value })} placeholder="Venue name" />
            <input className={inputCls} value={block.address} onChange={(e) => update({ address: e.target.value })} placeholder="Address" />
            <input className={inputCls} value={block.mapUrl} onChange={(e) => update({ mapUrl: e.target.value })} placeholder="Map embed URL" />
          </div>
        );
      case "faq":
        return (
          <div className="space-y-3">
            {block.items.map((item, i) => (
              <div key={i} className="space-y-2 rounded-md border border-dash-border p-3">
                <input className={inputCls} value={item.question} onChange={(e) => {
                  const items = [...block.items]; items[i] = { ...item, question: e.target.value }; update({ items });
                }} placeholder="Question" />
                <textarea className={cn(inputCls, "min-h-[60px]")} value={item.answer} onChange={(e) => {
                  const items = [...block.items]; items[i] = { ...item, answer: e.target.value }; update({ items });
                }} placeholder="Answer" />
                <button type="button" className="text-xs text-dash-danger" onClick={() => update({ items: block.items.filter((_, idx) => idx !== i) })}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" className="text-sm text-dash-primary" onClick={() => update({ items: [...block.items, { question: "", answer: "" }] })}>
              + Add FAQ
            </button>
          </div>
        );
    }
  };

  const typeDef = BLOCK_TYPES.find((t) => t.type === block.type);

  return (
    <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-dash-primary/10 text-sm font-medium text-dash-primary">
            {typeDef?.icon ?? "?"}
          </span>
          <span className="text-sm font-medium text-dash-text">{typeDef?.label ?? block.type}</span>
        </div>
        <button type="button" onClick={onRemove} className="text-sm text-dash-danger hover:underline">
          Remove
        </button>
      </div>
      {renderEditor()}
    </div>
  );
}

// Utility to normalize blocks from JSON
export function normalizeBlocks(json: unknown): Block[] {
  if (!Array.isArray(json)) return [];
  return json.filter((b) => b && typeof b === "object" && "type" in b && "id" in b) as Block[];
}
