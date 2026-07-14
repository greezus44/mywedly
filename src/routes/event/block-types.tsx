import React from "react";
import { Input, Textarea } from "../../components/ui";
import { RichTextContent } from "../../lib/sanitize";
import { cn } from "../../lib/utils";
import type { Json } from "../../lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

export interface Block {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
}

export interface BlockTypeDef {
  type: BlockType;
  label: string;
  icon: React.ReactNode;
  defaultContent: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Block type definitions
// ---------------------------------------------------------------------------

export const BLOCK_TYPES: BlockTypeDef[] = [
  {
    type: "heading",
    label: "Heading",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3.75h9m-9 3.75h9M4.5 4.5v15" /></svg>,
    defaultContent: { text: "Section Heading", level: "h2", align: "left" },
  },
  {
    type: "paragraph",
    label: "Paragraph",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
    defaultContent: { html: "<p>Write your text here...</p>" },
  },
  {
    type: "image",
    label: "Image",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>,
    defaultContent: { src: "", alt: "", width: "full" },
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.5 0h15" /></svg>,
    defaultContent: { height: 40 },
  },
  {
    type: "divider",
    label: "Divider",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5" /></svg>,
    defaultContent: { style: "solid" },
  },
  {
    type: "gallery",
    label: "Gallery",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 7.5 4.5 4.5m0 0 4.5-4.5m-4.5 4.5V3m-4.5 13.5h9" /></svg>,
    defaultContent: { images: [], columns: 3 },
  },
  {
    type: "video",
    label: "Video",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>,
    defaultContent: { url: "", autoplay: false },
  },
  {
    type: "button",
    label: "Button",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m0-13.5c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v13.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 15.75 18.75ZM4.5 12.75h6m0 0-2.25-2.25M10.5 12.75l-2.25 2.25" /></svg>,
    defaultContent: { text: "Click Here", url: "#", style: "primary" },
  },
  {
    type: "columns",
    label: "Columns",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15M3.75 4.5h16.5" /></svg>,
    defaultContent: { columns: 2, items: [] },
  },
  {
    type: "list",
    label: "List",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>,
    defaultContent: { items: ["Item 1", "Item 2"], ordered: false },
  },
  {
    type: "quote",
    label: "Quote",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25c0-1.386 1.114-2.5 2.5-2.5h2.5v6H5.5c-1.386 0-2.5-1.114-2.5-2.5Zm0 0c0 4.142 2.25 6.75 5.25 7.5m8.25-7.5c0-1.386 1.114-2.5 2.5-2.5h2.5v6h-2.5c-1.386 0-2.5-1.114-2.5-2.5Zm0 0c0 4.142 2.25 6.75 5.25 7.5" /></svg>,
    defaultContent: { text: "A beautiful quote...", author: "" },
  },
  {
    type: "countdown",
    label: "Countdown",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 2.25H3v-6.75a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 11.25v6.75z" /></svg>,
    defaultContent: { targetDate: "", label: "Counting down to..." },
  },
  {
    type: "map",
    label: "Map",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m6.75-1.5v-9a1.5 1.5 0 0 0-1.5-1.5H2.25a1.5 1.5 0 0 0-1.5 1.5v9a1.5 1.5 0 0 0 1.5 1.5h18a1.5 1.5 0 0 0 1.5-1.5Zm-13.5-1.5 3.75-1.5L15 15l5.25-1.5" /></svg>,
    defaultContent: { address: "", embedUrl: "" },
  },
  {
    type: "rsvp-form",
    label: "RSVP Form",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
    defaultContent: { title: "RSVP", buttonText: "Submit RSVP" },
  },
  {
    type: "guest-list",
    label: "Guest List",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.353 9.327 9.327 0 0 0-1.213 2.933zM3.75 18a4.5 4.5 0 0 1 .702-2.395 4.5 4.5 0 0 1 4.5-2.105 4.5 4.5 0 0 1 4.5 2.105A4.5 4.5 0 0 1 13.5 18a4.5 4.5 0 0 1-4.5 4.5A4.5 4.5 0 0 1 3.75 18z" /></svg>,
    defaultContent: { title: "Guest List" },
  },
  {
    type: "schedule",
    label: "Schedule",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 2.25H3v-6.75a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 11.25v6.75z" /></svg>,
    defaultContent: { title: "Schedule" },
  },
  {
    type: "venue",
    label: "Venue",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>,
    defaultContent: { name: "", address: "", mapUrl: "" },
  },
  {
    type: "faq",
    label: "FAQ",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>,
    defaultContent: { items: [{ question: "Question?", answer: "Answer." }] },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let blockIdCounter = 0;

export function createBlock(type: BlockType): Block {
  const def = BLOCK_TYPES.find((b) => b.type === type);
  return {
    id: `block-${Date.now()}-${blockIdCounter++}`,
    type,
    content: def ? { ...def.defaultContent } : {},
  };
}

// ---------------------------------------------------------------------------
// BlockContent — renders a block for preview
// ---------------------------------------------------------------------------

export interface BlockContentProps {
  block: Block;
}

export function BlockContent({ block }: BlockContentProps) {
  const c = block.content;

  switch (block.type) {
    case "heading": {
      const text = (c.text as string) || "";
      const level = (c.level as string) || "h2";
      const align = (c.align as string) || "left";
      const Tag = (level === "h1" ? "h1" : level === "h3" ? "h3" : "h2") as keyof React.JSX.IntrinsicElements;
      return (
        <Tag
          className={cn(
            "font-bold text-dash-text",
            level === "h1" && "text-3xl",
            level === "h2" && "text-2xl",
            level === "h3" && "text-xl",
            align === "center" && "text-center",
            align === "right" && "text-right"
          )}
        >
          {text}
        </Tag>
      );
    }

    case "paragraph":
      return <RichTextContent html={(c.html as string) || "<p></p>"} />;

    case "image":
      return c.src ? (
        <img
          src={c.src as string}
          alt={(c.alt as string) || ""}
          className="w-full rounded-lg"
        />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-dash-border bg-dash-bg text-sm text-dash-muted">
          No image selected
        </div>
      );

    case "spacer":
      return <div style={{ height: `${c.height ?? 40}px` }} />;

    case "divider":
      return <hr className="border-dash-border" />;

    case "gallery": {
      const images = (c.images as string[]) || [];
      const cols = (c.columns as number) || 3;
      return images.length > 0 ? (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {images.map((src, i) => (
            <img key={i} src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
          ))}
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-dash-border bg-dash-bg text-sm text-dash-muted">
          No images in gallery
        </div>
      );
    }

    case "video":
      return c.url ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <iframe
            src={c.url as string}
            className="h-full w-full"
            title="Video"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-dash-border bg-dash-bg text-sm text-dash-muted">
          No video URL
        </div>
      );

    case "button":
      return (
        <a
          href={(c.url as string) || "#"}
          className="inline-flex items-center justify-center rounded-lg bg-dash-primary px-6 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover"
        >
          {(c.text as string) || "Button"}
        </a>
      );

    case "columns": {
      const items = (c.items as string[]) || [];
      const cols = (c.columns as number) || 2;
      return (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {items.map((item, i) => (
            <div key={i} className="text-sm text-dash-text">
              {item}
            </div>
          ))}
        </div>
      );
    }

    case "list": {
      const items = (c.items as string[]) || [];
      const ordered = c.ordered as boolean;
      return ordered ? (
        <ol className="list-inside list-decimal space-y-1 text-sm text-dash-text">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="list-inside list-disc space-y-1 text-sm text-dash-text">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }

    case "quote":
      return (
        <blockquote className="border-l-4 border-dash-primary pl-4 italic text-dash-text">
          <p>{(c.text as string) || ""}</p>
          {(c.author as string) && (
            <footer className="mt-1 text-sm text-dash-muted">
              — {c.author as string}
            </footer>
          )}
        </blockquote>
      );

    case "countdown":
      return (
        <div className="rounded-lg bg-dash-bg p-4 text-center">
          <p className="text-sm text-dash-muted">
            {(c.label as string) || "Counting down to..."}
          </p>
          <p className="mt-1 text-lg font-semibold text-dash-text">
            {(c.targetDate as string) || "No date set"}
          </p>
        </div>
      );

    case "map":
      return c.embedUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <iframe
            src={c.embedUrl as string}
            className="h-full w-full"
            title="Map"
          />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-dash-border bg-dash-bg text-sm text-dash-muted">
          No map configured
        </div>
      );

    case "rsvp-form":
      return (
        <div className="rounded-lg border border-dash-border bg-dash-surface p-6 text-center">
          <h3 className="text-lg font-semibold text-dash-text">
            {(c.title as string) || "RSVP"}
          </h3>
          <button
            type="button"
            disabled
            className="mt-4 rounded-lg bg-dash-primary px-6 py-2 text-sm font-medium text-dash-primary-fg"
          >
            {(c.buttonText as string) || "Submit RSVP"}
          </button>
        </div>
      );

    case "guest-list":
      return (
        <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
          <h3 className="text-lg font-semibold text-dash-text">
            {(c.title as string) || "Guest List"}
          </h3>
          <p className="mt-1 text-sm text-dash-muted">
            Guest list will appear here on the live page.
          </p>
        </div>
      );

    case "schedule":
      return (
        <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
          <h3 className="text-lg font-semibold text-dash-text">
            {(c.title as string) || "Schedule"}
          </h3>
          <p className="mt-1 text-sm text-dash-muted">
            Schedule items will appear here on the live page.
          </p>
        </div>
      );

    case "venue":
      return (
        <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
          {(c.name as string) && (
            <h3 className="text-lg font-semibold text-dash-text">
              {c.name as string}
            </h3>
          )}
          {(c.address as string) && (
            <p className="mt-1 text-sm text-dash-muted">
              {c.address as string}
            </p>
          )}
        </div>
      );

    case "faq": {
      const items = (c.items as { question: string; answer: string }[]) || [];
      return (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-dash-border bg-dash-surface p-4">
              <h4 className="font-semibold text-dash-text">{item.question}</h4>
              <p className="mt-1 text-sm text-dash-muted">{item.answer}</p>
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// BlockEditor — edits a block's content
// ---------------------------------------------------------------------------

export interface BlockEditorProps {
  block: Block;
  onChange: (content: Record<string, unknown>) => void;
}

export function BlockEditor({ block, onChange }: BlockEditorProps) {
  const c = block.content;

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-3">
          <Input
            label="Text"
            value={(c.text as string) || ""}
            onChange={(e) => onChange({ ...c, text: e.target.value })}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Level
            </label>
            <select
              value={(c.level as string) || "h2"}
              onChange={(e) => onChange({ ...c, level: e.target.value })}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
            >
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Alignment
            </label>
            <select
              value={(c.align as string) || "left"}
              onChange={(e) => onChange({ ...c, align: e.target.value })}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      );

    case "paragraph":
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">
            Content
          </label>
          <Textarea
            value={(c.html as string) || ""}
            onChange={(e) => onChange({ ...c, html: e.target.value })}
            rows={5}
            placeholder="Write your paragraph..."
          />
        </div>
      );

    case "image":
      return (
        <div className="space-y-3">
          <Input
            label="Image URL"
            value={(c.src as string) || ""}
            onChange={(e) => onChange({ ...c, src: e.target.value })}
            placeholder="https://..."
          />
          <Input
            label="Alt Text"
            value={(c.alt as string) || ""}
            onChange={(e) => onChange({ ...c, alt: e.target.value })}
          />
        </div>
      );

    case "spacer":
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">
            Height (px)
          </label>
          <Input
            type="number"
            value={(c.height as number) || 40}
            onChange={(e) => onChange({ ...c, height: parseInt(e.target.value) || 40 })}
          />
        </div>
      );

    case "divider":
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">
            Style
          </label>
          <select
            value={(c.style as string) || "solid"}
            onChange={(e) => onChange({ ...c, style: e.target.value })}
            className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </div>
      );

    case "gallery":
      return (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Columns
            </label>
            <Input
              type="number"
              min={1}
              max={6}
              value={(c.columns as number) || 3}
              onChange={(e) => onChange({ ...c, columns: parseInt(e.target.value) || 3 })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Image URLs (one per line)
            </label>
            <Textarea
              value={((c.images as string[]) || []).join("\n")}
              onChange={(e) =>
                onChange({
                  ...c,
                  images: e.target.value.split("\n").filter(Boolean),
                })
              }
              rows={4}
              placeholder="https://..."
            />
          </div>
        </div>
      );

    case "video":
      return (
        <Input
          label="Video Embed URL"
          value={(c.url as string) || ""}
          onChange={(e) => onChange({ ...c, url: e.target.value })}
          placeholder="https://www.youtube.com/embed/..."
        />
      );

    case "button":
      return (
        <div className="space-y-3">
          <Input
            label="Button Text"
            value={(c.text as string) || ""}
            onChange={(e) => onChange({ ...c, text: e.target.value })}
          />
          <Input
            label="URL"
            value={(c.url as string) || ""}
            onChange={(e) => onChange({ ...c, url: e.target.value })}
          />
        </div>
      );

    case "columns":
      return (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Number of Columns
            </label>
            <Input
              type="number"
              min={1}
              max={4}
              value={(c.columns as number) || 2}
              onChange={(e) => onChange({ ...c, columns: parseInt(e.target.value) || 2 })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Column Content (one per line)
            </label>
            <Textarea
              value={((c.items as string[]) || []).join("\n")}
              onChange={(e) =>
                onChange({
                  ...c,
                  items: e.target.value.split("\n").filter(Boolean),
                })
              }
              rows={4}
            />
          </div>
        </div>
      );

    case "list":
      return (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Items (one per line)
            </label>
            <Textarea
              value={((c.items as string[]) || []).join("\n")}
              onChange={(e) =>
                onChange({
                  ...c,
                  items: e.target.value.split("\n").filter(Boolean),
                })
              }
              rows={4}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-dash-text">
            <input
              type="checkbox"
              checked={c.ordered as boolean}
              onChange={(e) => onChange({ ...c, ordered: e.target.checked })}
              className="accent-dash-primary"
            />
            Ordered list (numbers)
          </label>
        </div>
      );

    case "quote":
      return (
        <div className="space-y-3">
          <Textarea
            label="Quote Text"
            value={(c.text as string) || ""}
            onChange={(e) => onChange({ ...c, text: e.target.value })}
            rows={3}
          />
          <Input
            label="Author"
            value={(c.author as string) || ""}
            onChange={(e) => onChange({ ...c, author: e.target.value })}
          />
        </div>
      );

    case "countdown":
      return (
        <div className="space-y-3">
          <Input
            label="Label"
            value={(c.label as string) || ""}
            onChange={(e) => onChange({ ...c, label: e.target.value })}
          />
          <Input
            label="Target Date"
            type="datetime-local"
            value={(c.targetDate as string) || ""}
            onChange={(e) => onChange({ ...c, targetDate: e.target.value })}
          />
        </div>
      );

    case "map":
      return (
        <div className="space-y-3">
          <Input
            label="Address"
            value={(c.address as string) || ""}
            onChange={(e) => onChange({ ...c, address: e.target.value })}
          />
          <Input
            label="Embed URL"
            value={(c.embedUrl as string) || ""}
            onChange={(e) => onChange({ ...c, embedUrl: e.target.value })}
          />
        </div>
      );

    case "rsvp-form":
      return (
        <div className="space-y-3">
          <Input
            label="Title"
            value={(c.title as string) || ""}
            onChange={(e) => onChange({ ...c, title: e.target.value })}
          />
          <Input
            label="Button Text"
            value={(c.buttonText as string) || ""}
            onChange={(e) => onChange({ ...c, buttonText: e.target.value })}
          />
        </div>
      );

    case "guest-list":
      return (
        <Input
          label="Title"
          value={(c.title as string) || ""}
          onChange={(e) => onChange({ ...c, title: e.target.value })}
        />
      );

    case "schedule":
      return (
        <Input
          label="Title"
          value={(c.title as string) || ""}
          onChange={(e) => onChange({ ...c, title: e.target.value })}
        />
      );

    case "venue":
      return (
        <div className="space-y-3">
          <Input
            label="Venue Name"
            value={(c.name as string) || ""}
            onChange={(e) => onChange({ ...c, name: e.target.value })}
          />
          <Textarea
            label="Address"
            value={(c.address as string) || ""}
            onChange={(e) => onChange({ ...c, address: e.target.value })}
            rows={2}
          />
          <Input
            label="Map URL"
            value={(c.mapUrl as string) || ""}
            onChange={(e) => onChange({ ...c, mapUrl: e.target.value })}
          />
        </div>
      );

    case "faq":
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">
            FAQ Items
          </label>
          <div className="space-y-3">
            {((c.items as { question: string; answer: string }[]) || []).map(
              (item, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-dash-border p-3">
                  <Input
                    value={item.question}
                    onChange={(e) => {
                      const items = [...((c.items as { question: string; answer: string }[]) || [])];
                      items[i] = { ...items[i], question: e.target.value };
                      onChange({ ...c, items });
                    }}
                    placeholder="Question"
                  />
                  <Textarea
                    value={item.answer}
                    onChange={(e) => {
                      const items = [...((c.items as { question: string; answer: string }[]) || [])];
                      items[i] = { ...items[i], answer: e.target.value };
                      onChange({ ...c, items });
                    }}
                    placeholder="Answer"
                    rows={2}
                  />
                  <button
                    onClick={() => {
                      const items = ((c.items as { question: string; answer: string }[]) || []).filter((_, idx) => idx !== i);
                      onChange({ ...c, items });
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )
            )}
            <button
              onClick={() =>
                onChange({
                  ...c,
                  items: [
                    ...((c.items as { question: string; answer: string }[]) || []),
                    { question: "", answer: "" },
                  ],
                })
              }
              className="text-sm text-dash-primary hover:underline"
            >
              + Add FAQ Item
            </button>
          </div>
        </div>
      );

    default:
      return null;
  }
}

export function blocksToJson(blocks: Block[]): Json {
  return blocks as unknown as Json;
}

export function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as Block[];
}
