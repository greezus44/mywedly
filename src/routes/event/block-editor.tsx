import { Input, Textarea, Card, Badge } from "../../components/ui";

export interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export const BLOCK_TYPES: { type: string; label: string; icon: string }[] = [
  { type: "heading", label: "Heading", icon: "H" },
  { type: "paragraph", label: "Paragraph", icon: "¶" },
  { type: "image", label: "Image", icon: "🖼" },
  { type: "spacer", label: "Spacer", icon: "␣" },
  { type: "divider", label: "Divider", icon: "—" },
  { type: "gallery", label: "Gallery", icon: "▦" },
  { type: "video", label: "Video", icon: "▶" },
  { type: "button", label: "Button", icon: "▢" },
  { type: "columns", label: "Columns", icon: "▦" },
  { type: "list", label: "List", icon: "☰" },
  { type: "quote", label: "Quote", icon: "❝" },
  { type: "countdown", label: "Countdown", icon: "⏰" },
  { type: "map", label: "Map", icon: "📍" },
  { type: "rsvp-form", label: "RSVP Form", icon: "✓" },
  { type: "guest-list", label: "Guest List", icon: "👥" },
  { type: "schedule", label: "Schedule", icon: "📅" },
  { type: "venue", label: "Venue", icon: "🏛" },
  { type: "faq", label: "FAQ", icon: "?" },
];

export function genId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlock(type: string): Block {
  const defaults: Record<string, Record<string, unknown>> = {
    heading: { text: "", level: "h2" },
    paragraph: { text: "" },
    image: { url: "", alt: "" },
    spacer: { height: 32 },
    divider: {},
    gallery: { images: [] },
    video: { url: "" },
    button: { text: "Click here", url: "" },
    columns: { columns: [{ text: "" }, { text: "" }] },
    list: { items: [] },
    quote: { text: "", author: "" },
    countdown: { date: "" },
    map: { address: "", zoom: 15 },
    "rsvp-form": {},
    "guest-list": {},
    schedule: {},
    venue: {},
    faq: { items: [] },
  };
  return { id: genId(), type, data: defaults[type] ?? {} };
}

interface BlockEditorProps {
  block: Block;
  onChange: (data: Record<string, unknown>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  index: number;
  total: number;
}

export function BlockEditor({
  block,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  index,
  total,
}: BlockEditorProps) {
  const update = (key: string, value: unknown) => {
    onChange({ ...block.data, [key]: value });
  };

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant="info">{block.type}</Badge>
        <div className="flex gap-1">
          <button type="button" onClick={onMoveUp} disabled={index === 0}
            className="rounded p-1 text-dash-muted hover:bg-dash-bg disabled:opacity-30" title="Move up">↑</button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1}
            className="rounded p-1 text-dash-muted hover:bg-dash-bg disabled:opacity-30" title="Move down">↓</button>
          <button type="button" onClick={onRemove}
            className="rounded p-1 text-dash-danger hover:bg-dash-bg" title="Delete block">✕</button>
        </div>
      </div>
      {block.type === "heading" && (
        <div className="space-y-2">
          <Input value={(block.data.text as string) || ""} onChange={(e) => update("text", e.target.value)} placeholder="Heading text" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-dash-text">Level</label>
            <select value={(block.data.level as string) || "h2"} onChange={(e) => update("level", e.target.value)}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text">
              <option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option>
            </select>
          </div>
        </div>
      )}
      {block.type === "paragraph" && (
        <Textarea value={(block.data.text as string) || ""} onChange={(e) => update("text", e.target.value)} placeholder="Paragraph text" />
      )}
      {block.type === "image" && (
        <div className="space-y-2">
          <Input value={(block.data.url as string) || ""} onChange={(e) => update("url", e.target.value)} placeholder="Image URL" />
          <Input value={(block.data.alt as string) || ""} onChange={(e) => update("alt", e.target.value)} placeholder="Alt text" />
        </div>
      )}
      {block.type === "spacer" && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-dash-text">Height (px)</label>
          <input type="number" value={(block.data.height as number) || 32} onChange={(e) => update("height", parseInt(e.target.value) || 32)}
            className="w-32 rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text" />
        </div>
      )}
      {block.type === "divider" && <div className="border-t border-dash-border" />}
      {block.type === "video" && (
        <Input value={(block.data.url as string) || ""} onChange={(e) => update("url", e.target.value)} placeholder="Video URL (YouTube, Vimeo, etc.)" />
      )}
      {block.type === "button" && (
        <div className="space-y-2">
          <Input value={(block.data.text as string) || ""} onChange={(e) => update("text", e.target.value)} placeholder="Button text" />
          <Input value={(block.data.url as string) || ""} onChange={(e) => update("url", e.target.value)} placeholder="Button URL" />
        </div>
      )}
      {block.type === "quote" && (
        <div className="space-y-2">
          <Textarea value={(block.data.text as string) || ""} onChange={(e) => update("text", e.target.value)} placeholder="Quote text" />
          <Input value={(block.data.author as string) || ""} onChange={(e) => update("author", e.target.value)} placeholder="Author" />
        </div>
      )}
      {block.type === "countdown" && (
        <Input value={(block.data.date as string) || ""} onChange={(e) => update("date", e.target.value)} placeholder="Target date (YYYY-MM-DD)" />
      )}
      {block.type === "map" && (
        <Input value={(block.data.address as string) || ""} onChange={(e) => update("address", e.target.value)} placeholder="Address" />
      )}
      {block.type === "list" && (
        <Textarea value={Array.isArray(block.data.items) ? (block.data.items as string[]).join("\n") : ""}
          onChange={(e) => update("items", e.target.value.split("\n"))} placeholder="One item per line" />
      )}
      {block.type === "faq" && (
        <Textarea value={Array.isArray(block.data.items) ? JSON.stringify(block.data.items, null, 2) : ""}
          onChange={(e) => { try { update("items", JSON.parse(e.target.value)); } catch { /* ignore */ } }}
          placeholder='[{"question":"Q","answer":"A"}]' />
      )}
      {block.type === "columns" && (
        <div className="grid grid-cols-2 gap-2">
          {Array.isArray(block.data.columns) &&
            (block.data.columns as { text: string }[]).map((col, i) => {
              const cols = [...(block.data.columns as { text: string }[])];
              return (
                <Textarea
                  key={i}
                  value={col.text}
                  onChange={(e) => {
                    cols[i] = { text: e.target.value };
                    update("columns", cols);
                  }}
                  placeholder={`Column ${i + 1}`}
                />
              );
            })}
        </div>
      )}
      {["gallery", "rsvp-form", "guest-list", "schedule", "venue"].includes(block.type) && (
        <p className="text-sm text-dash-muted">This block displays dynamic content from your event data.</p>
      )}
    </Card>
  );
}
