import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, LoadingSpinner, ErrorState } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import {
  BLOCK_TYPES,
  createBlock,
  blocksFromContent,
  blocksToContent,
  BlockContent,
  type Block,
} from "./block-types";

export function PageBuilder() {
  const { eventId, event } = useEventContext();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: page, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("id", pageId)
        .eq("event_id", eventId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Page not found.");
      return data as CustomPage;
    },
    enabled: !!pageId,
  });

  // Initialize blocks once page is loaded
  if (page && blocks === null) {
    setBlocks(blocksFromContent(page.content));
  }

  // Get user ID for image uploads
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setUserId(session?.user?.id ?? null);
    });
    return () => { mounted = false; };
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!pageId) return;
      const content = blocksToContent(blocks ?? []) as Json;
      const { error } = await supabase
        .from("custom_pages")
        .update({ content })
        .eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page", pageId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const addBlock = (type: Block["type"]) => {
    const block = createBlock(type);
    setBlocks((prev) => [...(prev ?? []), block]);
  };

  const updateBlock = (id: string, content: Record<string, unknown>) => {
    setBlocks((prev) => (prev ?? []).map((b) => (b.id === id ? { ...b, content } : b)));
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => (prev ?? []).filter((b) => b.id !== id));
  };

  const moveBlock = (id: string, dir: "up" | "down") => {
    setBlocks((prev) => {
      const list = prev ?? [];
      const idx = list.findIndex((b) => b.id === id);
      if (idx === -1) return list;
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= list.length) return list;
      const next = [...list];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <ErrorState
        title="Failed to load page"
        message={error instanceof Error ? error.message : "An error occurred."}
        onRetry={() => refetch()}
      />
    );
  }

  const blockList = blocks ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/event/${eventId}/pages`)}
            className="mb-1 text-sm text-dash-muted hover:text-dash-text"
          >
            ← Back to Pages
          </button>
          <h2 className="text-xl font-bold text-dash-text">{page.title}</h2>
          <p className="text-sm text-dash-muted">/e/{event.slug || event.draft_slug}/{page.slug}</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          {saved ? "Saved!" : "Save"}
        </Button>
      </div>

      {/* Block type picker */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Add Block</h3>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              type="button"
              onClick={() => addBlock(bt.type)}
              className="flex items-center gap-2 rounded-lg border border-dash-border px-3 py-1.5 text-sm text-dash-text transition-colors hover:border-dash-primary hover:bg-dash-primary/5"
              title={bt.description}
            >
              <span className="text-lg">{bt.icon}</span>
              {bt.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Blocks */}
      {blockList.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-dash-muted">
            No blocks yet. Add a block above to start building your page.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {blockList.map((block, idx) => (
            <Card key={block.id}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-dash-muted">
                  {block.type} (#{idx + 1})
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveBlock(block.id, "up")}
                    disabled={idx === 0}
                    className="rounded p-1 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text disabled:opacity-30"
                    title="Move up"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(block.id, "down")}
                    disabled={idx === blockList.length - 1}
                    className="rounded p-1 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text disabled:opacity-30"
                    title="Move down"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    className="rounded p-1 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-danger"
                    title="Remove"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Block editor */}
              <BlockEditor block={block} onChange={(content) => updateBlock(block.id, content)} userId={userId} />

              {/* Block preview */}
              <div className="mt-3 rounded-lg border border-dash-border bg-dash-bg p-3">
                <p className="mb-2 text-xs text-dash-muted">Preview:</p>
                <BlockContent block={block} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save."}
        </p>
      )}
    </div>
  );
}

interface BlockEditorProps {
  block: Block;
  onChange: (content: Record<string, unknown>) => void;
  userId: string | null;
}

function BlockEditor({ block, onChange, userId }: BlockEditorProps) {
  const c = block.content;
  const update = (patch: Record<string, unknown>) => onChange({ ...c, ...patch });

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-3">
          <Input
            label="Text"
            value={(c.text as string) || ""}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Heading text"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">Font Size (px)</label>
              <input
                type="number"
                value={(c.fontSize as number) || 24}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
                min={8}
                max={72}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">Alignment</label>
              <select
                value={(c.align as string) || "center"}
                onChange={(e) => update({ align: e.target.value })}
                className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </div>
      );

    case "text":
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">HTML Content</label>
          <textarea
            value={(c.html as string) || ""}
            onChange={(e) => update({ html: e.target.value })}
            placeholder="<p>Write your content here...</p>"
            rows={5}
            className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
          />
        </div>
      );

    case "image":
      return (
        <div className="space-y-3">
          {userId && (
            <ImageUpload
              value={(c.url as string) || null}
              onChange={(url) => update({ url })}
              userId={userId}
              label="Image"
              aspectRatio="auto"
            />
          )}
          <Input
            label="Alt Text"
            value={(c.alt as string) || ""}
            onChange={(e) => update({ alt: e.target.value })}
            placeholder="Image description"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Width</label>
            <select
              value={(c.width as string) || "full"}
              onChange={(e) => update({ width: e.target.value })}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
            >
              <option value="full">Full Width</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>
      );

    case "divider":
      return <p className="text-sm text-dash-muted">A horizontal divider line. No configuration needed.</p>;

    case "button":
      return (
        <div className="space-y-3">
          <Input
            label="Button Text"
            value={(c.text as string) || ""}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Click Here"
          />
          <Input
            label="Link URL"
            value={(c.url as string) || ""}
            onChange={(e) => update({ url: e.target.value })}
            placeholder="https://..."
          />
        </div>
      );

    case "spacer":
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">Height (px)</label>
          <input
            type="number"
            value={(c.height as number) || 32}
            onChange={(e) => update({ height: Number(e.target.value) })}
            className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
            min={0}
            max={200}
          />
        </div>
      );

    default:
      return null;
  }
}
