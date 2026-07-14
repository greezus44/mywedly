import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, LoadingSpinner, ErrorState } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { ImageUpload } from "../../components/ui/ImageUpload";
import {
  BLOCK_TYPES,
  createBlock,
  BlockContent,
  type Block,
  type BlockType,
} from "./block-types";
import { cn } from "../../lib/utils";

export default function PageBuilder() {
  const { eventId } = useEventContext();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [showBlockPicker, setShowBlockPicker] = useState(false);

  const { data: page, isLoading, isError, error } = useQuery({
    queryKey: ["custom-page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("id", pageId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Page not found.");
      return data as CustomPage;
    },
    enabled: !!pageId,
  });

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setShowInNav(page.show_in_nav);
      setIsPublished(page.is_published);
      const parsed = Array.isArray(page.blocks) ? (page.blocks as unknown as Block[]) : [];
      setBlocks(parsed);
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title,
          blocks,
          show_in_nav: showInNav,
          is_published: isPublished,
          nav_label: title,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      setSavedMsg("Saved successfully!");
      setTimeout(() => setSavedMsg(null), 3000);
    },
  });

  const addBlock = (type: BlockType) => {
    setBlocks((prev) => [...prev, createBlock(type)]);
    setShowBlockPicker(false);
  };

  const updateBlock = (id: string, props: Record<string, unknown>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, props: { ...b.props, ...props } } : b))
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = (id: string, dir: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="flex flex-col gap-4">
        <ErrorState message={error?.message ?? "Page not found."} />
        <Button variant="secondary" onClick={() => navigate(`/event/${eventId}/pages`)}>
          ← Back to Pages
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/event/${eventId}/pages`)}
          >
            ← Pages
          </Button>
          <h1 className="text-xl font-bold text-dash-text">Page Builder</h1>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-sm text-green-600">{savedMsg}</span>}
          {saveMutation.isError && (
            <span className="text-sm text-dash-danger">{saveMutation.error?.message}</span>
          )}
          <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Editor panel */}
        <div className="flex flex-col gap-4 lg:w-1/2">
          {/* Page settings */}
          <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Page Settings</h3>
            <div className="flex flex-col gap-3">
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-dash-text">
                <input
                  type="checkbox"
                  checked={showInNav}
                  onChange={(e) => setShowInNav(e.target.checked)}
                  className="h-4 w-4 rounded border-dash-border"
                />
                Show in navigation
              </label>
              <label className="flex items-center gap-2 text-sm text-dash-text">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-dash-border"
                />
                Published
              </label>
            </div>
          </div>

          {/* Blocks */}
          <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-dash-text">Blocks</h3>
              <Button size="sm" onClick={() => setShowBlockPicker(true)}>
                + Add Block
              </Button>
            </div>

            {blocks.length === 0 ? (
              <p className="py-8 text-center text-sm text-dash-muted">
                No blocks yet. Click "Add Block" to start building your page.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {blocks.map((block, idx) => (
                  <div
                    key={block.id}
                    className="rounded-md border border-dash-border bg-dash-bg p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase text-dash-muted">
                        {block.type}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveBlock(block.id, "up")}
                          disabled={idx === 0}
                          className="rounded p-1 text-dash-muted hover:bg-dash-surface disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveBlock(block.id, "down")}
                          disabled={idx === blocks.length - 1}
                          className="rounded p-1 text-dash-muted hover:bg-dash-surface disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeBlock(block.id)}
                          className="rounded p-1 text-dash-danger hover:bg-dash-surface"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <BlockEditor block={block} onChange={(props) => updateBlock(block.id, props)} eventId={eventId} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview panel */}
        <div className="lg:w-1/2">
          <h3 className="mb-2 text-sm font-semibold text-dash-text">Preview</h3>
          <div className="overflow-y-auto scrollbar-thin rounded-lg border border-dash-border bg-dash-surface p-6">
            <h2 className="mb-4 text-2xl font-bold text-dash-text">{title}</h2>
            {blocks.length === 0 ? (
              <p className="text-sm text-dash-muted">Add blocks to see your page preview.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {blocks.map((block) => (
                  <BlockContent key={block.id} block={block} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Block picker modal */}
      {showBlockPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBlockPicker(false)} />
          <div className="relative z-10 w-full max-w-2xl rounded-lg border border-dash-border bg-dash-surface shadow-xl">
            <div className="border-b border-dash-border px-5 py-3">
              <h2 className="text-base font-semibold text-dash-text">Add a Block</h2>
            </div>
            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin p-5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BLOCK_TYPES.map((bt) => (
                  <button
                    key={bt.type}
                    type="button"
                    onClick={() => addBlock(bt.type)}
                    className="flex flex-col items-center gap-2 rounded-md border border-dash-border bg-dash-bg p-4 transition-colors hover:border-dash-primary hover:bg-dash-primary/5"
                  >
                    <span className="text-2xl">{bt.icon}</span>
                    <span className="text-sm font-medium text-dash-text">{bt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end border-t border-dash-border px-5 py-3">
              <Button variant="secondary" onClick={() => setShowBlockPicker(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BlockEditor({
  block,
  onChange,
  eventId,
}: {
  block: Block;
  onChange: (props: Record<string, unknown>) => void;
  eventId: string;
}) {
  const p = block.props;

  switch (block.type) {
    case "heading":
      return (
        <div className="flex flex-col gap-2">
          <Input
            value={(p.text as string) || ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Heading text"
          />
          <div className="flex gap-2">
            <select
              value={(p.level as string) || "h2"}
              onChange={(e) => onChange({ level: e.target.value })}
              className="rounded-md border border-dash-border bg-dash-surface px-2 py-1 text-sm"
            >
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
            </select>
            <select
              value={(p.align as string) || "left"}
              onChange={(e) => onChange({ align: e.target.value })}
              className="rounded-md border border-dash-border bg-dash-surface px-2 py-1 text-sm"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      );

    case "paragraph":
      return (
        <RichTextEditor
          value={(p.text as string) || ""}
          onChange={(html) => onChange({ text: html })}
          placeholder="Paragraph text..."
        />
      );

    case "image":
      return (
        <div className="flex flex-col gap-2">
          <ImageUpload
            value={(p.url as string) || null}
            onChange={(url) => onChange({ url })}
            eventId={eventId}
            aspect="wide"
          />
          <Input
            value={(p.alt as string) || ""}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="Alt text"
          />
        </div>
      );

    case "spacer":
      return (
        <Input
          type="number"
          label="Height (px)"
          value={(p.height as number) || 32}
          onChange={(e) => onChange({ height: parseInt(e.target.value) || 32 })}
        />
      );

    case "divider":
      return (
        <select
          value={(p.style as string) || "solid"}
          onChange={(e) => onChange({ style: e.target.value })}
          className="rounded-md border border-dash-border bg-dash-surface px-2 py-1 text-sm"
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
        </select>
      );

    case "button":
      return (
        <div className="flex flex-col gap-2">
          <Input
            label="Label"
            value={(p.label as string) || ""}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Button text"
          />
          <Input
            label="URL"
            value={(p.url as string) || ""}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://..."
          />
          <select
            value={(p.style as string) || "primary"}
            onChange={(e) => onChange({ style: e.target.value })}
            className="rounded-md border border-dash-border bg-dash-surface px-2 py-1 text-sm"
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </select>
        </div>
      );

    case "quote":
      return (
        <div className="flex flex-col gap-2">
          <Textarea
            label="Quote"
            value={(p.text as string) || ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Quote text..."
          />
          <Input
            label="Author"
            value={(p.author as string) || ""}
            onChange={(e) => onChange({ author: e.target.value })}
            placeholder="Author name"
          />
        </div>
      );

    case "countdown":
      return (
        <div className="flex flex-col gap-2">
          <Input
            label="Target Date"
            type="datetime-local"
            value={(p.targetDate as string) || ""}
            onChange={(e) => onChange({ targetDate: e.target.value })}
          />
          <Input
            label="Label"
            value={(p.label as string) || ""}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Counting down to..."
          />
        </div>
      );

    case "map":
      return (
        <div className="flex flex-col gap-2">
          <Input
            label="Address"
            value={(p.address as string) || ""}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="123 Main St, City"
          />
          <Input
            label="Zoom"
            type="number"
            min={1}
            max={20}
            value={(p.zoom as number) || 15}
            onChange={(e) => onChange({ zoom: parseInt(e.target.value) || 15 })}
          />
        </div>
      );

    case "venue":
      return (
        <div className="flex flex-col gap-2">
          <Input
            label="Venue Name"
            value={(p.name as string) || ""}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <Input
            label="Address"
            value={(p.address as string) || ""}
            onChange={(e) => onChange({ address: e.target.value })}
          />
        </div>
      );

    case "video":
      return (
        <Input
          label="Video URL"
          value={(p.url as string) || ""}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="https://youtube.com/embed/..."
        />
      );

    case "rsvp-form":
      return (
        <div className="flex flex-col gap-2">
          <Input
            label="Title"
            value={(p.title as string) || ""}
            onChange={(e) => onChange({ title: e.target.value })}
          />
          <Textarea
            label="Description"
            value={(p.description as string) || ""}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
      );

    case "guest-list":
    case "schedule":
      return (
        <Input
          label="Title"
          value={(p.title as string) || ""}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      );

    case "faq": {
      const items = (p.items as { question: string; answer: string }[]) || [];
      return (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-md border border-dash-border bg-dash-surface p-2">
              <Input
                value={item.question}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], question: e.target.value };
                  onChange({ items: next });
                }}
                placeholder="Question"
              />
              <Textarea
                value={item.answer}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], answer: e.target.value };
                  onChange({ items: next });
                }}
                placeholder="Answer"
              />
              <button
                onClick={() => {
                  const next = items.filter((_, idx) => idx !== i);
                  onChange({ items: next });
                }}
                className="self-start text-xs text-dash-danger hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange({ items: [...items, { question: "", answer: "" }] })}
            className="self-start text-sm text-dash-primary hover:underline"
          >
            + Add FAQ Item
          </button>
        </div>
      );
    }

    case "columns": {
      const content = (p.content as string[]) || [];
      const count = (p.count as number) || 2;
      return (
        <div className="flex flex-col gap-2">
          <label className="text-sm">Columns: {count}</label>
          <input
            type="range"
            min={2}
            max={4}
            value={count}
            onChange={(e) => {
              const newCount = parseInt(e.target.value);
              const newContent = [...content];
              while (newContent.length < newCount) newContent.push("");
              newContent.length = newCount;
              onChange({ count: newCount, content: newContent });
            }}
            className="w-full"
          />
          {content.map((html, i) => (
            <div key={i}>
              <label className="text-xs text-dash-muted">Column {i + 1}</label>
              <RichTextEditor
                value={html}
                onChange={(h) => {
                  const next = [...content];
                  next[i] = h;
                  onChange({ content: next });
                }}
                placeholder={`Column ${i + 1} content...`}
              />
            </div>
          ))}
        </div>
      );
    }

    case "list": {
      const items = (p.items as string[]) || [];
      const ordered = p.ordered as boolean;
      return (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ordered}
              onChange={(e) => onChange({ ordered: e.target.checked })}
            />
            Ordered list
          </label>
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  onChange({ items: next });
                }}
                placeholder={`Item ${i + 1}`}
              />
              <button
                onClick={() => onChange({ items: items.filter((_, idx) => idx !== i) })}
                className="text-xs text-dash-danger"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange({ items: [...items, ""] })}
            className="self-start text-sm text-dash-primary hover:underline"
          >
            + Add Item
          </button>
        </div>
      );
    }

    case "gallery": {
      const images = (p.images as string[]) || [];
      return (
        <div className="flex flex-col gap-2">
          {images.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              <img src={url} alt="" className="h-16 w-16 rounded object-cover" />
              <Input
                value={url}
                onChange={(e) => {
                  const next = [...images];
                  next[i] = e.target.value;
                  onChange({ images: next });
                }}
                placeholder="Image URL"
                className="flex-1"
              />
              <button
                onClick={() => onChange({ images: images.filter((_, idx) => idx !== i) })}
                className="text-xs text-dash-danger"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange({ images: [...images, ""] })}
            className="self-start text-sm text-dash-primary hover:underline"
          >
            + Add Image
          </button>
          <Input
            label="Columns"
            type="number"
            min={1}
            max={6}
            value={(p.columns as number) || 3}
            onChange={(e) => onChange({ columns: parseInt(e.target.value) || 3 })}
          />
        </div>
      );
    }

    default:
      return <p className="text-xs text-dash-muted">No editor available for this block type.</p>;
  }
}
