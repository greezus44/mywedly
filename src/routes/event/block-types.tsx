import { Input, Textarea, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Toggle } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import type { Json } from "../../lib/supabase";

export interface BlockBase {
  id: string;
  type: string;
}

export type BlockType =
  | "heading" | "paragraph" | "image" | "spacer" | "divider"
  | "gallery" | "video" | "button" | "columns" | "list"
  | "quote" | "countdown" | "map" | "rsvp-form" | "guest-list"
  | "schedule" | "venue" | "faq";

export type Block = BlockBase & Record<string, any>;

export const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
  { type: "heading", label: "Heading", icon: "H" },
  { type: "paragraph", label: "Paragraph", icon: "¶" },
  { type: "image", label: "Image", icon: "🖼" },
  { type: "spacer", label: "Spacer", icon: "␣" },
  { type: "divider", label: "Divider", icon: "—" },
  { type: "gallery", label: "Gallery", icon: "▦" },
  { type: "video", label: "Video", icon: "▶" },
  { type: "button", label: "Button", icon: "⬚" },
  { type: "columns", label: "Columns", icon: "⣿" },
  { type: "list", label: "List", icon: "•" },
  { type: "quote", label: "Quote", icon: "❝" },
  { type: "countdown", label: "Countdown", icon: "⏳" },
  { type: "map", label: "Map", icon: "📍" },
  { type: "rsvp-form", label: "RSVP Form", icon: "✉" },
  { type: "guest-list", label: "Guest List", icon: "👥" },
  { type: "schedule", label: "Schedule", icon: "📅" },
  { type: "venue", label: "Venue", icon: "🏛" },
  { type: "faq", label: "FAQ", icon: "?" },
];

function genId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlock(type: BlockType): Block {
  const base = { id: genId(), type };
  switch (type) {
    case "heading": return { ...base, text: "", level: 2 };
    case "paragraph": return { ...base, text: "" };
    case "image": return { ...base, url: "", alt: "" };
    case "spacer": return { ...base, height: 40 };
    case "divider": return { ...base };
    case "gallery": return { ...base, images: [], columns: 3 };
    case "video": return { ...base, url: "" };
    case "button": return { ...base, text: "Click here", url: "", style: "primary" };
    case "columns": return { ...base, columns: ["", ""] };
    case "list": return { ...base, items: [""], ordered: false };
    case "quote": return { ...base, text: "", author: "" };
    case "countdown": return { ...base, targetDate: "" };
    case "map": return { ...base, address: "", zoom: 14 };
    case "rsvp-form": return { ...base, heading: "RSVP" };
    case "guest-list": return { ...base, heading: "Guests" };
    case "schedule": return { ...base, heading: "Schedule" };
    case "venue": return { ...base, heading: "Venue" };
    case "faq": return { ...base, items: [{ question: "", answer: "" }] };
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
  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <Select label="Level" value={String(block.level ?? 2)}
            onChange={(e) => onUpdate({ level: Number(e.target.value) })}>
            <option value="1">H1</option><option value="2">H2</option>
            <option value="3">H3</option><option value="4">H4</option>
          </Select>
          <Input label="Text" value={block.text} placeholder="Heading text..."
            onChange={(e) => onUpdate({ text: e.target.value })} />
        </div>
      );
    case "paragraph":
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">Content</label>
          <RichTextEditor value={block.text} placeholder="Write your paragraph..."
            onChange={(text) => onUpdate({ text })} />
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          <ImageUpload label="Image" value={block.url || null} eventId={eventId}
            onChange={(url) => onUpdate({ url: url ?? "" })} />
          <Input label="Alt Text" value={block.alt} placeholder="Describe the image..."
            onChange={(e) => onUpdate({ alt: e.target.value })} />
        </div>
      );
    case "spacer":
      return <Input label="Height (px)" type="number" value={block.height} min={0}
        onChange={(e) => onUpdate({ height: Number(e.target.value) })} />;
    case "divider":
      return <p className="text-sm text-dash-muted">A horizontal divider line.</p>;
    case "gallery":
      return (
        <div className="space-y-2">
          <Select label="Columns" value={String(block.columns)}
            onChange={(e) => onUpdate({ columns: Number(e.target.value) })}>
            <option value="2">2 columns</option><option value="3">3 columns</option>
            <option value="4">4 columns</option>
          </Select>
          {block.images.map((url: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <ImageUpload value={url || null} eventId={eventId} aspect="aspect-video"
                onChange={(newUrl) => {
                  const images = [...block.images]; images[i] = newUrl ?? "";
                  onUpdate({ images });
                }} />
              <Button size="sm" variant="ghost" onClick={() => {
                onUpdate({ images: block.images.filter((_: number, idx: number) => idx !== i) });
              }}>Remove</Button>
            </div>
          ))}
          <Button size="sm" variant="secondary" onClick={() => {
            onUpdate({ images: [...block.images, ""] });
          }}>Add Image</Button>
        </div>
      );
    case "video":
      return <Input label="Video URL" value={block.url} placeholder="https://youtube.com/..."
        onChange={(e) => onUpdate({ url: e.target.value })} />;
    case "button":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input label="Button Text" value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })} />
          <Input label="Link URL" value={block.url}
            onChange={(e) => onUpdate({ url: e.target.value })} />
        </div>
      );
    case "columns":
      return (
        <div className="space-y-2">
          {block.columns.map((col: string, i: number) => (
            <div key={i}>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Column {i + 1}</label>
              <RichTextEditor value={col} placeholder={`Column ${i + 1} content...`}
                onChange={(html) => {
                  const columns = [...block.columns]; columns[i] = html;
                  onUpdate({ columns });
                }} />
            </div>
          ))}
          <Button size="sm" variant="secondary" onClick={() => {
            onUpdate({ columns: [...block.columns, ""] });
          }}>Add Column</Button>
        </div>
      );
    case "list":
      return (
        <div className="space-y-2">
          <Toggle checked={block.ordered} label="Ordered list"
            onChange={(v) => onUpdate({ ordered: v })} />
          {block.items.map((item: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={item} placeholder={`Item ${i + 1}`}
                onChange={(e) => {
                  const items = [...block.items]; items[i] = e.target.value;
                  onUpdate({ items });
                }} />
              <Button size="sm" variant="ghost" onClick={() => {
                onUpdate({ items: block.items.filter((_: number, idx: number) => idx !== i) });
              }}>Remove</Button>
            </div>
          ))}
          <Button size="sm" variant="secondary" onClick={() => {
            onUpdate({ items: [...block.items, ""] });
          }}>Add Item</Button>
        </div>
      );
    case "quote":
      return (
        <div className="space-y-2">
          <Textarea label="Quote" value={block.text} placeholder="Quote text..."
            onChange={(e) => onUpdate({ text: e.target.value })} />
          <Input label="Author" value={block.author} placeholder="Author name..."
            onChange={(e) => onUpdate({ author: e.target.value })} />
        </div>
      );
    case "countdown":
      return <Input label="Target Date" type="datetime-local" value={block.targetDate}
        onChange={(e) => onUpdate({ targetDate: e.target.value })} />;
    case "map":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input label="Address" value={block.address} placeholder="123 Main Street, City"
            onChange={(e) => onUpdate({ address: e.target.value })} />
          <Input label="Zoom Level" type="number" value={block.zoom} min={0} max={20}
            onChange={(e) => onUpdate({ zoom: Number(e.target.value) })} />
        </div>
      );
    case "rsvp-form":
    case "guest-list":
    case "schedule":
    case "venue":
      return <Input label="Heading" value={block.heading}
        onChange={(e) => onUpdate({ heading: e.target.value })} />;
    case "faq":
      return (
        <div className="space-y-3">
          {block.items.map((item: { question: string; answer: string }, i: number) => (
            <div key={i} className="space-y-2 rounded-md border border-dash-border p-3">
              <Input label="Question" value={item.question} placeholder="Question..."
                onChange={(e) => {
                  const items = [...block.items]; items[i] = { ...items[i], question: e.target.value };
                  onUpdate({ items });
                }} />
              <Textarea label="Answer" value={item.answer} placeholder="Answer..."
                onChange={(e) => {
                  const items = [...block.items]; items[i] = { ...items[i], answer: e.target.value };
                  onUpdate({ items });
                }} />
              <Button size="sm" variant="ghost" onClick={() => {
                onUpdate({ items: block.items.filter((_: number, idx: number) => idx !== i) });
              }}>Remove FAQ</Button>
            </div>
          ))}
          <Button size="sm" variant="secondary" onClick={() => {
            onUpdate({ items: [...block.items, { question: "", answer: "" }] });
          }}>Add FAQ Item</Button>
        </div>
      );
  }
}

export type { Json };
