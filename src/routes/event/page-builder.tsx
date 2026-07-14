import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import {
  BLOCK_TYPES,
  createBlock,
  parseBlocks,
  blocksToJson,
  type Block,
  type BlockType,
} from "./block-types";
import { cn } from "../../lib/utils";

export function PageBuilder() {
  const { pageId } = useParams<{ pageId: string }>();
  const { event, eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: page, isLoading, isError, refetch } = useQuery({
    queryKey: ["custom-page", pageId],
    enabled: !!pageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("id", pageId!)
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
  });

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");

  // Initialize blocks when page loads
  if (page && !loaded) {
    setBlocks(parseBlocks(page.content));
    setTitle(page.title);
    setLoaded(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title,
          content: blocksToJson(blocks),
        })
        .eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  function addBlock(type: BlockType) {
    setBlocks((prev) => [...prev, createBlock(type)]);
  }

  function updateBlock(idx: number, patch: Partial<Block["content"]>) {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, content: { ...b.content, ...patch } } : b)));
  }

  function removeBlock(idx: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveBlock(idx: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load page." onRetry={() => refetch()} />;
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-lg font-semibold text-dash-text">Page not found</p>
        <Button variant="secondary" onClick={() => navigate(`/event/${eventId}/pages`)}>
          Back to Pages
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/event/${eventId}/pages`)}>
            ← Pages
          </Button>
          <h1 className="text-2xl font-bold text-dash-text">Page Builder</h1>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={saveMutation.isPending}
        >
          Save Page
        </Button>
      </div>

      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Page saved successfully!</p>
      )}
      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed."}
        </p>
      )}

      {/* Page Title */}
      <Card>
        <Input
          label="Page title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Page title"
        />
        <p className="mt-2 text-sm text-dash-muted">Slug: /{page.slug}</p>
      </Card>

      {/* Block Palette */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-dash-text">Add Block</h2>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              type="button"
              onClick={() => addBlock(bt.type)}
              title={bt.description}
              className="flex items-center gap-2 rounded-lg border border-dash-border px-3 py-2 text-sm text-dash-text transition-colors hover:border-dash-primary hover:bg-dash-primary/5"
            >
              <span className="text-base">{bt.icon}</span>
              <span>{bt.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Blocks */}
      {blocks.map((block, idx) => (
        <Card key={block.id}>
          <div className="mb-3 flex items-center justify-between">
            <Badge variant="primary">{block.type}</Badge>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => moveBlock(idx, -1)} disabled={idx === 0}>↑</Button>
              <Button variant="ghost" size="sm" onClick={() => moveBlock(idx, 1)} disabled={idx === blocks.length - 1}>↓</Button>
              <Button variant="ghost" size="sm" onClick={() => removeBlock(idx)}>✕</Button>
            </div>
          </div>
          <BlockEditor block={block} onChange={(patch) => updateBlock(idx, patch)} userId={event.creator_id} />
        </Card>
      ))}

      {blocks.length === 0 && (
        <Card>
          <p className="py-8 text-center text-sm text-dash-muted">
            No blocks yet. Use the palette above to add content blocks.
          </p>
        </Card>
      )}
    </div>
  );
}

// ---------- Block Editor ----------
function BlockEditor({
  block,
  onChange,
  userId,
}: {
  block: Block;
  onChange: (patch: Partial<Block["content"]>) => void;
  userId: string;
}) {
  const c = block.content;

  switch (block.type) {
    case "heading":
    case "paragraph":
    case "quote":
      return (
        <div className="space-y-3">
          <Textarea
            label="Text"
            value={c.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Enter text…"
          />
          {block.type === "heading" && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Font size (px)"
                type="number"
                value={c.fontSize ?? 28}
                onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
              />
              <Input
                label="Font weight"
                type="number"
                value={c.fontWeight ?? 700}
                onChange={(e) => onChange({ fontWeight: Number(e.target.value) })}
              />
            </div>
          )}
          <div className="flex gap-2">
            {(["left", "center", "right"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => onChange({ align: a })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs capitalize",
                  (c.align ?? "left") === a
                    ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                    : "border-dash-border text-dash-text hover:bg-dash-bg"
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      );

    case "image":
      return (
        <div className="space-y-3">
          <ImageUpload
            userId={userId}
            value={c.url ?? ""}
            onChange={(url) => onChange({ url })}
            label="Image"
            aspectRatio="auto"
          />
          <Input
            label="Alt text"
            type="text"
            value={c.alt ?? ""}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="Image description"
          />
        </div>
      );

    case "gallery":
      return (
        <div className="space-y-3">
          {(c.images ?? []).map((img, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <img src={img} alt="" className="h-16 w-16 rounded object-cover" />
              <Input
                type="text"
                value={img}
                onChange={(e) => {
                  const images = [...(c.images ?? [])];
                  images[idx] = e.target.value;
                  onChange({ images });
                }}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const images = (c.images ?? []).filter((_, i) => i !== idx);
                  onChange({ images });
                }}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => onChange({ images: [...(c.images ?? []), ""] })}>
            + Add Image URL
          </Button>
        </div>
      );

    case "button":
      return (
        <div className="space-y-3">
          <Input
            label="Button text"
            type="text"
            value={c.buttonText ?? ""}
            onChange={(e) => onChange({ buttonText: e.target.value })}
            placeholder="Click here"
          />
          <Input
            label="Link URL"
            type="url"
            value={c.href ?? ""}
            onChange={(e) => onChange({ href: e.target.value })}
            placeholder="https://…"
          />
        </div>
      );

    case "map":
    case "video":
      return (
        <div className="space-y-3">
          <Input
            label="Embed URL"
            type="url"
            value={c.embedUrl ?? ""}
            onChange={(e) => onChange({ embedUrl: e.target.value })}
            placeholder={block.type === "video" ? "https://youtube.com/embed/…" : "https://maps.google.com/…"}
          />
          <Input
            label="Caption (optional)"
            type="text"
            value={c.caption ?? ""}
            onChange={(e) => onChange({ caption: e.target.value })}
          />
        </div>
      );

    case "spacer":
      return (
        <Input
          label="Spacing (px)"
          type="number"
          value={c.spacing ?? 32}
          onChange={(e) => onChange({ spacing: Number(e.target.value) })}
        />
      );

    case "divider":
      return <p className="text-sm text-dash-muted">A horizontal divider line.</p>;

    default:
      return null;
  }
}
