import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { UserEvent, CustomPage, Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Card,
  LoadingSpinner,
  ErrorState,
  Modal,
} from "../../components/ui";
import { RichTextContent } from "../../lib/sanitize";
import {
  type Block,
  type BlockType,
  BLOCK_TYPES,
  createBlock,
  blocksToJson,
  jsonToBlocks,
} from "./block-types";
import { cn } from "../../lib/utils";

export function PageBuilder() {
  const { eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [blockPickerOpen, setBlockPickerOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const {
    data: page,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["custom-page", pageId],
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

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setSlug(page.slug);
      setNavLabel(page.nav_label || page.title);
      setShowInNav(page.show_in_nav);
      setBlocks(jsonToBlocks(page.blocks));
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title,
          slug,
          nav_label: navLabel,
          show_in_nav: showInNav,
          blocks: blocksToJson(blocks),
          updated_at: new Date().toISOString(),
        })
        .eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  const addBlock = (type: BlockType) => {
    const newBlock = createBlock(type);
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    setBlockPickerOpen(false);
  };

  const updateBlock = (id: string, content: Partial<Block["content"]>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...content } } : b))
    );
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const newBlocks = [...prev];
      [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
      return newBlocks;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load page" onRetry={() => refetch()} />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/event/${eventId}/pages`)}
            className="text-sm text-dash-muted hover:text-dash-text transition-colors"
          >
            ← Pages
          </button>
          <h2 className="text-lg font-semibold text-dash-text">Page Builder</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setBlockPickerOpen(true)}
          >
            + Add Block
          </Button>
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Page
          </Button>
        </div>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger mb-4">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600 mb-4">Page saved!</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Page settings */}
        <Card className="p-5 lg:col-span-1 h-fit">
          <h3 className="text-sm font-semibold text-dash-text mb-4">Page Settings</h3>
          <div className="space-y-3">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label="URL Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <Input
              label="Nav Label"
              value={navLabel}
              onChange={(e) => setNavLabel(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-dash-text">
              <input
                type="checkbox"
                checked={showInNav}
                onChange={(e) => setShowInNav(e.target.checked)}
                className="rounded"
              />
              Show in navigation
            </label>
          </div>
        </Card>

        {/* Blocks */}
        <div className="lg:col-span-2 space-y-3">
          {blocks.length > 0 ? (
            blocks.map((block, idx) => (
              <BlockEditor
                key={block.id}
                block={block}
                index={idx}
                total={blocks.length}
                isSelected={selectedBlockId === block.id}
                onSelect={() => setSelectedBlockId(block.id)}
                onUpdate={(content) => updateBlock(block.id, content)}
                onDelete={() => deleteBlock(block.id)}
                onMove={(dir) => moveBlock(block.id, dir)}
              />
            ))
          ) : (
            <Card className="p-10 text-center">
              <p className="text-sm text-dash-muted mb-4">
                No blocks yet. Add your first block to start building this page.
              </p>
              <Button onClick={() => setBlockPickerOpen(true)}>+ Add Block</Button>
            </Card>
          )}
        </div>
      </div>

      {/* Block picker modal */}
      <Modal
        open={blockPickerOpen}
        onClose={() => setBlockPickerOpen(false)}
        title="Add a Block"
        size="lg"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {BLOCK_TYPES.map((meta) => (
            <button
              key={meta.type}
              type="button"
              onClick={() => addBlock(meta.type)}
              className="rounded-lg border border-dash-border bg-dash-surface p-4 text-left hover:border-dash-primary hover:shadow-sm transition-all"
            >
              <div className="text-2xl mb-2">{meta.icon}</div>
              <div className="text-sm font-semibold text-dash-text">{meta.label}</div>
              <div className="text-xs text-dash-muted mt-1">{meta.description}</div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

// ---- Block Editor ----
interface BlockEditorProps {
  block: Block;
  index: number;
  total: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (content: Partial<Block["content"]>) => void;
  onDelete: () => void;
  onMove: (dir: "up" | "down") => void;
}

function BlockEditor({
  block,
  index,
  total,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onMove,
}: BlockEditorProps) {
  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all",
        isSelected ? "border-dash-primary ring-2 ring-dash-primary/20" : ""
      )}
    >
      <div onClick={onSelect}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-dash-muted uppercase tracking-wide">
            {block.type}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMove("up"); }}
              disabled={index === 0}
              className="rounded p-1 text-dash-muted hover:bg-dash-bg disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMove("down"); }}
              disabled={index === total - 1}
              className="rounded p-1 text-dash-muted hover:bg-dash-bg disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="rounded p-1 text-dash-danger hover:bg-red-50"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Block-specific editing */}
        <BlockContentEditor block={block} onUpdate={onUpdate} />
      </div>
    </Card>
  );
}

function BlockContentEditor({
  block,
  onUpdate,
}: {
  block: Block;
  onUpdate: (content: Partial<Block["content"]>) => void;
}) {
  const c = block.content;

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={c.text ?? ""}
            onChange={(e) => onUpdate({ text: e.target.value })}
            className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-lg font-semibold text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
            placeholder="Heading text..."
          />
          <div className="flex gap-2">
            {([1, 2, 3] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onUpdate({ level: lvl })}
                className={cn(
                  "rounded border px-2 py-1 text-xs font-medium",
                  c.level === lvl
                    ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                    : "border-dash-border text-dash-muted"
                )}
              >
                H{lvl}
              </button>
            ))}
          </div>
        </div>
      );

    case "paragraph":
      return (
        <textarea
          value={c.text ?? ""}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
          placeholder="Paragraph text..."
          rows={3}
        />
      );

    case "image":
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={c.src ?? ""}
            onChange={(e) => onUpdate({ src: e.target.value })}
            className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
            placeholder="Image URL..."
          />
          <input
            type="text"
            value={c.alt ?? ""}
            onChange={(e) => onUpdate({ alt: e.target.value })}
            className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
            placeholder="Alt text..."
          />
        </div>
      );

    case "divider":
      return <hr className="border-dash-border" />;

    case "spacer":
      return (
        <div>
          <label className="block text-xs text-dash-muted mb-1">Height: {c.height ?? 32}px</label>
          <input
            type="range"
            min={8}
            max={128}
            step={8}
            value={c.height ?? 32}
            onChange={(e) => onUpdate({ height: parseInt(e.target.value) })}
            className="w-full accent-dash-primary"
          />
        </div>
      );

    case "button":
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={c.label ?? ""}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
            placeholder="Button label..."
          />
          <input
            type="text"
            value={c.href ?? ""}
            onChange={(e) => onUpdate({ href: e.target.value })}
            className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
            placeholder="Link URL..."
          />
        </div>
      );

    case "quote":
      return (
        <textarea
          value={c.text ?? ""}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm italic text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
          placeholder="Quote text..."
          rows={2}
        />
      );

    default:
      return null;
  }
}
