import { useState } from "react";
import { Input, Textarea } from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";

export type BlockType =
  | "heading" | "paragraph" | "image" | "spacer" | "divider"
  | "gallery" | "video" | "button" | "columns" | "list"
  | "quote" | "countdown" | "map" | "rsvp-form" | "guest-list"
  | "schedule" | "venue" | "faq";

export interface Block {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
}

interface BlockTypeMeta {
  type: BlockType;
  label: string;
  icon: string;
}

export const BLOCK_TYPES: BlockTypeMeta[] = [
  { type: "heading", label: "Heading", icon: "H" },
  { type: "paragraph", label: "Paragraph", icon: "P" },
  { type: "image", label: "Image", icon: "IMG" },
  { type: "spacer", label: "Spacer", icon: "—" },
  { type: "divider", label: "Divider", icon: "·" },
  { type: "gallery", label: "Gallery", icon: "GAL" },
  { type: "video", label: "Video", icon: "VID" },
  { type: "button", label: "Button", icon: "BTN" },
  { type: "columns", label: "Columns", icon: "COL" },
  { type: "list", label: "List", icon: "LIST" },
  { type: "quote", label: "Quote", icon: '"' },
  { type: "countdown", label: "Countdown", icon: "CD" },
  { type: "map", label: "Map", icon: "MAP" },
  { type: "rsvp-form", label: "RSVP Form", icon: "RSVP" },
  { type: "guest-list", label: "Guest List", icon: "GL" },
  { type: "schedule", label: "Schedule", icon: "SCH" },
  { type: "venue", label: "Venue", icon: "VEN" },
  { type: "faq", label: "FAQ", icon: "FAQ" },
];

export function createBlock(type: BlockType): Block {
  return {
    id: crypto.randomUUID(),
    type,
    data: defaultBlockData(type),
  };
}

function defaultBlockData(type: BlockType): Record<string, unknown> {
  switch (type) {
    case "heading": return { text: "New Heading", level: "h2" };
    case "paragraph": return { text: "" };
    case "image": return { url: "", alt: "", caption: "" };
    case "spacer": return { height: 40 };
    case "divider": return {};
    case "gallery": return { images: [] };
    case "video": return { url: "", caption: "" };
    case "button": return { text: "Click Here", url: "" };
    case "columns": return { left: "", right: "" };
    case "list": return { items: [] };
    case "quote": return { text: "", author: "" };
    case "countdown": return { targetDate: "" };
    case "map": return { address: "", zoom: 15 };
    case "rsvp-form": return {};
    case "guest-list": return {};
    case "schedule": return {};
    case "venue": return { name: "", address: "" };
    case "faq": return { items: [] };
    default: return {};
  }
}

export function BlockContent({
  block,
  eventId,
  onUpdate,
}: {
  block: Block;
  eventId: string;
  onUpdate: (updates: Partial<Block>) => void;
}) {
  const data = block.data;
  const set = (patch: Record<string, unknown>) => onUpdate({ data: { ...data, ...patch } });

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <Input
            label="Text"
            value={(data.text as string) || ""}
            onChange={(e) => set({ text: e.target.value })}
          />
          <div>
            <span className="mb-1 block text-sm font-medium text-dash-text">Level</span>
            <select
              value={(data.level as string) || "h2"}
              onChange={(e) => set({ level: e.target.value })}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
            >
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
            </select>
          </div>
        </div>
      );

    case "paragraph":
      return (
        <Textarea
          label="Text"
          rows={4}
          value={(data.text as string) || ""}
          onChange={(e) => set({ text: e.target.value })}
        />
      );

    case "image":
      return (
        <div className="space-y-2">
          <ImageUpload
            label="Image"
            value={(data.url as string) || null}
            onChange={(url) => set({ url: url ?? "" })}
            eventId={eventId}
          />
          <Input
            label="Alt Text"
            value={(data.alt as string) || ""}
            onChange={(e) => set({ alt: e.target.value })}
          />
          <Input
            label="Caption"
            value={(data.caption as string) || ""}
            onChange={(e) => set({ caption: e.target.value })}
          />
        </div>
      );

    case "spacer":
      return (
        <div>
          <span className="mb-1 block text-sm font-medium text-dash-text">Height (px)</span>
          <input
            type="number"
            value={(data.height as number) || 40}
            onChange={(e) => set({ height: parseInt(e.target.value) || 40 })}
            className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
          />
        </div>
      );

    case "divider":
      return <p className="text-sm text-dash-muted">A horizontal divider line.</p>;

    case "video":
      return (
        <div className="space-y-2">
          <Input
            label="Video URL"
            value={(data.url as string) || ""}
            onChange={(e) => set({ url: e.target.value })}
          />
          <Input
            label="Caption"
            value={(data.caption as string) || ""}
            onChange={(e) => set({ caption: e.target.value })}
          />
        </div>
      );

    case "button":
      return (
        <div className="space-y-2">
          <Input
            label="Button Text"
            value={(data.text as string) || ""}
            onChange={(e) => set({ text: e.target.value })}
          />
          <Input
            label="Link URL"
            value={(data.url as string) || ""}
            onChange={(e) => set({ url: e.target.value })}
          />
        </div>
      );

    case "columns":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Textarea
            label="Left Column"
            rows={3}
            value={(data.left as string) || ""}
            onChange={(e) => set({ left: e.target.value })}
          />
          <Textarea
            label="Right Column"
            rows={3}
            value={(data.right as string) || ""}
            onChange={(e) => set({ right: e.target.value })}
          />
        </div>
      );

    case "list":
      return (
        <Textarea
          label="Items (one per line)"
          rows={5}
          value={Array.isArray(data.items) ? (data.items as string[]).join("\n") : ""}
          onChange={(e) => set({ items: e.target.value.split("\n").filter(Boolean) })}
        />
      );

    case "quote":
      return (
        <div className="space-y-2">
          <Textarea
            label="Quote"
            rows={3}
            value={(data.text as string) || ""}
            onChange={(e) => set({ text: e.target.value })}
          />
          <Input
            label="Author"
            value={(data.author as string) || ""}
            onChange={(e) => set({ author: e.target.value })}
          />
        </div>
      );

    case "countdown":
      return (
        <Input
          label="Target Date"
          type="date"
          value={(data.targetDate as string) || ""}
          onChange={(e) => set({ targetDate: e.target.value })}
        />
      );

    case "map":
      return (
        <div className="space-y-2">
          <Input
            label="Address"
            value={(data.address as string) || ""}
            onChange={(e) => set({ address: e.target.value })}
          />
          <div>
            <span className="mb-1 block text-sm font-medium text-dash-text">Zoom</span>
            <input
              type="number"
              min={1}
              max={20}
              value={(data.zoom as number) || 15}
              onChange={(e) => set({ zoom: parseInt(e.target.value) || 15 })}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
            />
          </div>
        </div>
      );

    case "rsvp-form":
      return <p className="text-sm text-dash-muted">Displays the RSVP form for the current guest.</p>;

    case "guest-list":
      return <p className="text-sm text-dash-muted">Displays the guest list for this event.</p>;

    case "schedule":
      return <p className="text-sm text-dash-muted">Displays the event schedule.</p>;

    case "venue":
      return (
        <div className="space-y-2">
          <Input
            label="Venue Name"
            value={(data.name as string) || ""}
            onChange={(e) => set({ name: e.target.value })}
          />
          <Input
            label="Address"
            value={(data.address as string) || ""}
            onChange={(e) => set({ address: e.target.value })}
          />
        </div>
      );

    case "faq":
      return (
        <Textarea
          label="FAQ Items (Q: question\nA: answer, one per pair)"
          rows={6}
          value={Array.isArray(data.items) ? (data.items as string[]).join("\n") : ""}
          onChange={(e) => set({ items: e.target.value.split("\n").filter(Boolean) })}
        />
      );

    case "gallery":
      return <p className="text-sm text-dash-muted">Gallery block — add images via the page builder.</p>;

    default:
      return null;
  }
}
