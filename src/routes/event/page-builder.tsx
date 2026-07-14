import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Input";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { ImageUpload } from "../../components/ui/ImageUpload";
import {
  Card,
  LoadingSpinner,
  ErrorState,
} from "../../components/ui";
import {
  BLOCK_TYPES,
  createBlock,
  blocksToJson,
  jsonToBlocks,
  type Block,
  type BlockType,
} from "./block-types";
import { uploadImage } from "../../lib/upload";
import { RichTextContent } from "../../lib/sanitize";
import { cn } from "../../lib/utils";

export function PageBuilder() {
  const { eventId } = useEventContext();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: page, isLoading, isError, error } = useQuery({
    queryKey: ["page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("id", pageId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Page not found");
      return data as CustomPage;
    },
    enabled: !!pageId,
  });

  const [title, setTitle] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setNavLabel(page.nav_label ?? "");
      setBlocks(jsonToBlocks(page.blocks));
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title,
          nav_label: navLabel || null,
          blocks: blocksToJson(blocks),
          updated_at: new Date().toISOString(),
        })
        .eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["pages", eventId] });
    },
  });

  const addBlock = (type: BlockType) => {
    setBlocks((prev) => [...prev, createBlock(type, prev.length)]);
    setShowBlockMenu(false);
  };

  const updateBlock = (id: string, content: Partial<Block["content"]>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...content } } : b))
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((b, i) => ({ ...b, order_index: i }));
    });
  };

  const handleImageUpload = async (blockId: string, file: File) => {
    const result = await uploadImage(file, `${eventId}/page-${pageId}-${Date.now()}`);
    if ("error" in result) {
      alert(result.error);
      return;
    }
    updateBlock(blockId, { url: result.url });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load page" description={error instanceof Error ? error.message : undefined} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/event/${eventId}/pages`)}
          className="text-sm text-dash-muted hover:text-dash-text transition-colors"
        >
          ← Pages
        </button>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved successfully!</p>
      )}

      {/* Page settings */}
      <Card className="p-4 space-y-3">
        <Input
          label="Page title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Navigation label"
          value={navLabel}
          onChange={(e) => setNavLabel(e.target.value)}
          placeholder="Label shown in navigation menu"
        />
      </Card>

      {/* Blocks */}
      <div className="space-y-3">
        {blocks.map((block, i) => (
          <Card key={block.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-dash-muted uppercase tracking-wide">
                {block.type}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => moveBlock(i, -1)} disabled={i === 0} className="text-dash-muted hover:text-dash-text disabled:opacity-30 px-2 py-1 text-sm">↑</button>
                <button onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} className="text-dash-muted hover:text-dash-text disabled:opacity-30 px-2 py-1 text-sm">↓</button>
                <button onClick={() => removeBlock(block.id)} className="text-dash-danger hover:text-dash-danger-hover px-2 py-1 text-sm">✕</button>
              </div>
            </div>
            <BlockEditor block={block} onUpdate={(c) => updateBlock(block.id, c)} onImageUpload={(file) => handleImageUpload(block.id, file)} />
          </Card>
        ))}

        {blocks.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-dash-muted mb-4">No blocks yet. Add your first block below.</p>
          </Card>
        )}

        {/* Add block */}
        <div className="relative">
          {showBlockMenu ? (
            <Card className="p-3">
              <div className="grid grid-cols-3 gap-2">
                {BLOCK_TYPES.map((bt) => (
                  <button
                    key={bt.type}
                    onClick={() => addBlock(bt.type)}
                    className="flex flex-col items-center gap-1 p-3 rounded-md border border-dash-border hover:border-dash-primary hover:bg-dash-bg transition-colors"
                  >
                    <span className="text-xl">{bt.icon}</span>
                    <span className="text-sm font-medium text-dash-text">{bt.label}</span>
                    <span className="text-xs text-dash-muted">{bt.description}</span>
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowBlockMenu(false)}>Cancel</Button>
            </Card>
          ) : (
            <Button variant="secondary" onClick={() => setShowBlockMenu(true)} className="w-full">
              + Add Block
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function BlockEditor({
  block,
  onUpdate,
  onImageUpload,
}: {
  block: Block;
  onUpdate: (content: Partial<Block["content"]>) => void;
  onImageUpload: (file: File) => void;
}) {
  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-3">
          <Input
            value={block.content.text ?? ""}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Heading text"
          />
          <div className="flex gap-2">
            {[1, 2, 3].map((lvl) => (
              <button
                key={lvl}
                onClick={() => onUpdate({ level: lvl })}
                className={cn(
                  "px-3 py-1 rounded border text-sm",
                  (block.content.level ?? 2) === lvl
                    ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                    : "border-dash-border bg-dash-surface text-dash-text"
                )}
              >
                H{lvl}
              </button>
            ))}
          </div>
        </div>
      );
    case "text":
      return (
        <RichTextEditor
          value={block.content.text ?? ""}
          onChange={(html) => onUpdate({ text: html })}
          placeholder="Write text content..."
        />
      );
    case "image":
      return (
        <ImageUpload
          value={block.content.url ?? null}
          onUpload={onImageUpload}
          onRemove={() => onUpdate({ url: null })}
          label="Image"
        />
      );
    case "gallery":
      return (
        <div className="space-y-2">
          <p className="text-sm text-dash-muted">Gallery images (add via block settings)</p>
          {(block.content.images ?? []).length === 0 && (
            <p className="text-xs text-dash-muted">No images yet.</p>
          )}
          <ImageUpload
            value={null}
            onUpload={async (file) => {
              const result = await uploadImage(file, `gallery-${Date.now()}`);
              if ("error" in result) return;
              const images = [...(block.content.images ?? []), result.url];
              onUpdate({ images });
            }}
            label="Add image to gallery"
          />
        </div>
      );
    case "divider":
      return <div className="border-t border-dash-border" />;
    case "button":
      return (
        <div className="space-y-3">
          <Input
            value={block.content.label ?? ""}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Button label"
          />
          <Input
            value={block.content.href ?? ""}
            onChange={(e) => onUpdate({ href: e.target.value })}
            placeholder="Link URL"
          />
        </div>
      );
    case "spacer":
      return (
        <Input
          type="number"
          label="Height (px)"
          value={block.content.height ?? 40}
          onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 40 })}
        />
      );
    case "video":
      return (
        <Input
          value={block.content.embedUrl ?? ""}
          onChange={(e) => onUpdate({ embedUrl: e.target.value })}
          placeholder="Embed URL (YouTube, Vimeo, etc.)"
        />
      );
    case "quote":
      return (
        <div className="space-y-3">
          <Textarea
            value={block.content.text ?? ""}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Quote text"
          />
          <Input
            value={block.content.caption ?? ""}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            placeholder="Attribution (optional)"
          />
        </div>
      );
    default:
      return null;
  }
}
