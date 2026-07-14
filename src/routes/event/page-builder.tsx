import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { cn } from "../../lib/utils";
import {
  type Block,
  type BlockType,
  BLOCK_TYPES,
  createBlock,
  BlockContent,
  BlockEditor,
  normalizeBlocks,
} from "./block-types";

export default function PageBuilder() {
  const { eventId, event } = useEventContext();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Fetch the custom page
  const { data: page, isLoading, isError, refetch } = useQuery({
    queryKey: ["custom-page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("id", pageId!)
        .single();
      if (error) throw error;
      return data as {
        id: string;
        event_id: string;
        title: string;
        slug: string;
        blocks: Json;
        is_published: boolean;
        sort_order: number;
      };
    },
    enabled: !!pageId,
  });

  // Initialize blocks from page data
  useEffect(() => {
    if (page && !loaded) {
      setBlocks(normalizeBlocks(page.blocks));
      setLoaded(true);
    }
  }, [page, loaded]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({ blocks: blocks as unknown as Json })
        .eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  // Block operations
  function addBlock(type: BlockType) {
    const block = createBlock(type);
    setBlocks((prev) => [...prev, block]);
    setSelectedBlockId(block.id);
    setShowBlockPicker(false);
  }

  function updateBlock(updated: Block) {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  }

  function moveBlock(id: string, direction: "up" | "down") {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }

  function duplicateBlock(id: string) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const original = prev[idx];
      const copy = { ...original, id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` } as Block;
      const newBlocks = [...prev];
      newBlocks.splice(idx + 1, 0, copy);
      return newBlocks;
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <ErrorState
        title="Page not found"
        description="This page may have been deleted."
        onRetry={() => navigate(`/event/${eventId}/pages`)}
      />
    );
  }

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <button
            onClick={() => navigate(`/event/${eventId}/pages`)}
            className="text-sm text-dash-muted hover:text-dash-text"
          >
            ← Back to Pages
          </button>
          <h2 className="mt-1 text-xl font-semibold text-dash-text truncate">
            {page.title}
          </h2>
          <p className="text-sm text-dash-muted">/{page.slug}</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
      </div>

      {/* Status messages */}
      {saveMutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Error saving: {saveMutation.error?.message}
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          Page saved successfully!
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Preview area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dash-text">Page Content</h3>
            <Button variant="secondary" size="sm" onClick={() => setShowBlockPicker(true)}>
              + Add Block
            </Button>
          </div>

          {blocks.length === 0 ? (
            <EmptyState
              title="No blocks yet"
              description="Add blocks to build your page content."
              icon={<span className="text-4xl">🧱</span>}
              action={
                <Button variant="secondary" size="sm" onClick={() => setShowBlockPicker(true)}>
                  + Add Block
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {blocks.map((block, idx) => {
                const typeDef = BLOCK_TYPES.find((t) => t.type === block.type);
                const isSelected = selectedBlockId === block.id;
                return (
                  <div
                    key={block.id}
                    className={cn(
                      "rounded-lg border bg-dash-surface transition-all",
                      isSelected ? "border-dash-primary ring-2 ring-dash-primary/20" : "border-dash-border"
                    )}
                  >
                    {/* Block header bar */}
                    <div className="flex items-center justify-between border-b border-dash-border px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBlockId(isSelected ? null : block.id)}
                        className="flex items-center gap-2 text-sm font-medium text-dash-text"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-dash-primary/10 text-xs text-dash-primary">
                          {typeDef?.icon ?? "?"}
                        </span>
                        {typeDef?.label ?? block.type}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveBlock(block.id, "up")}
                          className="rounded p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text disabled:opacity-30"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={idx === blocks.length - 1}
                          onClick={() => moveBlock(block.id, "down")}
                          className="rounded p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text disabled:opacity-30"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateBlock(block.id)}
                          className="rounded p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text"
                          title="Duplicate"
                        >
                          ⧉
                        </button>
                        <button
                          type="button"
                          onClick={() => removeBlock(block.id)}
                          className="rounded p-1 text-dash-danger hover:bg-dash-bg"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {/* Block preview */}
                    <div
                      className="cursor-pointer p-4"
                      onClick={() => setSelectedBlockId(isSelected ? null : block.id)}
                    >
                      <BlockContent block={block} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Editor sidebar */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-dash-text">Block Editor</h3>
          {selectedBlock ? (
            <BlockEditor
              block={selectedBlock}
              onChange={updateBlock}
              onRemove={() => removeBlock(selectedBlock.id)}
            />
          ) : (
            <div className="rounded-lg border border-dash-border border-dashed bg-dash-bg/50 p-6 text-center">
              <p className="text-sm text-dash-muted">
                Select a block to edit its content, or add a new block.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Block picker modal */}
      {showBlockPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowBlockPicker(false)} />
          <div className="relative z-10 w-full max-w-2xl rounded-lg border border-dash-border bg-dash-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-dash-text">Add a Block</h2>
              <button
                onClick={() => setShowBlockPicker(false)}
                className="rounded-md p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[60vh] overflow-y-auto">
              {BLOCK_TYPES.map((bt) => (
                <button
                  key={bt.type}
                  onClick={() => addBlock(bt.type)}
                  className="flex flex-col items-start gap-1 rounded-lg border border-dash-border bg-dash-bg p-3 text-left transition-colors hover:border-dash-primary hover:bg-dash-primary/5"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-dash-primary/10 text-base text-dash-primary">
                      {bt.icon}
                    </span>
                    <span className="text-sm font-medium text-dash-text">{bt.label}</span>
                  </div>
                  <p className="text-xs text-dash-muted">{bt.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
