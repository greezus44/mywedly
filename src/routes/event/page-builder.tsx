import { useState } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card, LoadingSpinner, ErrorState, Toggle } from "../../components/ui";
import {
  BLOCK_TYPES,
  createBlock,
  BlockContent,
  type Block,
  type BlockType,
} from "./block-types";

export default function PageBuilder() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: page, isLoading, isError, error } = useQuery({
    queryKey: ["custom-page", pageId],
    enabled: !!pageId,
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
  });

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [saved, setSaved] = useState(false);

  if (page && !initialized) {
    setTitle(page.title);
    setNavLabel(page.nav_label ?? page.title);
    setShowInNav(page.show_in_nav);
    setIsPublished(page.is_published);
    setBlocks((page.blocks as Block[]) ?? []);
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title,
          nav_label: navLabel,
          show_in_nav: showInNav,
          is_published: isPublished,
          blocks: blocks as unknown as Json,
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

  function addBlock(type: BlockType) {
    setBlocks([...blocks, createBlock(type)]);
  }
  function updateBlock(id: string, updates: Partial<Block>) {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }
  function removeBlock(id: string) {
    setBlocks(blocks.filter((b) => b.id !== id));
  }
  function moveBlock(id: string, dir: "up" | "down") {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const newIdx = dir === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
    setBlocks(newBlocks);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20">
        <ErrorState message={error?.message} onRetry={() => navigate(`/event/${eventId}/pages`)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/event/${eventId}/pages`)}
          className="text-sm text-dash-muted hover:text-dash-text"
        >
          ← Pages
        </button>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          {saveMutation.isError && (
            <span className="text-sm text-red-600">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed."}
            </span>
          )}
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Page settings */}
      <Card className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Page Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Nav Label" value={navLabel} onChange={(e) => setNavLabel(e.target.value)} />
        </div>
        <div className="flex items-center gap-4">
          <Toggle checked={showInNav} onChange={setShowInNav} label="Show in navigation" />
          <Toggle checked={isPublished} onChange={setIsPublished} label="Published" />
        </div>
      </Card>

      {/* Block palette */}
      <Card className="p-3">
        <p className="mb-2 text-xs font-medium text-dash-muted">Add Block:</p>
        <div className="flex flex-wrap gap-1.5">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              onClick={() => addBlock(bt.type)}
              className="inline-flex items-center gap-1 rounded-md border border-dash-border bg-dash-surface px-2.5 py-1.5 text-xs font-medium text-dash-text transition-colors hover:bg-dash-bg"
            >
              <span>{bt.icon}</span>
              {bt.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Blocks */}
      {blocks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-dash-muted">
            No blocks yet. Use the palette above to add content blocks to your page.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, idx) => {
            const bt = BLOCK_TYPES.find((b) => b.type === block.type);
            return (
              <Card key={block.id} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{bt?.icon}</span>
                    <span className="text-sm font-medium text-dash-text">{bt?.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" disabled={idx === 0}
                      onClick={() => moveBlock(block.id, "up")}>↑</Button>
                    <Button size="sm" variant="ghost" disabled={idx === blocks.length - 1}
                      onClick={() => moveBlock(block.id, "down")}>↓</Button>
                    <Button size="sm" variant="ghost" onClick={() => removeBlock(block.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
                <BlockContent
                  block={block}
                  eventId={eventId}
                  onUpdate={(updates) => updateBlock(block.id, updates)}
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
