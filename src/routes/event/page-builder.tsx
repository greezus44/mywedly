import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json, type CustomPage } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, FormField, Card } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { cn } from "../../lib/utils";
import { BLOCK_TYPES, createBlock, jsonToBlocks, blocksToJson, type Block, type BlockType } from "./block-types";

export function PageBuilder() {
  const { eventId } = useEventContext();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["custom-page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("id", pageId)
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
    enabled: !!pageId,
  });

  const [title, setTitle] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showInNav, setShowInNav] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (!page) return;
    setTitle(page.title);
    setNavLabel(page.nav_label ?? "");
    setBlocks(jsonToBlocks(page.blocks));
    setShowInNav(page.show_in_nav);
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!page) throw new Error("Page not loaded");
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title,
          nav_label: navLabel || null,
          blocks: blocksToJson(blocks),
          show_in_nav: showInNav,
          updated_at: new Date().toISOString(),
        })
        .eq("id", page.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  function addBlock(type: BlockType) {
    setBlocks((prev) => [...prev, createBlock(type)]);
  }

  function updateBlock(id: string, content: Partial<typeof blocks[number]["content"]>) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...content } } : b)),
    );
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function moveBlock(id: string, dir: "up" | "down") {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
  }

  if (error || !page) {
    return (
      <div className="py-20 text-center">
        <p className="text-dash-muted">Page not found.</p>
        <Button variant="secondary" onClick={() => navigate(`/event/${eventId}/pages`)} className="mt-4">Back to Pages</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Page Builder</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate(`/event/${eventId}/pages`)}>
            ← Back to Pages
          </Button>
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Page
          </Button>
        </div>
      </div>

      {savedMsg && <span className="text-sm text-green-600">Saved!</span>}
      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      )}

      {/* Page Settings */}
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Page Title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormField>
          <FormField label="Nav Label">
            <Input
              value={navLabel}
              onChange={(e) => setNavLabel(e.target.value)}
              placeholder="Label shown in navigation"
            />
          </FormField>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-dash-text">
          <input
            type="checkbox"
            checked={showInNav}
            onChange={(e) => setShowInNav(e.target.checked)}
            className="rounded"
          />
          Show in navigation
        </label>
      </Card>

      {/* Block Types */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Add Block</h3>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              type="button"
              onClick={() => addBlock(bt.type)}
              className="flex items-center gap-2 rounded-md border border-dash-border px-3 py-1.5 text-sm font-medium text-dash-text transition-colors hover:bg-dash-bg"
            >
              <span>{bt.icon}</span>
              <span>{bt.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Blocks */}
      <div className="space-y-4">
        {blocks.length === 0 && (
          <div className="rounded-lg border border-dashed border-dash-border p-8 text-center text-sm text-dash-muted">
            No blocks yet. Add a block above to start building your page.
          </div>
        )}
        {blocks.map((block, idx) => (
          <Card key={block.id} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-dash-muted">
                {idx + 1}. {block.type}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => moveBlock(block.id, "up")} disabled={idx === 0}>
                  ↑
                </Button>
                <Button variant="ghost" size="sm" onClick={() => moveBlock(block.id, "down")} disabled={idx === blocks.length - 1}>
                  ↓
                </Button>
                <Button variant="danger" size="sm" onClick={() => removeBlock(block.id)}>
                  Delete
                </Button>
              </div>
            </div>
            <BlockEditor block={block} eventId={eventId} onChange={(c) => updateBlock(block.id, c)} />
          </Card>
        ))}
      </div>
    </div>
  );
}

function BlockEditor({
  block,
  eventId,
  onChange,
}: {
  block: Block;
  eventId: string;
  onChange: (content: Block["content"]) => void;
}) {
  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-3">
          <Input
            value={block.content.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Heading text"
          />
          <div className="flex gap-2">
            <Select
              value={String(block.content.level ?? 2)}
              onChange={(e) => onChange({ level: Number(e.target.value) as 1 | 2 | 3 })}
            >
              <option value="1">H1</option>
              <option value="2">H2</option>
              <option value="3">H3</option>
            </Select>
            <Select
              value={block.content.align ?? "left"}
              onChange={(e) => onChange({ align: e.target.value as "left" | "center" | "right" })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </div>
        </div>
      );
    case "paragraph":
      return (
        <div className="space-y-3">
          <RichTextEditor
            value={block.content.text ?? ""}
            onChange={(html) => onChange({ text: html })}
            placeholder="Write your paragraph..."
          />
          <Select
            value={block.content.align ?? "left"}
            onChange={(e) => onChange({ align: e.target.value as "left" | "center" | "right" })}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </Select>
        </div>
      );
    case "image":
      return (
        <div className="space-y-3">
          <ImageUpload
            bucket="event-assets"
            path={`events/${eventId}/pages/${block.id}`}
            value={block.content.src ?? null}
            onChange={(url) => onChange({ src: url ?? "" })}
          />
          <Input
            value={block.content.alt ?? ""}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="Alt text"
          />
        </div>
      );
    case "gallery":
      return (
        <div className="space-y-2">
          <p className="text-sm text-dash-muted">Gallery images (add one at a time):</p>
          <ImageUpload
            bucket="event-assets"
            path={`events/${eventId}/pages/${block.id}/${Date.now()}`}
            value={null}
            onChange={(url) => {
              if (url) {
                onChange({ images: [...(block.content.images ?? []), url] });
              }
            }}
          />
          {(block.content.images ?? []).length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {(block.content.images ?? []).map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} alt="" className="h-20 w-full rounded object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const imgs = [...(block.content.images ?? [])];
                      imgs.splice(i, 1);
                      onChange({ images: imgs });
                    }}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    case "button":
      return (
        <div className="space-y-3">
          <Input
            value={block.content.label ?? ""}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Button label"
          />
          <Input
            value={block.content.url ?? ""}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://..."
          />
        </div>
      );
    case "spacer":
      return (
        <FormField label={`Height: ${block.content.height ?? 40}px`}>
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={block.content.height ?? 40}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
            className="w-full"
          />
        </FormField>
      );
    case "video":
      return (
        <Input
          value={block.content.videoUrl ?? ""}
          onChange={(e) => onChange({ videoUrl: e.target.value })}
          placeholder="Video embed URL"
        />
      );
    case "quote":
      return (
        <Textarea
          value={block.content.text ?? ""}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Quote text"
          rows={3}
        />
      );
    case "list":
      return (
        <div className="space-y-2">
          <p className="text-sm text-dash-muted">One item per line:</p>
          <Textarea
            value={(block.content.items ?? []).join("\n")}
            onChange={(e) => onChange({ items: e.target.value.split("\n").filter(Boolean) })}
            rows={5}
          />
        </div>
      );
    case "divider":
      return <p className="text-sm text-dash-muted">A horizontal divider line.</p>;
    default:
      return null;
  }
}
