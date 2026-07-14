import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Card, Badge, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import {
  BLOCK_TYPES,
  createBlock,
  blocksToJson,
  jsonToBlocks,
  type Block,
  type BlockType,
} from "./block-types";
import { cn } from "../../lib/utils";

export function PageBuilder() {
  const { eventId } = useEventContext();
  const { pageId } = useParams<{ pageId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [navLabel, setNavLabel] = useState("");

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
      setNavLabel(page.nav_label ?? "");
      setBlocks(jsonToBlocks(page.blocks));
    }
  }, [page]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title,
          nav_label: navLabel || null,
          blocks: blocksToJson(blocks),
        })
        .eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title,
          nav_label: navLabel || null,
          blocks: blocksToJson(blocks),
          is_published: true,
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
    setBlocks([...blocks, createBlock(type)]);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const updateBlock = (id: string, content: Partial<Block["content"]>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...content } } : b)));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" size="sm" onClick={() => navigate(`/event/${eventId}/pages`)}>
          ← Back to Pages
        </Button>
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/event/${eventId}/pages`)}
          >
            ← Back
          </Button>
          <h2 className="text-xl font-semibold text-dash-text">Page Builder</h2>
          {page.is_published && <Badge color="success">Published</Badge>}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => updateMutation.mutate()}
            loading={updateMutation.isPending}
          >
            Save Draft
          </Button>
          <Button
            onClick={() => publishMutation.mutate()}
            loading={publishMutation.isPending}
          >
            Publish Page
          </Button>
        </div>
      </div>

      {updateMutation.isError && (
        <p className="text-sm text-red-600">Failed to save</p>
      )}
      {updateMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved!</p>
      )}

      {/* Page Settings */}
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Nav Label"
            value={navLabel}
            onChange={(e) => setNavLabel(e.target.value)}
            placeholder="Label shown in navigation"
          />
        </div>
      </Card>

      {/* Block Palette */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Add Block</h3>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              onClick={() => addBlock(bt.type)}
              className="flex items-center gap-2 rounded-md border border-dash-border px-3 py-2 text-sm font-medium text-dash-text transition-colors hover:bg-dash-bg"
            >
              <span className="text-lg">{bt.icon}</span>
              {bt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Blocks */}
      {blocks.length === 0 ? (
        <EmptyState
          title="No blocks yet"
          description="Add blocks above to build your page."
        />
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <Card key={block.id}>
              <div className="mb-3 flex items-center justify-between">
                <Badge color="primary">{block.type}</Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(index, "up")}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(index, "down")}
                    disabled={index === blocks.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBlock(block.id)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
              <BlockEditor block={block} onChange={updateBlock} eventId={eventId} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Block Editor ────────────────────────────────────────────────────────────

interface BlockEditorProps {
  block: Block;
  onChange: (id: string, content: Partial<Block["content"]>) => void;
  eventId: string;
}

function BlockEditor({ block, onChange, eventId }: BlockEditorProps) {
  const { id, type, content } = block;

  switch (type) {
    case "heading":
      return (
        <div className="space-y-3">
          <Input
            value={content.text ?? ""}
            onChange={(e) => onChange(id, { text: e.target.value })}
            placeholder="Heading text"
          />
          <div className="flex gap-2">
            {(["left", "center", "right"] as const).map((a) => (
              <Button
                key={a}
                variant={content.align === a ? "primary" : "secondary"}
                size="sm"
                onClick={() => onChange(id, { align: a })}
              >
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </Button>
            ))}
            {(["sm", "md", "lg"] as const).map((s) => (
              <Button
                key={s}
                variant={content.size === s ? "primary" : "secondary"}
                size="sm"
                onClick={() => onChange(id, { size: s })}
              >
                {s.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      );

    case "paragraph":
      return (
        <RichTextEditor
          value={content.html ?? ""}
          onChange={(html) => onChange(id, { html })}
          placeholder="Write your text..."
        />
      );

    case "image":
      return (
        <div className="space-y-3">
          <ImageUpload
            bucket="event-assets"
            pathPrefix={`events/${eventId}/pages`}
            value={content.src ?? null}
            onChange={(src) => onChange(id, { src: src ?? undefined })}
            label="Image"
            aspectRatio="16/9"
          />
          <Input
            value={content.alt ?? ""}
            onChange={(e) => onChange(id, { alt: e.target.value })}
            placeholder="Alt text (for accessibility)"
          />
        </div>
      );

    case "gallery":
      return (
        <div className="space-y-3">
          <p className="text-sm text-dash-muted">Gallery images:</p>
          {(content.images ?? []).map((img, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <img src={img} alt="" className="h-16 w-16 rounded object-cover" />
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  const images = (content.images ?? []).filter((_, i) => i !== idx);
                  onChange(id, { images });
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <ImageUpload
            bucket="event-assets"
            pathPrefix={`events/${eventId}/pages`}
            value={null}
            onChange={(src) => {
              if (src) {
                const images = [...(content.images ?? []), src];
                onChange(id, { images });
              }
            }}
            label="Add Image"
            aspectRatio="1/1"
          />
        </div>
      );

    case "divider":
      return <hr className="border-dash-border" />;

    case "spacer":
      return (
        <div className="space-y-2">
          <p className="text-sm text-dash-muted">Spacer height: {content.height ?? 32}px</p>
          <input
            type="range"
            min={8}
            max={128}
            step={8}
            value={content.height ?? 32}
            onChange={(e) => onChange(id, { height: Number(e.target.value) })}
            className="w-full accent-dash-primary"
          />
        </div>
      );

    case "button":
      return (
        <div className="space-y-3">
          <Input
            value={content.label ?? ""}
            onChange={(e) => onChange(id, { label: e.target.value })}
            placeholder="Button text"
          />
          <Input
            value={content.link ?? ""}
            onChange={(e) => onChange(id, { link: e.target.value })}
            placeholder="Button link URL"
          />
        </div>
      );

    case "video":
      return (
        <Input
          value={content.url ?? ""}
          onChange={(e) => onChange(id, { url: e.target.value })}
          placeholder="Video embed URL"
        />
      );

    default:
      return null;
  }
}
