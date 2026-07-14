import React, { useState, useEffect } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, LoadingSpinner, ErrorState, Modal, Toggle } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { cn } from "../../lib/utils";
import { BLOCK_TYPES, createBlock, BlockContent, type Block, type BlockType } from "./block-types";
import type { EventOutletContext } from "./event-layout";

export default function PageBuilder(): React.ReactElement {
  const { event, eventId } = useOutletContext<EventOutletContext>();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const { data: page, isLoading, error } = useQuery({
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

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setShowInNav(page.show_in_nav);
      const rawBlocks = (page.blocks as Block[] | null) ?? [];
      setBlocks(Array.isArray(rawBlocks) ? rawBlocks : []);
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title,
          blocks: blocks as unknown as Json,
          show_in_nav: showInNav,
        })
        .eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("custom_pages").delete().eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      navigate(`/event/${eventId}/pages`);
    },
  });

  function addBlock(type: BlockType): void {
    const block = createBlock(type);
    setBlocks([...blocks, block]);
    setEditingBlockId(block.id);
    setShowAddBlock(false);
  }

  function updateBlock(id: string, data: Record<string, unknown>): void {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...data } } : b)));
  }

  function removeBlock(id: string): void {
    setBlocks(blocks.filter((b) => b.id !== id));
  }

  function moveBlock(id: string, direction: "up" | "down"): void {
    const index = blocks.findIndex((b) => b.id === id);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);
  }

  const theme = jsonToTheme(event.draft_theme ?? event.theme);
  const editingBlock = blocks.find((b) => b.id === editingBlockId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={() => navigate(`/event/${eventId}/pages`)} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/event/${eventId}/pages`)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Pages
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-semibold"
            placeholder="Page title"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (confirm("Delete this page?")) {
                deleteMutation.mutate();
              }
            }}
            loading={deleteMutation.isPending}
          >
            Delete
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={saveMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {saveMutation.isError && (
        <div className="mb-4 rounded-md border border-dash-danger/20 bg-dash-danger/5 px-4 py-3">
          <p className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
          </p>
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">Page saved successfully</p>
        </div>
      )}

      {/* Settings bar */}
      <div className="mb-4 flex items-center gap-4">
        <Toggle
          checked={showInNav}
          onChange={setShowInNav}
          label="Show in navigation"
        />
      </div>

      {/* Split editor */}
      <div className="flex h-full min-h-[600px] w-full overflow-hidden rounded-lg border border-dash-border bg-dash-surface">
        {/* Block list / editor */}
        <div className="h-full w-1/2 overflow-y-auto scrollbar-thin border-r border-dash-border bg-dash-surface p-4 space-y-3">
          {blocks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-dash-muted mb-4">No blocks yet. Add your first block to get started.</p>
              <Button onClick={() => setShowAddBlock(true)}>Add Block</Button>
            </div>
          )}
          {blocks.map((block, index) => {
            const meta = BLOCK_TYPES.find((b) => b.type === block.type);
            return (
              <div
                key={block.id}
                className="rounded-md border border-dash-border bg-dash-bg/50 p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-dash-primary/10 text-xs text-dash-primary">
                      {meta?.icon ?? "?"}
                    </span>
                    <span className="text-xs font-medium text-dash-text">{meta?.label ?? block.type}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => moveBlock(block.id, "up")}
                      disabled={index === 0}
                      className="rounded p-1 text-dash-muted hover:bg-dash-surface disabled:opacity-30"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveBlock(block.id, "down")}
                      disabled={index === blocks.length - 1}
                      className="rounded p-1 text-dash-muted hover:bg-dash-surface disabled:opacity-30"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
                      className="rounded p-1 text-dash-muted hover:bg-dash-surface"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="rounded p-1 text-dash-danger hover:bg-dash-danger/10"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Inline block editor */}
                {editingBlockId === block.id && (
                  <BlockEditor block={block} onChange={(data) => updateBlock(block.id, data)} />
                )}
              </div>
            );
          })}
          {blocks.length > 0 && (
            <button
              onClick={() => setShowAddBlock(true)}
              className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-dash-border py-3 text-sm text-dash-muted hover:border-dash-primary/30 hover:text-dash-primary transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Block
            </button>
          )}
        </div>

        {/* Preview */}
        <div className="h-full w-1/2 overflow-y-auto scrollbar-thin">
          <EventThemeProvider initialTheme={theme}>
            <div className="guest-section space-y-6">
              {blocks.length === 0 ? (
                <p className="text-center text-event-muted">Your page preview will appear here</p>
              ) : (
                blocks.map((block) => <BlockContent key={block.id} block={block} />)
              )}
            </div>
          </EventThemeProvider>
        </div>
      </div>

      {/* Add block modal */}
      <Modal open={showAddBlock} onClose={() => setShowAddBlock(false)} title="Add Block" size="lg">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BLOCK_TYPES.map((meta) => (
            <button
              key={meta.type}
              onClick={() => addBlock(meta.type)}
              className="flex flex-col items-start gap-1 rounded-md border border-dash-border bg-dash-surface p-3 text-left transition-colors hover:border-dash-primary/30 hover:bg-dash-bg/50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded bg-dash-primary/10 text-sm text-dash-primary">
                {meta.icon}
              </span>
              <span className="text-sm font-medium text-dash-text">{meta.label}</span>
              <span className="text-xs text-dash-muted">{meta.description}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

// Inline block editor for editing block data
function BlockEditor({ block, onChange }: { block: Block; onChange: (data: Record<string, unknown>) => void }): React.ReactElement | null {
  const d = block.data;
  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <Input
            label="Text"
            value={(d.text as string) ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Heading text"
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-dash-text">Level</span>
              <select
                value={(d.level as string) ?? "h2"}
                onChange={(e) => onChange({ level: e.target.value })}
                className="rounded-md border border-dash-border bg-dash-surface px-2 py-1.5 text-sm"
              >
                <option value="h1">H1</option>
                <option value="h2">H2</option>
                <option value="h3">H3</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-dash-text">Align</span>
              <select
                value={(d.align as string) ?? "center"}
                onChange={(e) => onChange({ align: e.target.value })}
                className="rounded-md border border-dash-border bg-dash-surface px-2 py-1.5 text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>
        </div>
      );
    case "paragraph":
      return (
        <RichTextEditor
          value={(d.html as string) ?? ""}
          onChange={(html) => onChange({ html })}
          placeholder="Write paragraph content..."
        />
      );
    case "image":
      return (
        <div className="space-y-2">
          <Input
            label="Image URL"
            value={(d.url as string) ?? ""}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://..."
          />
          <Input
            label="Alt text"
            value={(d.alt as string) ?? ""}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="Image description"
          />
        </div>
      );
    case "spacer":
      return (
        <Input
          label="Height (px)"
          type="number"
          value={String(d.height ?? 40)}
          onChange={(e) => onChange({ height: Number(e.target.value) })}
        />
      );
    case "video":
      return (
        <div className="space-y-2">
          <Input
            label="Video URL"
            value={(d.url as string) ?? ""}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://youtube.com/embed/..."
          />
          <Input
            label="Title"
            value={(d.title as string) ?? ""}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>
      );
    case "button":
      return (
        <div className="space-y-2">
          <Input
            label="Button text"
            value={(d.text as string) ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
          <Input
            label="Link URL"
            value={(d.url as string) ?? ""}
            onChange={(e) => onChange({ url: e.target.value })}
          />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-dash-text">Style</span>
            <select
              value={(d.style as string) ?? "primary"}
              onChange={(e) => onChange({ style: e.target.value })}
              className="rounded-md border border-dash-border bg-dash-surface px-2 py-1.5 text-sm"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
          </label>
        </div>
      );
    case "columns":
      return (
        <div className="space-y-2">
          <label className="text-xs font-medium text-dash-text">Left column</label>
          <RichTextEditor
            value={(d.left as string) ?? ""}
            onChange={(html) => onChange({ left: html })}
            placeholder="Left content..."
          />
          <label className="text-xs font-medium text-dash-text">Right column</label>
          <RichTextEditor
            value={(d.right as string) ?? ""}
            onChange={(html) => onChange({ right: html })}
            placeholder="Right content..."
          />
        </div>
      );
    case "quote":
      return (
        <div className="space-y-2">
          <Textarea
            label="Quote text"
            value={(d.text as string) ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={2}
          />
          <Input
            label="Author"
            value={(d.author as string) ?? ""}
            onChange={(e) => onChange({ author: e.target.value })}
            placeholder="— Author name"
          />
        </div>
      );
    case "countdown":
      return (
        <Input
          label="Target date"
          type="date"
          value={(d.targetDate as string) ?? ""}
          onChange={(e) => onChange({ targetDate: e.target.value })}
        />
      );
    case "map":
      return (
        <div className="space-y-2">
          <Input
            label="Map embed URL"
            value={(d.url as string) ?? ""}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://maps.google.com/maps?..."
          />
          <Input
            label="Address"
            value={(d.address as string) ?? ""}
            onChange={(e) => onChange({ address: e.target.value })}
          />
        </div>
      );
    case "rsvp-form":
      return (
        <div className="space-y-2">
          <Input
            label="Heading"
            value={(d.heading as string) ?? ""}
            onChange={(e) => onChange({ heading: e.target.value })}
          />
          <Input
            label="Submit button text"
            value={(d.submitText as string) ?? ""}
            onChange={(e) => onChange({ submitText: e.target.value })}
          />
        </div>
      );
    case "venue":
      return (
        <div className="space-y-2">
          <Input
            label="Venue name"
            value={(d.name as string) ?? ""}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <Textarea
            label="Address"
            value={(d.address as string) ?? ""}
            onChange={(e) => onChange({ address: e.target.value })}
            rows={2}
          />
        </div>
      );
    case "divider":
    case "spacer":
      return null;
    default:
      return <p className="text-xs text-dash-muted">No editor available for this block type.</p>;
  }
}
