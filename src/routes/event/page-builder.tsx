import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useOutletContext } from "./event-layout";
import {
  BLOCK_TYPES,
  createBlock,
  BlockContent,
  type Block,
} from "./block-types";
import { Button } from "../../components/ui/Button";
import {
  Modal,
  Input,
  Textarea,
  LoadingSpinner,
  ErrorState,
} from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { cn } from "../../lib/utils";

export default function PageBuilder() {
  const { eventId, event } = useOutletContext();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [title, setTitle] = useState("");

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ["custom_page", pageId],
    enabled: !!pageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("id", pageId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Page not found");
      return data;
    },
  });

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      const pageBlocks = Array.isArray(page.blocks)
        ? (page.blocks as Block[])
        : [];
      setBlocks(pageBlocks);
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .update({
          title: title,
          nav_label: title,
          blocks: blocks as unknown as Json,
        })
        .eq("id", pageId!)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom_pages", eventId] });
    },
  });

  const handleAddBlock = (type: Block["type"]) => {
    const newBlock = createBlock(type);
    setBlocks((b) => [...b, newBlock]);
    setShowAddBlock(false);
    setEditingBlock(newBlock);
  };

  const handleUpdateBlock = (id: string, data: Record<string, unknown>) => {
    setBlocks((b) =>
      b.map((block) =>
        block.id === id ? { ...block, data: { ...block.data, ...data } } : block
      )
    );
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((b) => b.filter((block) => block.id !== id));
  };

  const handleMoveBlock = (id: string, direction: "up" | "down") => {
    setBlocks((b) => {
      const index = b.findIndex((block) => block.id === id);
      if (index === -1) return b;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= b.length) return b;
      const newBlocks = [...b];
      [newBlocks[index], newBlocks[newIndex]] = [
        newBlocks[newIndex],
        newBlocks[index],
      ];
      return newBlocks;
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Failed to load page" />;
  }

  const previewTheme = jsonToTheme(event.draft_theme ?? event.theme);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/event/${eventId}/pages`)}>
            ← Back
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-64"
            placeholder="Page title"
          />
        </div>
        <div className="flex items-center gap-2">
          {saveMutation.isError && (
            <span className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </span>
          )}
          {saveMutation.isSuccess && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Block list / editor */}
        <div className="w-1/2 overflow-y-auto scrollbar-thin rounded-lg border border-dash-border bg-dash-bg p-4">
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="mb-4 text-sm text-dash-muted">
                No blocks yet. Add your first block to get started.
              </p>
              <Button onClick={() => setShowAddBlock(true)}>Add Block</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  className="rounded-md border border-dash-border bg-dash-surface p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-dash-muted">
                      {BLOCK_TYPES.find((b) => b.type === block.type)?.label ?? block.type}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMoveBlock(block.id, "up")}
                        disabled={index === 0}
                        className="rounded p-1 text-dash-muted hover:bg-dash-bg disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveBlock(block.id, "down")}
                        disabled={index === blocks.length - 1}
                        className="rounded p-1 text-dash-muted hover:bg-dash-bg disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => setEditingBlock(block)}
                        className="rounded p-1 text-dash-muted hover:bg-dash-bg"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="rounded p-1 text-dash-danger hover:bg-dash-bg"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <BlockContent block={block} />
                </div>
              ))}
              <Button
                variant="secondary"
                onClick={() => setShowAddBlock(true)}
              >
                + Add Block
              </Button>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto scrollbar-thin rounded-lg border border-dash-border">
          <EventThemeProvider initialTheme={previewTheme}>
            <div className="p-6">
              <h1 className="mb-6 text-3xl font-bold text-event-heading">
                {title}
              </h1>
              {blocks.map((block) => (
                <div key={block.id} className="mb-4">
                  <BlockContent block={block} />
                </div>
              ))}
            </div>
          </EventThemeProvider>
        </div>
      </div>

      {/* Add block modal */}
      <Modal
        open={showAddBlock}
        onClose={() => setShowAddBlock(false)}
        title="Add Block"
        size="lg"
      >
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              onClick={() => handleAddBlock(bt.type)}
              className="flex flex-col items-center gap-1 rounded-md border border-dash-border p-3 text-center hover:bg-dash-bg"
            >
              <span className="text-2xl">{bt.icon}</span>
              <span className="text-xs font-medium text-dash-text">
                {bt.label}
              </span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Block editor modal */}
      {editingBlock && (
        <BlockEditorModal
          block={editingBlock}
          onChange={(data) =>
            handleUpdateBlock(editingBlock.id, data)
          }
          onClose={() => setEditingBlock(null)}
        />
      )}
    </div>
  );
}

const selectCls = "w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text";

function BlockEditorModal({
  block,
  onChange,
  onClose,
}: {
  block: Block;
  onChange: (data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const d = block.data;
  const s = (key: string) => (d[key] as string) || "";

  const renderField = () => {
    switch (block.type) {
      case "heading":
        return (
          <>
            <Input label="Text" value={s("text")} onChange={(e) => onChange({ text: e.target.value })} placeholder="Heading text" autoFocus />
            <div>
              <label className="mb-1 block text-sm font-medium text-dash-text">Level</label>
              <select value={String(d.level ?? 2)} onChange={(e) => onChange({ level: Number(e.target.value) })} className={selectCls}>
                <option value="1">H1</option><option value="2">H2</option><option value="3">H3</option>
              </select>
            </div>
          </>
        );
      case "paragraph":
        return (
          <div>
            <label className="mb-1 block text-sm font-medium text-dash-text">Content</label>
            <RichTextEditor value={s("text")} onChange={(html) => onChange({ text: html })} placeholder="Write your paragraph..." />
          </div>
        );
      case "image":
        return (
          <>
            <Input label="Image URL" value={s("url")} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://..." autoFocus />
            <Input label="Alt Text" value={s("alt")} onChange={(e) => onChange({ alt: e.target.value })} placeholder="Image description" />
          </>
        );
      case "spacer":
        return <Input label="Height (px)" type="number" value={String(d.height ?? 32)} onChange={(e) => onChange({ height: Number(e.target.value) })} autoFocus />;
      case "video":
        return (
          <>
            <Input label="Video URL" value={s("url")} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://..." autoFocus />
            <Input label="Caption" value={s("caption")} onChange={(e) => onChange({ caption: e.target.value })} />
          </>
        );
      case "button":
        return (
          <>
            <Input label="Button Text" value={s("text")} onChange={(e) => onChange({ text: e.target.value })} autoFocus />
            <Input label="URL" value={s("url")} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://..." />
            <div>
              <label className="mb-1 block text-sm font-medium text-dash-text">Style</label>
              <select value={s("style") || "primary"} onChange={(e) => onChange({ style: e.target.value })} className={selectCls}>
                <option value="primary">Primary</option><option value="outline">Outline</option>
              </select>
            </div>
          </>
        );
      case "columns":
        return (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-dash-text">Left Column</label>
              <RichTextEditor value={s("left")} onChange={(html) => onChange({ left: html })} placeholder="Left content..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dash-text">Right Column</label>
              <RichTextEditor value={s("right")} onChange={(html) => onChange({ right: html })} placeholder="Right content..." />
            </div>
          </>
        );
      case "quote":
        return (
          <>
            <Textarea label="Quote" value={s("text")} onChange={(e) => onChange({ text: e.target.value })} placeholder="Quote text" />
            <Input label="Author" value={s("author")} onChange={(e) => onChange({ author: e.target.value })} placeholder="Author name" />
          </>
        );
      case "countdown":
        return <Input label="Target Date" type="datetime-local" value={s("targetDate")} onChange={(e) => onChange({ targetDate: e.target.value })} autoFocus />;
      case "map":
        return (
          <>
            <Input label="Address" value={s("address")} onChange={(e) => onChange({ address: e.target.value })} placeholder="123 Main St, City" autoFocus />
            <Input label="Zoom Level" type="number" value={String(d.zoom ?? 15)} onChange={(e) => onChange({ zoom: Number(e.target.value) })} />
          </>
        );
      case "venue":
        return (
          <>
            <Input label="Venue Name" value={s("name")} onChange={(e) => onChange({ name: e.target.value })} autoFocus />
            <Input label="Address" value={s("address")} onChange={(e) => onChange({ address: e.target.value })} />
          </>
        );
      default:
        return <p className="text-sm text-dash-muted">This block type has no editable fields. It will be rendered automatically on the guest page.</p>;
    }
  };

  return (
    <Modal open onClose={onClose} title="Edit Block" size="lg">
      <div className="flex flex-col gap-4">
        {renderField()}
        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
}
