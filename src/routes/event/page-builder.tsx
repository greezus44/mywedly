import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Toggle, LoadingSpinner, ErrorState, Modal } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { ImageUpload } from "../../components/ui/ImageUpload";
import {
  BLOCK_TYPES,
  createBlock,
  BlockContent,
  blocksToJson,
  jsonToBlocks,
  type Block,
} from "./block-types";
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

export default function PageBuilder() {
  const { eventId } = useEventContext();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: page, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["custom_page", pageId],
    queryFn: () => fetchPage(pageId!),
    enabled: !!pageId,
  });

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState(false);

  useEffect(() => {
    if (page) {
      setBlocks(jsonToBlocks(page.blocks as Json));
      setTitle(page.title);
      setSlug(page.slug);
      setNavLabel(page.nav_label ?? "");
      setShowInNav(page.show_in_nav);
      setIsPublished(page.is_published);
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({
          blocks: blocksToJson(blocks),
          title,
          slug,
          nav_label: navLabel || title,
          show_in_nav: showInNav,
          is_published: isPublished,
        })
        .eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom_pages", eventId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .delete()
        .eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_pages", eventId] });
      navigate(`/event/${eventId}/pages`);
    },
  });

  const addBlock = (type: Block["type"]) => {
    setBlocks((prev) => [...prev, createBlock(type)]);
    setShowBlockPicker(false);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, dir: "up" | "down") => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = dir === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateBlockProps = (id: string, props: Record<string, unknown>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, props: { ...b.props, ...props } } : b))
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="p-8">
        <ErrorState
          message={error instanceof Error ? error.message : "Page not found"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-dash-border bg-dash-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/event/${eventId}/pages`)}
            className="text-sm text-dash-muted hover:text-dash-text"
          >
            ← Pages
          </button>
          <span className="text-dash-border">/</span>
          <span className="text-sm font-semibold text-dash-text">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowSettings(true)}>
            Settings
          </Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          >
            {saveMutation.isPending ? <LoadingSpinner size="sm" /> : "Save Changes"}
          </Button>
        </div>
      </div>

      {saveMutation.isSuccess && (
        <div className="bg-green-50 px-4 py-2 text-sm text-green-600">
          Page saved successfully!
        </div>
      )}
      {saveMutation.isError && (
        <div className="bg-red-50 px-4 py-2 text-sm text-dash-danger">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </div>
      )}

      {/* Block editor */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          {blocks.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-dash-border p-12 text-center">
              <p className="text-sm text-dash-muted">
                No blocks yet. Click "Add Block" to start building your page.
              </p>
            </div>
          )}

          {blocks.map((block, index) => (
            <div
              key={block.id}
              className="group relative rounded-xl border border-dash-border bg-dash-surface p-4"
            >
              {/* Block controls */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-dash-bg px-2 py-1 text-xs font-medium text-dash-muted">
                    {block.type}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveBlock(index, "up")}
                    disabled={index === 0}
                    className="rounded p-1 text-dash-muted hover:bg-dash-bg disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(index, "down")}
                    disabled={index === blocks.length - 1}
                    className="rounded p-1 text-dash-muted hover:bg-dash-bg disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    className="rounded p-1 text-dash-danger hover:bg-red-50"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Block-specific editor */}
              <BlockEditor block={block} eventId={eventId} onChange={updateBlockProps} />

              {/* Preview */}
              <div className="mt-3 border-t border-dash-border pt-3">
                <p className="mb-2 text-xs font-medium text-dash-muted">Preview:</p>
                <BlockContent block={block} />
              </div>
            </div>
          ))}

          {/* Add block button */}
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setShowBlockPicker(true)}
          >
            + Add Block
          </Button>
        </div>
      </div>

      {/* Block picker */}
      <Modal
        open={showBlockPicker}
        onClose={() => setShowBlockPicker(false)}
        title="Add Block"
        size="xl"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BLOCK_TYPES.map((def) => (
            <button
              key={def.type}
              type="button"
              onClick={() => addBlock(def.type)}
              className="flex flex-col items-start rounded-lg border border-dash-border p-4 text-left transition-colors hover:border-dash-primary hover:bg-dash-bg"
            >
              <span className="mb-2 text-2xl">{def.icon}</span>
              <span className="text-sm font-semibold text-dash-text">{def.label}</span>
              <span className="text-xs text-dash-muted">{def.description}</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Settings modal */}
      <Modal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        title="Page Settings"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="URL Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <Input
            label="Nav Label"
            value={navLabel}
            onChange={(e) => setNavLabel(e.target.value)}
            placeholder="Leave empty to use title"
          />
          <Toggle
            checked={showInNav}
            onChange={setShowInNav}
            label="Show in navigation"
          />
          <Toggle
            checked={isPublished}
            onChange={setIsPublished}
            label="Published"
          />
          <div className="border-t border-dash-border pt-4">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (window.confirm("Delete this page? This cannot be undone.")) {
                  deleteMutation.mutate();
                }
              }}
              loading={deleteMutation.isPending}
            >
              Delete Page
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ===== Block-specific editor =====

interface BlockEditorProps {
  block: Block;
  eventId: string;
  onChange: (id: string, props: Record<string, unknown>) => void;
}

function BlockEditor({ block, eventId, onChange }: BlockEditorProps) {
  const { props } = block;
  const update = (newProps: Record<string, unknown>) =>
    onChange(block.id, newProps);

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-3">
          <Input
            label="Text"
            value={(props.text as string) ?? ""}
            onChange={(e) => update({ text: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">Level</label>
              <select
                value={(props.level as string) ?? "h2"}
                onChange={(e) => update({ level: e.target.value })}
                className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm"
              >
                <option value="h1">H1</option>
                <option value="h2">H2</option>
                <option value="h3">H3</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">Align</label>
              <select
                value={(props.align as string) ?? "center"}
                onChange={(e) => update({ align: e.target.value })}
                className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </div>
      );

    case "paragraph":
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">Content</label>
          <RichTextEditor
            value={(props.html as string) ?? ""}
            onChange={(html) => update({ html })}
          />
        </div>
      );

    case "image":
      return (
        <div className="space-y-3">
          <ImageUpload
            label="Image"
            value={(props.src as string) ?? null}
            onChange={(src) => update({ src })}
            eventId={eventId}
          />
          <Input
            label="Alt Text"
            value={(props.alt as string) ?? ""}
            onChange={(e) => update({ alt: e.target.value })}
          />
        </div>
      );

    case "spacer":
      return (
        <Input
          label="Height (px)"
          type="number"
          value={(props.height as number) ?? 48}
          onChange={(e) => update({ height: Number(e.target.value) })}
        />
      );

    case "button":
      return (
        <div className="space-y-3">
          <Input
            label="Button Text"
            value={(props.text as string) ?? ""}
            onChange={(e) => update({ text: e.target.value })}
          />
          <Input
            label="URL"
            value={(props.url as string) ?? ""}
            onChange={(e) => update({ url: e.target.value })}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Style</label>
            <select
              value={(props.style as string) ?? "primary"}
              onChange={(e) => update({ style: e.target.value })}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
          </div>
        </div>
      );

    case "quote":
      return (
        <div className="space-y-3">
          <Textarea
            label="Quote"
            value={(props.text as string) ?? ""}
            onChange={(e) => update({ text: e.target.value })}
            rows={3}
          />
          <Input
            label="Author"
            value={(props.author as string) ?? ""}
            onChange={(e) => update({ author: e.target.value })}
          />
        </div>
      );

    case "video":
      return (
        <Input
          label="Video URL (YouTube or direct link)"
          value={(props.url as string) ?? ""}
          onChange={(e) => update({ url: e.target.value })}
        />
      );

    case "map":
      return (
        <Input
          label="Address or Location Query"
          value={(props.query as string) ?? (props.address as string) ?? ""}
          onChange={(e) => update({ query: e.target.value, address: e.target.value })}
        />
      );

    case "countdown":
      return (
        <Input
          label="Target Date & Time"
          type="datetime-local"
          value={(props.targetDate as string) ?? ""}
          onChange={(e) => update({ targetDate: e.target.value })}
        />
      );

    case "venue":
      return (
        <div className="space-y-3">
          <Input
            label="Venue Name"
            value={(props.name as string) ?? ""}
            onChange={(e) => update({ name: e.target.value })}
          />
          <Textarea
            label="Address"
            value={(props.address as string) ?? ""}
            onChange={(e) => update({ address: e.target.value })}
            rows={2}
          />
          <ImageUpload
            label="Venue Image"
            value={(props.image as string) ?? null}
            onChange={(src) => update({ image: src })}
            eventId={eventId}
          />
        </div>
      );

    case "divider":
    case "rsvp-form":
    case "guest-list":
    case "schedule":
      return (
        <p className="text-sm text-dash-muted">No additional settings for this block.</p>
      );

    case "gallery":
    case "columns":
    case "list":
    case "faq":
      return (
        <p className="text-sm text-dash-muted">
          This block type supports inline editing in the preview. Advanced editing coming soon.
        </p>
      );

    default:
      return null;
  }
}
