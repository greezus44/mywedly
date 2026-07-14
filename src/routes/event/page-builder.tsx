import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import {
  Block,
  BlockType,
  BLOCK_TYPES,
  createBlock,
  blocksToJson,
  jsonToBlocks,
} from "./block-types";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { Card, LoadingSpinner, ErrorState } from "../../components/ui";
import { cn } from "../../lib/utils";

export function PageBuilder() {
  const { eventId } = useEventContext();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const {
    data: page,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["custom-page", pageId],
    enabled: !!pageId,
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("id", pageId!)
        .maybeSingle();
      if (queryError) throw queryError;
      if (!data) throw new Error("Page not found");
      return data as CustomPage;
    },
  });

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setNavLabel(page.nav_label ?? "");
      setShowInNav(page.show_in_nav);
      setCoverImage(page.cover_image_url);
      setBlocks(jsonToBlocks(page.blocks));
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error: updateError } = await supabase
        .from("custom_pages")
        .update({
          title,
          nav_label: navLabel || title,
          show_in_nav: showInNav,
          cover_image_url: coverImage,
          blocks: blocksToJson(blocks),
          updated_at: new Date().toISOString(),
        })
        .eq("id", pageId!);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  const addBlock = (type: BlockType) => {
    setBlocks((prev) => [...prev, createBlock(type)]);
  };

  const updateBlock = (id: string, data: Record<string, unknown>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...data } } : b))
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
      const newBlocks = [...prev];
      [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
      return newBlocks;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Failed to load"} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(`/event/${eventId}/pages`)}
            className="text-sm text-dash-muted hover:text-dash-text"
          >
            ← Pages
          </button>
          <h2 className="mt-1 text-xl font-semibold text-dash-text">Page Builder</h2>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Page
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Page saved!</p>
      )}

      {/* Page settings */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text">Page Settings</h3>
        <div className="mt-4 space-y-4">
          <Input
            label="Title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Nav Label"
            type="text"
            value={navLabel}
            onChange={(e) => setNavLabel(e.target.value)}
            placeholder="Label shown in navigation"
          />
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={showInNav}
              onChange={(e) => setShowInNav(e.target.checked)}
              className="h-4 w-4 rounded border-dash-border"
            />
            <span className="text-sm text-dash-text">Show in navigation</span>
          </label>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Cover Image</label>
            <ImageUpload
              bucket="event-assets"
              path={`${eventId}/pages/${pageId}/cover`}
              value={coverImage}
              onUpload={setCoverImage}
              onRemove={() => setCoverImage(null)}
              aspectRatio="wide"
            />
          </div>
        </div>
      </Card>

      {/* Block types */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text">Add Block</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              type="button"
              onClick={() => addBlock(bt.type)}
              className="flex items-center gap-2 rounded-lg border border-dash-border px-3 py-2 text-sm text-dash-text transition-colors hover:bg-dash-bg"
              title={bt.description}
            >
              <span>{bt.icon}</span>
              <span>{bt.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Blocks */}
      <div className="space-y-4">
        {blocks.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-dash-muted">
              No blocks yet. Add a block above to start building your page.
            </p>
          </Card>
        ) : (
          blocks.map((block, index) => (
            <Card key={block.id}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-dash-text capitalize">
                  {block.type}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => moveBlock(block.id, "up")}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={index === blocks.length - 1}
                    onClick={() => moveBlock(block.id, "down")}
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => removeBlock(block.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <BlockEditor block={block} onChange={(data) => updateBlock(block.id, data)} eventId={eventId} pageId={pageId!} />
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

interface BlockEditorProps {
  block: Block;
  onChange: (data: Record<string, unknown>) => void;
  eventId: string;
  pageId: string;
}

function BlockEditor({ block, onChange, eventId, pageId }: BlockEditorProps) {
  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-3">
          <Input
            type="text"
            value={(block.data.text as string) ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Heading text"
          />
          <div className="flex gap-2">
            <select
              value={(block.data.level as string) ?? "h2"}
              onChange={(e) => onChange({ level: e.target.value })}
              className="rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm"
            >
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
            </select>
            <select
              value={(block.data.align as string) ?? "left"}
              onChange={(e) => onChange({ align: e.target.value })}
              className="rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm"
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
          value={(block.data.html as string) ?? ""}
          onChange={(html) => onChange({ html })}
          placeholder="Write your text..."
        />
      );
    case "image":
      return (
        <div className="space-y-3">
          <ImageUpload
            bucket="event-assets"
            path={`${eventId}/pages/${pageId}/${block.id}`}
            value={(block.data.url as string) || null}
            onUpload={(url) => onChange({ url })}
            onRemove={() => onChange({ url: "" })}
            aspectRatio="auto"
          />
          <Input
            type="text"
            value={(block.data.caption as string) ?? ""}
            onChange={(e) => onChange({ caption: e.target.value })}
            placeholder="Caption (optional)"
          />
          <Input
            type="text"
            value={(block.data.alt as string) ?? ""}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="Alt text (optional)"
          />
        </div>
      );
    case "gallery":
      return (
        <div className="space-y-2">
          <p className="text-sm text-dash-muted">Gallery images (add up to 6)</p>
          <div className="grid grid-cols-3 gap-2">
            {((block.data.images as string[]) ?? []).map((img, i) => (
              <div key={i} className="relative">
                <img src={img} alt="" className="aspect-square rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    const imgs = (block.data.images as string[]) ?? [];
                    onChange({ images: imgs.filter((_, idx) => idx !== i) });
                  }}
                  className="absolute right-1 top-1 rounded bg-black/50 px-1 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            {((block.data.images as string[]) ?? []).length < 6 && (
              <ImageUpload
                bucket="event-assets"
                path={`${eventId}/pages/${pageId}/${block.id}-${Date.now()}`}
                value={null}
                onUpload={(url) => {
                  const imgs = (block.data.images as string[]) ?? [];
                  onChange({ images: [...imgs, url] });
                }}
                aspectRatio="square"
              />
            )}
          </div>
        </div>
      );
    case "button":
      return (
        <div className="space-y-3">
          <Input
            type="text"
            value={(block.data.text as string) ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Button text"
          />
          <Input
            type="text"
            value={(block.data.url as string) ?? ""}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://..."
          />
          <select
            value={(block.data.align as string) ?? "center"}
            onChange={(e) => onChange({ align: e.target.value })}
            className="rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      );
    case "quote":
      return (
        <div className="space-y-3">
          <Textarea
            value={(block.data.text as string) ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Quote text"
          />
          <Input
            type="text"
            value={(block.data.author as string) ?? ""}
            onChange={(e) => onChange({ author: e.target.value })}
            placeholder="Author (optional)"
          />
        </div>
      );
    case "divider":
      return <hr className="border-dash-border" />;
    case "spacer":
      return (
        <div>
          <Input
            type="number"
            value={(block.data.height as number) ?? 40}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
            label="Height (px)"
          />
        </div>
      );
    default:
      return null;
  }
}
