import React, { useState, useMemo } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import {
  Input,
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  Badge,
  Toggle,
} from "../../components/ui";
import { cn } from "../../lib/utils";
import {
  BLOCK_TYPES,
  createBlock,
  BlockContent,
  BlockEditor,
  blocksToJson,
  jsonToBlocks,
  type Block,
} from "./block-types";
import type { EventOutletContext } from "./event-layout";

export default function PageBuilder() {
  const { eventId } = useOutletContext<EventOutletContext>();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [blockPickerOpen, setBlockPickerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const { data: page, isLoading, error, refetch } = useQuery({
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

  // Initialize state from page data once loaded
  React.useEffect(() => {
    if (page && !loaded) {
      setTitle(page.title);
      setSlug(page.slug);
      setShowInNav(page.show_in_nav);
      setIsPublished(page.is_published);
      setBlocks(jsonToBlocks(page.blocks));
      setLoaded(true);
    }
  }, [page, loaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title,
          slug,
          show_in_nav: showInNav,
          is_published: isPublished,
          blocks: blocksToJson(blocks),
        })
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

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId]
  );

  const handleAddBlock = (type: Block["type"]) => {
    const newBlock = createBlock(type);
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setBlockPickerOpen(false);
  };

  const handleUpdateBlock = (id: string, content: Record<string, unknown>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, content } : b)));
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const handleMoveBlock = (id: string, direction: "up" | "down") => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
    setBlocks(newBlocks);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="p-4">
        <ErrorState
          title="Failed to load page"
          message={error?.message ?? "Page not found"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dash-border bg-dash-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/event/${eventId}/pages`)}
            className="rounded-lg p-2 text-dash-muted hover:bg-dash-bg hover:text-dash-text"
            aria-label="Back to pages"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-semibold text-dash-text">{title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dash-muted">/{slug}</span>
              {isPublished ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="warning">Draft</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Block list & editor */}
        <div className="lg:w-96 overflow-y-auto border-r border-dash-border bg-dash-surface">
          {/* Page settings */}
          <div className="border-b border-dash-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-dash-text">
              Page Settings
            </h3>
            <div className="space-y-3">
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                label="Slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <Toggle
                checked={showInNav}
                onChange={setShowInNav}
                label="Show in navigation"
              />
              <Toggle
                checked={isPublished}
                onChange={setIsPublished}
                label="Published"
              />
            </div>
          </div>

          {/* Block editor */}
          {selectedBlock ? (
            <div className="border-b border-dash-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-dash-text">
                  Edit Block
                </h3>
                <button
                  onClick={() => setSelectedBlockId(null)}
                  className="text-xs text-dash-muted hover:text-dash-text"
                >
                  Done
                </button>
              </div>
              <BlockEditor
                block={selectedBlock}
                onChange={(content) =>
                  handleUpdateBlock(selectedBlock.id, content)
                }
              />
            </div>
          ) : (
            <div className="border-b border-dash-border p-4">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setBlockPickerOpen(true)}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Block
              </Button>
            </div>
          )}

          {/* Block list */}
          <div className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-dash-text">
              Blocks ({blocks.length})
            </h3>
            <div className="space-y-2">
              {blocks.map((block, idx) => {
                const def = BLOCK_TYPES.find((b) => b.type === block.type);
                return (
                  <div
                    key={block.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2 transition-colors",
                      selectedBlockId === block.id
                        ? "border-dash-primary bg-dash-primary/5"
                        : "border-dash-border hover:bg-dash-bg"
                    )}
                  >
                    <button
                      onClick={() => setSelectedBlockId(block.id)}
                      className="flex flex-1 items-center gap-2 text-left"
                    >
                      <span className="text-dash-muted">{def?.icon}</span>
                      <span className="text-sm font-medium text-dash-text">
                        {def?.label ?? block.type}
                      </span>
                    </button>
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => handleMoveBlock(block.id, "up")}
                        disabled={idx === 0}
                        className="rounded p-1 text-dash-muted hover:bg-dash-bg disabled:opacity-30"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75 12 8.25l7.5 7.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveBlock(block.id, "down")}
                        disabled={idx === blocks.length - 1}
                        className="rounded p-1 text-dash-muted hover:bg-dash-bg disabled:opacity-30"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25 12 15.75 4.5 8.25" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
              {blocks.length === 0 && (
                <p className="text-sm text-dash-muted">
                  No blocks yet. Click "Add Block" to start building.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto bg-dash-bg">
          <div className="mx-auto max-w-2xl p-6">
            {blocks.length > 0 ? (
              <div className="space-y-6">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={cn(
                      "cursor-pointer rounded-lg p-3 transition-all",
                      selectedBlockId === block.id
                        ? "ring-2 ring-dash-primary"
                        : "hover:ring-1 hover:ring-dash-border"
                    )}
                  >
                    <BlockContent block={block} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center text-center">
                <div>
                  <svg className="mx-auto h-12 w-12 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9-9 0 0 0-9-9z" />
                  </svg>
                  <p className="mt-2 text-sm text-dash-muted">
                    Start building your page by adding blocks
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setBlockPickerOpen(true)}
                  >
                    Add First Block
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Block picker modal */}
      <Modal
        open={blockPickerOpen}
        onClose={() => setBlockPickerOpen(false)}
        title="Add Block"
        size="xl"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              onClick={() => handleAddBlock(bt.type)}
              className="flex flex-col items-center gap-2 rounded-lg border border-dash-border p-4 text-center transition-colors hover:border-dash-primary hover:bg-dash-primary/5"
            >
              <span className="text-dash-primary">{bt.icon}</span>
              <span className="text-sm font-medium text-dash-text">
                {bt.label}
              </span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
