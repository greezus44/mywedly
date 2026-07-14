import { useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { Button, Input, Toggle, LoadingSpinner, Textarea } from "../../components/ui";
import { BlockType, BLOCK_TYPES, createBlock, type BlockContent } from "./block-types";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { cn } from "../../lib/utils";

export function PageBuilder() {
  const { pageId } = useParams<{ pageId: string }>();
  const { eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: page, isLoading } = useQuery({
    queryKey: ["custom-page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("id", pageId!)
        .single();
      if (error) throw error;
      return data as CustomPage;
    },
    enabled: !!pageId,
  });

  const [localBlocks, setLocalBlocks] = useState<BlockContent[] | null>(null);
  const [localTitle, setLocalTitle] = useState<string | null>(null);

  const blocks: BlockContent[] = localBlocks ?? (Array.isArray(page?.blocks) ? page!.blocks as unknown as BlockContent[] : []);
  const title = localTitle ?? page?.title ?? "";

  function updateBlock(idx: number, update: Partial<BlockContent>) {
    setLocalBlocks((prev) => {
      const arr = prev ?? blocks;
      return arr.map((b, i) => i === idx ? { ...b, ...update } : b);
    });
  }

  function addBlock(type: BlockType) {
    const nb = createBlock(type);
    setLocalBlocks((prev) => [...(prev ?? blocks), nb]);
    setSelectedBlockIdx((prev) => (prev ?? blocks.length));
  }

  function removeBlock(idx: number) {
    setLocalBlocks((prev) => {
      const arr = prev ?? blocks;
      return arr.filter((_, i) => i !== idx);
    });
    setSelectedBlockIdx(null);
  }

  function moveBlock(idx: number, dir: -1 | 1) {
    setLocalBlocks((prev) => {
      const arr = [...(prev ?? blocks)];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
    setSelectedBlockIdx(idx + dir);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({ title, blocks: blocks as unknown as Json })
        .eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><LoadingSpinner /></div>;
  }

  if (!page) {
    return <div className="p-6 text-dash-muted">Page not found.</div>;
  }

  const selectedBlock = selectedBlockIdx !== null ? blocks[selectedBlockIdx] : null;

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar: block list + properties */}
      <div className="w-72 shrink-0 border-r border-dash-border bg-dash-bg flex flex-col overflow-hidden">
        {/* Title + save */}
        <div className="border-b border-dash-border p-4 space-y-3">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => setLocalTitle(e.target.value)}
          />
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} className="w-full" size="sm">
            {saved ? "Saved!" : "Save page"}
          </Button>
        </div>

        {/* Block list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-xs font-medium text-dash-muted uppercase tracking-wide mb-2">Blocks</p>
          {blocks.map((block, idx) => (
            <div
              key={block.id}
              onClick={() => setSelectedBlockIdx(idx)}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
                selectedBlockIdx === idx
                  ? "bg-dash-primary text-white"
                  : "text-dash-text hover:bg-dash-surface-alt",
              )}
            >
              <span className="flex-1 truncate capitalize">{block.type}</span>
              <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => moveBlock(idx, -1)}
                  disabled={idx === 0}
                  className="p-0.5 rounded hover:bg-white/20 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(idx, 1)}
                  disabled={idx === blocks.length - 1}
                  className="p-0.5 rounded hover:bg-white/20 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(idx)}
                  className="p-0.5 rounded hover:bg-red-500/20 text-red-400"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          {blocks.length === 0 && (
            <p className="text-xs text-dash-muted text-center py-4">No blocks yet. Add one below.</p>
          )}
        </div>

        {/* Add block */}
        <div className="border-t border-dash-border p-3">
          <p className="text-xs font-medium text-dash-muted uppercase tracking-wide mb-2">Add Block</p>
          <div className="grid grid-cols-2 gap-1">
            {BLOCK_TYPES.slice(0, 10).map((bt) => (
              <button
                key={bt.type}
                type="button"
                onClick={() => addBlock(bt.type)}
                className="rounded border border-dash-border bg-dash-surface px-2 py-1 text-xs text-dash-text hover:border-dash-primary hover:text-dash-primary transition-colors"
              >
                {bt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main: block editor */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedBlock ? (
          <BlockEditor
            block={selectedBlock}
            onChange={(patch) => updateBlock(selectedBlockIdx!, patch)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <p className="text-dash-muted">Select a block to edit, or add a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BlockEditor({ block, onChange }: { block: BlockContent; onChange: (patch: Partial<BlockContent>) => void }) {
  const data = block.data as Record<string, unknown>;
  function setData(key: string, val: unknown) {
    onChange({ data: { ...data, [key]: val } });
  }

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-3 max-w-lg">
          <h3 className="font-semibold text-dash-text">Heading</h3>
          <Input label="Text" value={(data.text as string) ?? ""} onChange={(e) => setData("text", e.target.value)} />
          <Input label="Level (1–6)" type="number" min={1} max={6} value={(data.level as number) ?? 2} onChange={(e) => setData("level", parseInt(e.target.value, 10))} />
        </div>
      );
    case "paragraph":
      return (
        <div className="space-y-3 max-w-lg">
          <h3 className="font-semibold text-dash-text">Paragraph</h3>
          <RichTextEditor value={(data.html as string) ?? ""} onChange={(html) => setData("html", html)} placeholder="Write some text…" />
        </div>
      );
    case "image":
      return (
        <div className="space-y-3 max-w-lg">
          <h3 className="font-semibold text-dash-text">Image</h3>
          <ImageUpload label="Image" value={(data.url as string) ?? null} onChange={(url) => setData("url", url)} />
          <Input label="Alt text" value={(data.alt as string) ?? ""} onChange={(e) => setData("alt", e.target.value)} />
          <Input label="Caption" value={(data.caption as string) ?? ""} onChange={(e) => setData("caption", e.target.value)} />
        </div>
      );
    case "spacer":
      return (
        <div className="space-y-3 max-w-lg">
          <h3 className="font-semibold text-dash-text">Spacer</h3>
          <Input label="Height (px)" type="number" value={(data.height as number) ?? 40} onChange={(e) => setData("height", parseInt(e.target.value, 10))} />
        </div>
      );
    case "divider":
      return (
        <div className="space-y-3 max-w-lg">
          <h3 className="font-semibold text-dash-text">Divider</h3>
          <Input label="Style" value={(data.style as string) ?? "solid"} onChange={(e) => setData("style", e.target.value)} placeholder="solid, dashed, dotted" />
        </div>
      );
    case "button":
      return (
        <div className="space-y-3 max-w-lg">
          <h3 className="font-semibold text-dash-text">Button</h3>
          <Input label="Label" value={(data.label as string) ?? ""} onChange={(e) => setData("label", e.target.value)} />
          <Input label="URL" type="url" value={(data.url as string) ?? ""} onChange={(e) => setData("url", e.target.value)} />
        </div>
      );
    case "video":
      return (
        <div className="space-y-3 max-w-lg">
          <h3 className="font-semibold text-dash-text">Video</h3>
          <Input label="YouTube or Vimeo URL" value={(data.url as string) ?? ""} onChange={(e) => setData("url", e.target.value)} />
        </div>
      );
    case "quote":
      return (
        <div className="space-y-3 max-w-lg">
          <h3 className="font-semibold text-dash-text">Quote</h3>
          <Textarea label="Quote" value={(data.text as string) ?? ""} onChange={(e) => setData("text", e.target.value)} rows={3} />
          <Input label="Attribution" value={(data.attribution as string) ?? ""} onChange={(e) => setData("attribution", e.target.value)} />
        </div>
      );
    case "map":
      return (
        <div className="space-y-3 max-w-lg">
          <h3 className="font-semibold text-dash-text">Map</h3>
          <Input label="Address or embed URL" value={(data.address as string) ?? ""} onChange={(e) => setData("address", e.target.value)} />
        </div>
      );
    case "venue":
      return (
        <div className="space-y-3 max-w-lg">
          <h3 className="font-semibold text-dash-text">Venue</h3>
          <Input label="Venue Name" value={(data.name as string) ?? ""} onChange={(e) => setData("name", e.target.value)} />
          <Textarea label="Address" value={(data.address as string) ?? ""} onChange={(e) => setData("address", e.target.value)} rows={2} />
        </div>
      );
    case "faq":
      return (
        <div className="space-y-3 max-w-lg">
          <h3 className="font-semibold text-dash-text">FAQ</h3>
          <Input label="Question" value={(data.question as string) ?? ""} onChange={(e) => setData("question", e.target.value)} />
          <Textarea label="Answer" value={(data.answer as string) ?? ""} onChange={(e) => setData("answer", e.target.value)} rows={3} />
        </div>
      );
    default:
      return (
        <div className="max-w-lg">
          <p className="text-sm text-dash-muted">No editor available for block type: <strong>{block.type}</strong></p>
        </div>
      );
  }
}
