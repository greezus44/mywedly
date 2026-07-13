import { useState } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { Input, Textarea, Select, Modal, LoadingSpinner, ErrorState, Card } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils";

interface Block {
  id: string;
  type: string;
  data: Record<string, any>;
}

const BLOCK_TYPES: { type: string; label: string; icon: string }[] = [
  { type: "heading", label: "Heading", icon: "H" },
  { type: "paragraph", label: "Paragraph", icon: "¶" },
  { type: "image", label: "Image", icon: "🖼" },
  { type: "spacer", label: "Spacer", icon: "↕" },
  { type: "divider", label: "Divider", icon: "—" },
  { type: "gallery", label: "Gallery", icon: "▦" },
  { type: "video", label: "Video", icon: "▶" },
  { type: "button", label: "Button", icon: "▢" },
  { type: "columns", label: "Columns", icon: "▥" },
  { type: "list", label: "List", icon: "☰" },
  { type: "quote", label: "Quote", icon: "❝" },
  { type: "countdown", label: "Countdown", icon: "⏱" },
  { type: "map", label: "Map", icon: "📍" },
  { type: "rsvp-form", label: "RSVP Form", icon: "✓" },
  { type: "guest-list", label: "Guest List", icon: "👥" },
  { type: "schedule", label: "Schedule", icon: "📅" },
  { type: "venue", label: "Venue", icon: "🏛" },
  { type: "faq", label: "FAQ", icon: "?" },
];

function genId() { return `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

function BlockEditor({ block, onChange, onDelete }: { block: Block; onChange: (b: Block) => void; onDelete: () => void }) {
  const update = (data: Record<string, any>) => onChange({ ...block, data: { ...block.data, ...data } });

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <Input label="Text" value={block.data.text || ""} onChange={(e) => update({ text: e.target.value })} placeholder="Heading text" />
          <Select label="Level" value={block.data.level || "h2"} onChange={(e) => update({ level: e.target.value })}>
            {["h1", "h2", "h3", "h4"].map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </Select>
        </div>
      );
    case "paragraph":
      return <Textarea label="Text" value={block.data.text || ""} onChange={(e) => update({ text: e.target.value })} placeholder="Paragraph text" />;
    case "image":
      return <Input label="Image URL" value={block.data.url || ""} onChange={(e) => update({ url: e.target.value })} placeholder="https://..." />;
    case "video":
      return <Input label="Video URL" value={block.data.url || ""} onChange={(e) => update({ url: e.target.value })} placeholder="YouTube or Vimeo URL" />;
    case "button":
      return (
        <div className="space-y-2">
          <Input label="Button Text" value={block.data.text || ""} onChange={(e) => update({ text: e.target.value })} />
          <Input label="Link URL" value={block.data.url || ""} onChange={(e) => update({ url: e.target.value })} />
        </div>
      );
    case "quote":
      return (
        <div className="space-y-2">
          <Textarea label="Quote" value={block.data.text || ""} onChange={(e) => update({ text: e.target.value })} />
          <Input label="Author" value={block.data.author || ""} onChange={(e) => update({ author: e.target.value })} />
        </div>
      );
    case "list":
      return <Textarea label="Items (one per line)" value={(block.data.items || []).join("\n")} onChange={(e) => update({ items: e.target.value.split("\n") })} />;
    case "spacer":
      return <Input label="Height (px)" type="number" value={String(block.data.height || 40)} onChange={(e) => update({ height: parseInt(e.target.value) || 40 })} />;
    case "countdown":
      return <Input label="Target Date" type="date" value={block.data.date || ""} onChange={(e) => update({ date: e.target.value })} />;
    case "map":
      return (
        <div className="space-y-2">
          <Input label="Address" value={block.data.address || ""} onChange={(e) => update({ address: e.target.value })} />
          <Input label="Google Maps URL" value={block.data.url || ""} onChange={(e) => update({ url: e.target.value })} />
        </div>
      );
    case "venue":
      return (
        <div className="space-y-2">
          <Input label="Venue Name" value={block.data.name || ""} onChange={(e) => update({ name: e.target.value })} />
          <Input label="Address" value={block.data.address || ""} onChange={(e) => update({ address: e.target.value })} />
        </div>
      );
    case "faq":
      return (
        <div className="space-y-2">
          <Input label="Question" value={block.data.question || ""} onChange={(e) => update({ question: e.target.value })} />
          <Textarea label="Answer" value={block.data.answer || ""} onChange={(e) => update({ answer: e.target.value })} />
        </div>
      );
    default:
      return <p className="text-sm text-dash-muted">No editor for this block type. Data: {JSON.stringify(block.data)}</p>;
  }
}

export default function PageBuilder() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["custom_page", pageId],
    enabled: !!pageId,
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_pages").select("*").eq("id", pageId!).maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
  });

  // Load blocks from page data once
  if (page && !loaded) {
    setBlocks((page.blocks as unknown as Block[]) || []);
    setLoaded(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("custom_pages").update({ blocks: blocks as unknown as Json }).eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom_pages", event.id] });
    },
    onError: () => {},
  });

  function addBlock(type: string) {
    setBlocks([...blocks, { id: genId(), type, data: {} }]);
    setAddOpen(false);
  }

  function updateBlock(id: string, updated: Block) {
    setBlocks(blocks.map((b) => (b.id === id ? updated : b)));
  }

  function deleteBlock(id: string) {
    setBlocks(blocks.filter((b) => b.id !== id));
  }

  function moveBlock(index: number, dir: "up" | "down") {
    const newBlocks = [...blocks];
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setBlocks(newBlocks);
  }

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (error || !page) return <ErrorState message={error ? "Failed to load page." : "Page not found."} onRetry={() => navigate(-1)} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-dash-muted hover:text-dash-text">← Back to Pages</button>
          <h2 className="mt-1 text-xl font-bold text-dash-text">Page Builder — {page.title}</h2>
          <p className="mt-1 text-sm text-dash-muted">Drag to reorder blocks. Add content blocks to build your page.</p>
        </div>
        <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>Save Changes</Button>
      </div>

      {saveMutation.isError && <div className="rounded-md border border-dash-danger/30 bg-red-50 px-4 py-3 text-sm text-dash-danger">Failed to save. Please try again.</div>}
      {saveMutation.isSuccess && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Page saved successfully.</div>}

      <div className="space-y-3">
        {blocks.map((block, index) => (
          <Card key={block.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded bg-dash-primary/10 px-2 py-1 text-xs font-medium text-dash-primary capitalize">{block.type}</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => moveBlock(index, "up")} disabled={index === 0}>↑</Button>
                <Button size="sm" variant="ghost" onClick={() => moveBlock(index, "down")} disabled={index === blocks.length - 1}>↓</Button>
                <Button size="sm" variant="danger" onClick={() => deleteBlock(block.id)}>Delete</Button>
              </div>
            </div>
            <BlockEditor block={block} onChange={(b) => updateBlock(block.id, b)} onDelete={() => deleteBlock(block.id)} />
          </Card>
        ))}
      </div>

      {blocks.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-dash-border py-12 text-center">
          <p className="text-sm text-dash-muted">No blocks yet. Click "Add Block" to start building your page.</p>
        </div>
      )}

      <Button variant="secondary" onClick={() => setAddOpen(true)}>+ Add Block</Button>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Block" size="lg">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              onClick={() => addBlock(bt.type)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border border-dash-border p-4 text-center transition-colors hover:border-dash-primary hover:bg-dash-bg"
              )}
            >
              <span className="text-2xl">{bt.icon}</span>
              <span className="text-sm font-medium text-dash-text">{bt.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
