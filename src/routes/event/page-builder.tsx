import React, { useState, useEffect } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { cn } from "../../lib/utils";

// --- Block Types ---

type BlockType =
  | "heading" | "paragraph" | "image" | "spacer" | "divider"
  | "gallery" | "video" | "button" | "columns" | "list"
  | "quote" | "countdown" | "map" | "rsvp-form" | "guest-list"
  | "schedule" | "venue" | "faq";

interface Block {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
}

const BLOCK_OPTIONS: { type: BlockType; label: string; icon: string }[] = [
  { type: "heading", label: "Heading", icon: "H" },
  { type: "paragraph", label: "Paragraph", icon: "¶" },
  { type: "image", label: "Image", icon: "🖼" },
  { type: "spacer", label: "Spacer", icon: "␣" },
  { type: "divider", label: "Divider", icon: "—" },
  { type: "gallery", label: "Gallery", icon: "▦" },
  { type: "video", label: "Video", icon: "▶" },
  { type: "button", label: "Button", icon: "⬚" },
  { type: "columns", label: "Columns", icon: "▥" },
  { type: "list", label: "List", icon: "•" },
  { type: "quote", label: "Quote", icon: "❝" },
  { type: "countdown", label: "Countdown", icon: "⏳" },
  { type: "map", label: "Map", icon: "📍" },
  { type: "rsvp-form", label: "RSVP Form", icon: "✓" },
  { type: "guest-list", label: "Guest List", icon: "👥" },
  { type: "schedule", label: "Schedule", icon: "📅" },
  { type: "venue", label: "Venue", icon: "🏛" },
  { type: "faq", label: "FAQ", icon: "?" },
];

function newBlock(type: BlockType): Block {
  return {
    id: crypto.randomUUID(),
    type,
    data: getDefaultBlockData(type),
  };
}

function getDefaultBlockData(type: BlockType): Record<string, unknown> {
  switch (type) {
    case "heading": return { text: "New Heading", level: "h2" };
    case "paragraph": return { text: "New paragraph text..." };
    case "image": return { url: "", alt: "" };
    case "spacer": return { height: 40 };
    case "divider": return {};
    case "gallery": return { images: [] };
    case "video": return { url: "" };
    case "button": return { text: "Click Here", url: "#" };
    case "columns": return { columns: [{ text: "Column 1" }, { text: "Column 2" }] };
    case "list": return { items: ["Item 1", "Item 2"] };
    case "quote": return { text: "A beautiful quote", author: "" };
    case "countdown": return { targetDate: "" };
    case "map": return { address: "", embedUrl: "" };
    case "rsvp-form": return {};
    case "guest-list": return {};
    case "schedule": return {};
    case "venue": return { name: "", address: "" };
    case "faq": return { items: [{ q: "Question?", a: "Answer." }] };
    default: return {};
  }
}

// --- Block Renderer ---

function BlockPreview({ block }: { block: Block }) {
  const d = block.data;
  switch (block.type) {
    case "heading":
      return React.createElement((d.level as string) || "h2", {
        className: "text-xl font-bold text-dash-text",
      }, (d.text as string) ?? "");
    case "paragraph":
      return <p className="text-sm text-dash-text">{d.text as string}</p>;
    case "image":
      return d.url ? (
        <img src={d.url as string} alt={(d.alt as string) || ""} className="max-w-full rounded-lg" />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-dash-border text-sm text-dash-muted">Image placeholder</div>
      );
    case "spacer":
      return <div style={{ height: (d.height as number) || 40 }} />;
    case "divider":
      return <hr className="border-dash-border" />;
    case "video":
      return d.url ? (
        <div className="aspect-video rounded-lg bg-dash-bg" />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-dash-border text-sm text-dash-muted">Video placeholder</div>
      );
    case "button":
      return <button className="rounded-lg bg-dash-primary px-4 py-2 text-sm font-semibold text-dash-primary-fg">{(d.text as string) || "Button"}</button>;
    case "columns":
      return (
        <div className="grid grid-cols-2 gap-4">
          {(d.columns as { text: string }[] ?? []).map((c, i) => (
            <div key={i} className="rounded-lg border border-dash-border p-3 text-sm text-dash-text">{c.text}</div>
          ))}
        </div>
      );
    case "list":
      return (
        <ul className="list-disc pl-5 text-sm text-dash-text">
          {(d.items as string[] ?? []).map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-dash-border pl-4 italic text-sm text-dash-muted">
          "{d.text as string}"
          {d.author ? <footer className="mt-1 not-italic text-xs">— {d.author as string}</footer> : null}
        </blockquote>
      );
    case "countdown":
      return <div className="rounded-lg border border-dash-border p-4 text-center text-sm text-dash-muted">Countdown to {(d.targetDate as string) || "date"}</div>;
    case "map":
      return <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-dash-border text-sm text-dash-muted">Map: {(d.address as string) || "address"}</div>;
    case "rsvp-form":
      return <div className="rounded-lg border border-dash-border p-4 text-center text-sm text-dash-muted">RSVP Form</div>;
    case "guest-list":
      return <div className="rounded-lg border border-dash-border p-4 text-center text-sm text-dash-muted">Guest List</div>;
    case "schedule":
      return <div className="rounded-lg border border-dash-border p-4 text-center text-sm text-dash-muted">Schedule</div>;
    case "venue":
      return <div className="rounded-lg border border-dash-border p-4 text-sm text-dash-muted">Venue: {(d.name as string) || ""}</div>;
    case "faq":
      return (
        <div className="space-y-2">
          {(d.items as { q: string; a: string }[] ?? []).map((item, i) => (
            <div key={i} className="rounded-lg border border-dash-border p-3">
              <p className="font-medium text-dash-text">{item.q}</p>
              <p className="mt-1 text-sm text-dash-muted">{item.a}</p>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

// --- Block Editor ---

function BlockEditor({ block, onChange, onDelete }: { block: Block; onChange: (data: Record<string, unknown>) => void; onDelete: () => void }) {
  const d = block.data;
  const update = (patch: Record<string, unknown>) => onChange({ ...d, ...patch });

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <Input label="Text" value={(d.text as string) || ""} onChange={(e) => update({ text: e.target.value })} />
          <select value={(d.level as string) || "h2"} onChange={(e) => update({ level: e.target.value })} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm">
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
          <Button size="sm" variant="danger" onClick={onDelete}>Delete Block</Button>
        </div>
      );
    case "paragraph":
      return (
        <div className="space-y-2">
          <textarea value={(d.text as string) || ""} onChange={(e) => update({ text: e.target.value })} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm min-h-[80px] resize-y" />
          <Button size="sm" variant="danger" onClick={onDelete}>Delete Block</Button>
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          <Input label="Image URL" value={(d.url as string) || ""} onChange={(e) => update({ url: e.target.value })} />
          <Input label="Alt Text" value={(d.alt as string) || ""} onChange={(e) => update({ alt: e.target.value })} />
          <Button size="sm" variant="danger" onClick={onDelete}>Delete Block</Button>
        </div>
      );
    case "spacer":
      return (
        <div className="space-y-2">
          <Input label="Height (px)" type="number" value={(d.height as number) || 40} onChange={(e) => update({ height: parseInt(e.target.value) || 40 })} />
          <Button size="sm" variant="danger" onClick={onDelete}>Delete Block</Button>
        </div>
      );
    case "button":
      return (
        <div className="space-y-2">
          <Input label="Button Text" value={(d.text as string) || ""} onChange={(e) => update({ text: e.target.value })} />
          <Input label="URL" value={(d.url as string) || ""} onChange={(e) => update({ url: e.target.value })} />
          <Button size="sm" variant="danger" onClick={onDelete}>Delete Block</Button>
        </div>
      );
    case "video":
      return (
        <div className="space-y-2">
          <Input label="Video URL" value={(d.url as string) || ""} onChange={(e) => update({ url: e.target.value })} />
          <Button size="sm" variant="danger" onClick={onDelete}>Delete Block</Button>
        </div>
      );
    case "quote":
      return (
        <div className="space-y-2">
          <Input label="Quote" value={(d.text as string) || ""} onChange={(e) => update({ text: e.target.value })} />
          <Input label="Author" value={(d.author as string) || ""} onChange={(e) => update({ author: e.target.value })} />
          <Button size="sm" variant="danger" onClick={onDelete}>Delete Block</Button>
        </div>
      );
    case "map":
      return (
        <div className="space-y-2">
          <Input label="Address" value={(d.address as string) || ""} onChange={(e) => update({ address: e.target.value })} />
          <Button size="sm" variant="danger" onClick={onDelete}>Delete Block</Button>
        </div>
      );
    case "venue":
      return (
        <div className="space-y-2">
          <Input label="Venue Name" value={(d.name as string) || ""} onChange={(e) => update({ name: e.target.value })} />
          <Input label="Address" value={(d.address as string) || ""} onChange={(e) => update({ address: e.target.value })} />
          <Button size="sm" variant="danger" onClick={onDelete}>Delete Block</Button>
        </div>
      );
    case "countdown":
      return (
        <div className="space-y-2">
          <Input label="Target Date" type="date" value={(d.targetDate as string) || ""} onChange={(e) => update({ targetDate: e.target.value })} />
          <Button size="sm" variant="danger" onClick={onDelete}>Delete Block</Button>
        </div>
      );
    case "divider":
    case "rsvp-form":
    case "guest-list":
    case "schedule":
      return <Button size="sm" variant="danger" onClick={onDelete}>Delete Block</Button>;
    default:
      return <Button size="sm" variant="danger" onClick={onDelete}>Delete Block</Button>;
  }
}

// --- Main Component ---

export default function PageBuilder() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showAddBlock, setShowAddBlock] = useState(false);

  const { data: page, isLoading, isError, refetch } = useQuery({
    queryKey: ["custom-page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("id", pageId!)
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
    enabled: !!pageId,
  });

  useEffect(() => {
    if (page) {
      setBlocks((page.blocks as unknown as Block[]) ?? []);
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({ blocks })
        .eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom-pages", event.id] });
    },
  });

  const addBlock = (type: BlockType) => {
    setBlocks([...blocks, newBlock(type)]);
    setShowAddBlock(false);
  };

  const updateBlock = (id: string, data: Record<string, unknown>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, data } : b)));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, dir: "up" | "down") => {
    const newBlocks = [...blocks];
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setBlocks(newBlocks);
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner /></div>;
  }
  if (isError) {
    return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;
  }
  if (!page) {
    return (
      <div className="p-6">
        <EmptyState title="Page not found" />
        <div className="mt-4 text-center">
          <Button onClick={() => navigate(`/event/${event.id}/pages`)}>Back to Pages</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dash-border bg-dash-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/event/${event.id}/pages`)}
            className="text-sm text-dash-muted hover:text-dash-text"
          >
            ← Pages
          </button>
          <span className="text-dash-border">|</span>
          <h1 className="text-sm font-semibold text-dash-text">{page.title}</h1>
        </div>
        <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
      </div>

      {saveMutation.isSuccess && (
        <div className="bg-green-50 px-4 py-2 text-sm text-green-700">Page saved successfully!</div>
      )}
      {saveMutation.isError && (
        <div className="bg-red-50 px-4 py-2 text-sm text-red-700">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {blocks.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-dash-border py-16 text-center">
              <p className="text-sm text-dash-muted">No blocks yet. Add your first block to get started.</p>
            </div>
          )}

          {blocks.map((block, index) => (
            <Card key={block.id} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-dash-border bg-dash-bg px-3 py-2">
                <span className="text-xs font-medium uppercase text-dash-muted">{block.type}</span>
                <div className="flex gap-1">
                  <button onClick={() => moveBlock(index, "up")} disabled={index === 0} className="rounded p-1 text-dash-muted hover:bg-dash-surface disabled:opacity-30">↑</button>
                  <button onClick={() => moveBlock(index, "down")} disabled={index === blocks.length - 1} className="rounded p-1 text-dash-muted hover:bg-dash-surface disabled:opacity-30">↓</button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium text-dash-muted">Editor</p>
                  <BlockEditor block={block} onChange={(data) => updateBlock(block.id, data)} onDelete={() => deleteBlock(block.id)} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-dash-muted">Preview</p>
                  <div className="rounded-lg border border-dash-border bg-dash-bg p-3">
                    <BlockPreview block={block} />
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Button variant="secondary" className="w-full" onClick={() => setShowAddBlock(true)}>
            + Add Block
          </Button>
        </div>
      </div>

      {/* Add Block Modal */}
      {showAddBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddBlock(false)} />
          <div className="relative w-full max-w-lg rounded-xl border border-dash-border bg-dash-surface p-5 shadow-xl">
            <h3 className="text-base font-semibold text-dash-text">Add Block</h3>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {BLOCK_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => addBlock(opt.type)}
                  className="flex flex-col items-center gap-1 rounded-lg border border-dash-border p-3 text-center hover:border-dash-primary hover:bg-dash-primary/5"
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-xs font-medium text-dash-text">{opt.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={() => setShowAddBlock(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
