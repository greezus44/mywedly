import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, LoadingSpinner, ErrorState, Toggle, Badge } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import {
  BLOCK_TYPES,
  createBlock,
  jsonToBlocks,
  blocksToJson,
  type Block,
  type BlockType,
  type BlockContent,
} from "./block-types";
import { cn } from "../../lib/utils";

export function PageBuilder() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  const { data: page, isLoading, isError } = useQuery({
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
      setNavLabel(page.nav_label ?? "");
      setShowInNav(page.show_in_nav);
      setIsPublished(page.is_published);
      setCoverImage(page.cover_image_url);
      setBlocks(jsonToBlocks(page.blocks));
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title: title.trim(),
          nav_label: navLabel.trim() || null,
          show_in_nav: showInNav,
          is_published: isPublished,
          cover_image_url: coverImage,
          blocks: blocksToJson(blocks),
        })
        .eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  function addBlock(type: BlockType) {
    const block = createBlock(type);
    setBlocks([...blocks, block]);
    setSelectedBlockId(block.id);
  }

  function updateBlock(id: string, content: Partial<BlockContent>) {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...content } } : b)));
  }

  function deleteBlock(id: string) {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  }

  function moveBlock(id: string, dir: -1 | 1) {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setBlocks(next);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20">
        <ErrorState message="Failed to load page" onRetry={() => navigate(`/event/${eventId}/pages`)} />
      </div>
    );
  }

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/event/${eventId}/pages`)}
          >
            ← Back
          </Button>
          <h2 className="text-lg font-semibold text-dash-text">Page Builder</h2>
          {isPublished ? (
            <Badge variant="success">Published</Badge>
          ) : (
            <Badge variant="warning">Draft</Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-sm text-green-600">Saved!</span>}
          {saveMutation.isError && (
            <span className="text-sm text-dash-danger">Save failed</span>
          )}
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Page
          </Button>
        </div>
      </div>

      {/* Page Settings */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Navigation Label"
            value={navLabel}
            onChange={(e) => setNavLabel(e.target.value)}
            placeholder="Defaults to title"
          />
        </div>
        <div className="flex items-center gap-6 mt-4">
          <Toggle checked={showInNav} onChange={setShowInNav} label="Show in navigation" />
          <Toggle checked={isPublished} onChange={setIsPublished} label="Published" />
        </div>
        <div className="mt-4">
          <ImageUpload
            value={coverImage}
            onChange={setCoverImage}
            bucket="event-assets"
            path={`events/${eventId}/pages/${pageId}`}
            label="Cover Image"
          />
        </div>
      </Card>

      {/* Block Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Block List */}
        <div className="lg:col-span-2 space-y-3">
          {blocks.map((block, idx) => (
            <Card
              key={block.id}
              className={cn(
                "cursor-pointer transition-all",
                selectedBlockId === block.id
                  ? "border-dash-primary ring-2 ring-dash-primary"
                  : "hover:border-dash-primary",
              )}
            >
              <div
                onClick={() => setSelectedBlockId(block.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-dash-muted">
                      {idx + 1}. {BLOCK_TYPES.find((b) => b.type === block.type)?.label}
                    </span>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => moveBlock(block.id, -1)}
                      disabled={idx === 0}
                      className="p-1 text-dash-muted hover:text-dash-text disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(block.id, 1)}
                      disabled={idx === blocks.length - 1}
                      className="p-1 text-dash-muted hover:text-dash-text disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBlock(block.id)}
                      className="p-1 text-dash-danger hover:text-dash-danger-hover"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <BlockPreview block={block} />
              </div>
            </Card>
          ))}

          {blocks.length === 0 && (
            <Card>
              <p className="text-sm text-dash-muted text-center py-8">
                No blocks yet. Add a block below to start building your page.
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar: Add blocks + Edit selected */}
        <div className="space-y-4">
          {/* Block Types */}
          <Card>
            <h3 className="text-sm font-semibold text-dash-text mb-3">Add Block</h3>
            <div className="grid grid-cols-2 gap-2">
              {BLOCK_TYPES.map((bt) => (
                <button
                  key={bt.type}
                  type="button"
                  onClick={() => addBlock(bt.type)}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-dash-border bg-dash-surface hover:bg-dash-bg transition-colors text-left"
                >
                  <span className="text-base">{bt.icon}</span>
                  <span className="text-dash-text">{bt.label}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Edit Selected Block */}
          {selectedBlock && (
            <Card>
              <h3 className="text-sm font-semibold text-dash-text mb-3">
                Edit {BLOCK_TYPES.find((b) => b.type === selectedBlock.type)?.label}
              </h3>
              <BlockEditor block={selectedBlock} onChange={(c) => updateBlock(selectedBlock.id, c)} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function BlockPreview({ block }: { block: Block }) {
  const { content } = block;
  switch (block.type) {
    case "heading": {
      const Tag = (`h${content.level ?? 2}`) as keyof React.JSX.IntrinsicElements;
      return <Tag className="font-bold text-dash-text">{content.text || "(empty heading)"}</Tag>;
    }
    case "paragraph":
      return (
        <div
          className="text-sm text-dash-text"
          dangerouslySetInnerHTML={{ __html: content.text || "(empty paragraph)" }}
        />
      );
    case "image":
      return content.url ? (
        <img src={content.url} alt={content.alt ?? ""} className="max-h-32 rounded" />
      ) : (
        <p className="text-sm text-dash-muted">No image selected</p>
      );
    case "gallery":
      return (
        <p className="text-sm text-dash-muted">
          Gallery: {(content.images ?? []).length} images
        </p>
      );
    case "divider":
      return <hr className="border-dash-border" />;
    case "button":
      return (
        <span className="inline-block px-4 py-2 rounded bg-dash-primary text-dash-primary-fg text-sm">
          {content.label || "Button"}
        </span>
      );
    case "spacer":
      return <div style={{ height: content.height ?? 40 }} />;
    case "quote":
      return (
        <blockquote className="text-sm text-dash-muted italic">
          {content.text || "(empty quote)"}
        </blockquote>
      );
    case "video":
      return <p className="text-sm text-dash-muted">Video: {content.videoUrl || "No URL"}</p>;
    case "list":
      return (
        <p className="text-sm text-dash-muted">
          List: {(content.items ?? []).length} items
        </p>
      );
    default:
      return null;
  }
}

function BlockEditor({
  block,
  onChange,
}: {
  block: Block;
  onChange: (content: Partial<BlockContent>) => void;
}) {
  const { content } = block;

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-3">
          <Input
            label="Text"
            value={content.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1.5">Level</label>
            <select
              value={content.level ?? 2}
              onChange={(e) => onChange({ level: Number(e.target.value) as 1 | 2 | 3 })}
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
            >
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </div>
        </div>
      );
    case "paragraph":
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-dash-text">Content</label>
          <RichTextEditor
            value={content.text ?? ""}
            onChange={(html) => onChange({ text: html })}
          />
        </div>
      );
    case "image":
      return (
        <div className="space-y-3">
          <ImageUpload
            value={content.url ?? null}
            onChange={(url) => onChange({ url: url ?? "" })}
            bucket="event-assets"
            path="page-blocks"
            label="Image"
          />
          <Input
            label="Alt Text"
            value={content.alt ?? ""}
            onChange={(e) => onChange({ alt: e.target.value })}
          />
          <Input
            label="Caption"
            value={content.caption ?? ""}
            onChange={(e) => onChange({ caption: e.target.value })}
          />
        </div>
      );
    case "button":
      return (
        <div className="space-y-3">
          <Input
            label="Label"
            value={content.label ?? ""}
            onChange={(e) => onChange({ label: e.target.value })}
          />
          <Input
            label="Link URL"
            value={content.href ?? ""}
            onChange={(e) => onChange({ href: e.target.value })}
          />
        </div>
      );
    case "quote":
      return (
        <Textarea
          label="Quote Text"
          value={content.text ?? ""}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      );
    case "spacer":
      return (
        <Input
          label="Height (px)"
          type="number"
          value={content.height ?? 40}
          onChange={(e) => onChange({ height: Number(e.target.value) })}
        />
      );
    case "video":
      return (
        <Input
          label="Video URL"
          value={content.videoUrl ?? ""}
          onChange={(e) => onChange({ videoUrl: e.target.value })}
          placeholder="https://youtube.com/..."
        />
      );
    case "list":
      return (
        <Textarea
          label="Items (one per line)"
          value={(content.items ?? []).join("\n")}
          onChange={(e) => onChange({ items: e.target.value.split("\n").filter(Boolean) })}
        />
      );
    default:
      return <p className="text-sm text-dash-muted">No editor for this block type.</p>;
  }
}
