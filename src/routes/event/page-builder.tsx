import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import {
  Card,
  LoadingSpinner,
  ErrorState,
  Badge,
  Toggle,
} from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { uploadImage } from "../../lib/upload";
import {
  type Block,
  type BlockContent,
  BLOCK_TYPES,
  createBlock,
  blocksToJson,
  jsonToBlocks,
} from "./block-types";
import { slugify } from "../../lib/theme";
import { cn } from "../../lib/utils";

async function fetchPage(pageId: string): Promise<CustomPage> {
  const { data, error } = await supabase
    .from("custom_pages")
    .select("*")
    .eq("id", pageId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Page not found");
  return data as CustomPage;
}

export function PageBuilder() {
  const { eventId } = useEventContext();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: page, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["custom-page", pageId],
    queryFn: () => fetchPage(pageId!),
    enabled: !!pageId,
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [isFooter, setIsFooter] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setSlug(page.slug);
      setNavLabel(page.nav_label ?? "");
      setShowInNav(page.show_in_nav);
      setIsPublished(page.is_published);
      setIsFooter(page.is_footer);
      setBlocks(jsonToBlocks(page.blocks));
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .update({
          title: title.trim(),
          slug: slugify(slug) || slugify(title),
          nav_label: navLabel || null,
          show_in_nav: showInNav,
          is_published: isPublished,
          is_footer: isFooter,
          blocks: blocksToJson(blocks),
        })
        .eq("id", pageId!)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const addBlock = (type: Block["type"]) => {
    const newBlock = createBlock(type, blocks.length);
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (id: string, content: BlockContent) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, content } : b)));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i })));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = blocks.findIndex((b) => b.id === id);
    if (index === -1) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
    setBlocks(newBlocks.map((b, i) => ({ ...b, order: i })));
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    return uploadImage(file, "pages", eventId).then((r) => r?.url ?? null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load page"}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/event/${eventId}/pages`)}>
            ← Pages
          </Button>
          <h1 className="text-xl font-bold text-dash-text">Page Builder</h1>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">✓ Saved</span>}
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Page
          </Button>
        </div>
      </div>

      {/* Page Settings */}
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title"
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={slugify(title) || "page-slug"}
          />
          <Input
            label="Nav Label"
            value={navLabel}
            onChange={(e) => setNavLabel(e.target.value)}
            placeholder="Label shown in navigation"
          />
          <div className="flex items-end gap-4">
            <Toggle label="Show in Nav" checked={showInNav} onChange={setShowInNav} />
            <Toggle label="Published" checked={isPublished} onChange={setIsPublished} />
            <Toggle label="Footer" checked={isFooter} onChange={setIsFooter} />
          </div>
        </div>
      </Card>

      {/* Block Palette */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Add Block</h3>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              type="button"
              onClick={() => addBlock(bt.type)}
              className="flex items-center gap-2 rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm font-medium text-dash-text transition-colors hover:border-dash-primary hover:bg-dash-bg"
            >
              <span className="text-base">{bt.icon}</span>
              {bt.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Blocks List */}
      <div className="space-y-3">
        {blocks.length === 0 ? (
          <Card className="text-center">
            <p className="text-sm text-dash-muted">
              No blocks yet. Use the palette above to add content blocks.
            </p>
          </Card>
        ) : (
          blocks.map((block, index) => (
            <BlockEditor
              key={block.id}
              block={block}
              isSelected={selectedBlockId === block.id}
              onSelect={() => setSelectedBlockId(block.id)}
              onUpdate={(content) => updateBlock(block.id, content)}
              onDelete={() => deleteBlock(block.id)}
              onMoveUp={() => moveBlock(block.id, "up")}
              onMoveDown={() => moveBlock(block.id, "down")}
              canMoveUp={index > 0}
              canMoveDown={index < blocks.length - 1}
              onImageUpload={handleImageUpload}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface BlockEditorProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (content: BlockContent) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onImageUpload: (file: File) => Promise<string | null>;
}

function BlockEditor({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onImageUpload,
}: BlockEditorProps) {
  const meta = BLOCK_TYPES.find((b) => b.type === block.type);
  const content = block.content;

  return (
    <Card
      className={cn(
        "transition-all",
        isSelected ? "border-dash-primary ring-2 ring-dash-primary/20" : "",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onSelect}
          className="flex items-center gap-2 text-sm font-semibold text-dash-text"
        >
          <span className="text-base">{meta?.icon}</span>
          {meta?.label}
        </button>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onMoveUp} disabled={!canMoveUp}>
            ↑
          </Button>
          <Button variant="ghost" size="sm" onClick={onMoveDown} disabled={!canMoveDown}>
            ↓
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* Block-specific editors */}
      {block.type === "heading" && (
        <Input
          value={content.text ?? ""}
          onChange={(e) => onUpdate({ ...content, text: e.target.value })}
          placeholder="Heading text"
        />
      )}

      {block.type === "paragraph" && (
        <RichTextEditor
          value={content.html ?? ""}
          onChange={(html) => onUpdate({ ...content, html })}
          placeholder="Write your paragraph…"
        />
      )}

      {block.type === "image" && (
        <div className="space-y-3">
          <ImageUpload
            value={content.url}
            onChange={(url) => onUpdate({ ...content, url: url ?? "" })}
            onUpload={onImageUpload}
          />
          <Input
            label="Alt Text"
            value={content.alt ?? ""}
            onChange={(e) => onUpdate({ ...content, alt: e.target.value })}
            placeholder="Image description"
          />
          <Input
            label="Caption"
            value={content.caption ?? ""}
            onChange={(e) => onUpdate({ ...content, caption: e.target.value })}
            placeholder="Optional caption"
          />
        </div>
      )}

      {block.type === "gallery" && (
        <div className="space-y-3">
          {(content.images ?? []).map((img, i) => (
            <div key={i} className="flex items-center gap-2">
              <img src={img} alt="" className="h-16 w-16 rounded-lg object-cover" />
              <Input
                value={img}
                onChange={(e) => {
                  const images = [...(content.images ?? [])];
                  images[i] = e.target.value;
                  onUpdate({ ...content, images });
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const images = (content.images ?? []).filter((_, idx) => idx !== i);
                  onUpdate({ ...content, images });
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <ImageUpload
            value={null}
            onChange={(url) => {
              if (url) {
                onUpdate({ ...content, images: [...(content.images ?? []), url] });
              }
            }}
            onUpload={onImageUpload}
            label="Add Image"
          />
        </div>
      )}

      {block.type === "button" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Label"
            value={content.label ?? ""}
            onChange={(e) => onUpdate({ ...content, label: e.target.value })}
            placeholder="Button text"
          />
          <Input
            label="Link URL"
            value={content.href ?? ""}
            onChange={(e) => onUpdate({ ...content, href: e.target.value })}
            placeholder="https://…"
          />
        </div>
      )}

      {block.type === "video" && (
        <div className="space-y-3">
          <Input
            label="Embed URL"
            value={content.embed ?? ""}
            onChange={(e) => onUpdate({ ...content, embed: e.target.value })}
            placeholder="YouTube or Vimeo URL"
          />
          <Input
            label="Caption"
            value={content.caption ?? ""}
            onChange={(e) => onUpdate({ ...content, caption: e.target.value })}
            placeholder="Optional caption"
          />
        </div>
      )}

      {block.type === "quote" && (
        <div className="space-y-3">
          <Textarea
            label="Quote"
            value={content.text ?? ""}
            onChange={(e) => onUpdate({ ...content, text: e.target.value })}
            placeholder="Quote text"
            rows={3}
          />
          <Input
            label="Attribution"
            value={content.caption ?? ""}
            onChange={(e) => onUpdate({ ...content, caption: e.target.value })}
            placeholder="— Author"
          />
        </div>
      )}

      {block.type === "spacer" && (
        <Input
          label="Height (px)"
          type="number"
          value={content.height ?? 32}
          onChange={(e) => onUpdate({ ...content, height: parseInt(e.target.value, 10) || 32 })}
        />
      )}

      {block.type === "divider" && (
        <div className="border-t-2 border-dash-border py-2 text-center text-xs text-dash-muted">
          Divider line
        </div>
      )}
    </Card>
  );
}
