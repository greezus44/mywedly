import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Card, LoadingSpinner, ErrorState, EmptyState, Badge, Toggle } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { ImageUpload } from "../../components/ui/ImageUpload";
import {
  type Block,
  type BlockContent,
  BLOCK_TYPES,
  createBlock,
  parseBlockContent,
  serializeBlockContent,
} from "./block-types";
import { extractPathFromUrl, removeImage } from "../../lib/upload";
import { cn } from "../../lib/utils";

export function PageBuilder() {
  const { eventId, event } = useEventContext();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [body, setBody] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setUserId(user?.id ?? null);
    });
    return () => { mounted = false; };
  }, []);

  const { data: page, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("id", pageId)
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
    enabled: !!pageId,
  });

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setSlug(page.slug);
      setNavLabel(page.nav_label ?? "");
      setShowInNav(page.show_in_nav);
      setIsPublished(page.is_published);
      setBody(page.body ?? "");
      setCoverImage(page.cover_image_url ?? null);
      setBlocks(parseBlockContent(page.blocks).blocks);
    }
  }, [page]);

  function updateBlock(idx: number, patch: Partial<Block>) {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  }

  function updateBlockProp(idx: number, key: string, value: unknown) {
    setBlocks((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, props: { ...b.props, [key]: value } } : b))
    );
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const content: BlockContent = { blocks };
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title,
          slug,
          nav_label: navLabel || null,
          show_in_nav: showInNav,
          is_published: isPublished,
          body,
          cover_image_url: coverImage,
          blocks: serializeBlockContent(content),
          updated_at: new Date().toISOString(),
        })
        .eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["pages", eventId] });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  const handleCoverRemove = async () => {
    if (coverImage) {
      const path = extractPathFromUrl(coverImage);
      if (path) await removeImage(path);
    }
    setCoverImage(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load page"
        message={error instanceof Error ? error.message : "An unexpected error occurred."}
        onRetry={() => refetch()}
      />
    );
  }

  if (!page) {
    return (
      <EmptyState
        title="Page not found"
        description="This page may have been deleted."
        action={<Button variant="secondary" onClick={() => navigate(`/event/${eventId}/pages`)}>Back to Pages</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Page Builder</h2>
          <p className="text-sm text-dash-muted">Edit "{page.title}"</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate(`/event/${eventId}/pages`)}>Back</Button>
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            {savedMsg ? "Saved!" : "Save Page"}
          </Button>
        </div>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
        </p>
      )}

      {/* Page Settings */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Page Settings</h3>
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Input label="Nav Label" value={navLabel} onChange={(e) => setNavLabel(e.target.value)} placeholder="Label shown in navigation" />
          <div className="flex items-center gap-6">
            <Toggle label="Show in Navigation" checked={showInNav} onChange={setShowInNav} />
            <Toggle label="Published" checked={isPublished} onChange={setIsPublished} />
          </div>
        </div>
      </Card>

      {/* Cover Image */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Cover Image</h3>
        <ImageUpload
          userId={userId ?? ""}
          value={coverImage ?? undefined}
          onChange={(url) => setCoverImage(url)}
          onRemove={handleCoverRemove}
          aspectRatio="wide"
        />
      </Card>

      {/* Body (Rich Text) */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Body Content</h3>
        <RichTextEditor value={body} onChange={setBody} placeholder="Write your page content…" />
      </Card>

      {/* Blocks */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Blocks</h3>
        <div className="space-y-4">
          {blocks.map((block, idx) => (
            <div key={block.id} className="rounded-md border border-dash-border bg-dash-bg p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{block.type}</Badge>
                  <span className="text-xs text-dash-muted">Block {idx + 1}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => moveBlock(idx, -1)} disabled={idx === 0}>↑</Button>
                  <Button variant="ghost" size="sm" onClick={() => moveBlock(idx, 1)} disabled={idx === blocks.length - 1}>↓</Button>
                  <Button variant="ghost" size="sm" onClick={() => removeBlock(idx)}>Remove</Button>
                </div>
              </div>
              <BlockEditor block={block} onChange={(patch) => updateBlock(idx, patch)} onPropChange={(key, val) => updateBlockProp(idx, key, val)} />
            </div>
          ))}

          {blocks.length === 0 && (
            <p className="py-4 text-center text-sm text-dash-muted">No blocks yet. Add one below.</p>
          )}

          {/* Add block buttons */}
          <div className="flex flex-wrap gap-2 border-t border-dash-border pt-4">
            {BLOCK_TYPES.map((def) => (
              <button
                key={def.type}
                type="button"
                onClick={() => setBlocks((prev) => [...prev, createBlock(def.type)])}
                className="flex items-center gap-2 rounded-md border border-dash-border bg-dash-surface px-3 py-1.5 text-xs font-medium text-dash-text transition-colors hover:border-dash-primary hover:bg-dash-bg"
                title={def.description}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={def.icon} />
                </svg>
                {def.label}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block Editor — renders controls for each block type
// ---------------------------------------------------------------------------
interface BlockEditorProps {
  block: Block;
  onChange: (patch: Partial<Block>) => void;
  onPropChange: (key: string, value: unknown) => void;
}

function BlockEditor({ block, onPropChange }: BlockEditorProps) {
  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-3">
          <Input
            label="Text"
            value={(block.props.text as string) ?? ""}
            onChange={(e) => onPropChange("text", e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Level</label>
            <select
              value={(block.props.level as number) ?? 2}
              onChange={(e) => onPropChange("level", parseInt(e.target.value, 10))}
              className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text"
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
        <RichTextEditor
          value={(block.props.text as string) ?? ""}
          onChange={(html) => onPropChange("text", html)}
          placeholder="Write paragraph content…"
        />
      );

    case "image":
      return (
        <div className="space-y-3">
          <Input
            label="Image URL"
            value={(block.props.url as string) ?? ""}
            onChange={(e) => onPropChange("url", e.target.value)}
            placeholder="https://…"
          />
          <Input
            label="Alt Text"
            value={(block.props.alt as string) ?? ""}
            onChange={(e) => onPropChange("alt", e.target.value)}
          />
          <Input
            label="Caption"
            value={(block.props.caption as string) ?? ""}
            onChange={(e) => onPropChange("caption", e.target.value)}
          />
        </div>
      );

    case "button":
      return (
        <div className="space-y-3">
          <Input
            label="Button Text"
            value={(block.props.text as string) ?? ""}
            onChange={(e) => onPropChange("text", e.target.value)}
          />
          <Input
            label="Link URL"
            value={(block.props.url as string) ?? ""}
            onChange={(e) => onPropChange("url", e.target.value)}
            placeholder="https://…"
          />
        </div>
      );

    case "quote":
      return (
        <div className="space-y-3">
          <Input
            label="Quote"
            value={(block.props.text as string) ?? ""}
            onChange={(e) => onPropChange("text", e.target.value)}
          />
          <Input
            label="Author"
            value={(block.props.author as string) ?? ""}
            onChange={(e) => onPropChange("author", e.target.value)}
          />
        </div>
      );

    case "spacer":
      return (
        <Input
          label="Height (px)"
          type="number"
          value={(block.props.height as number) ?? 48}
          onChange={(e) => onPropChange("height", parseInt(e.target.value, 10) || 48)}
        />
      );

    case "video":
      return (
        <div className="space-y-3">
          <Input
            label="Video URL"
            value={(block.props.url as string) ?? ""}
            onChange={(e) => onPropChange("url", e.target.value)}
            placeholder="YouTube or Vimeo URL"
          />
          <Input
            label="Title"
            value={(block.props.title as string) ?? ""}
            onChange={(e) => onPropChange("title", e.target.value)}
          />
        </div>
      );

    case "countdown":
      return (
        <div className="space-y-3">
          <Input
            label="Target Date"
            type="datetime-local"
            value={((block.props.targetDate as string) ?? "").slice(0, 16)}
            onChange={(e) => onPropChange("targetDate", e.target.value ? new Date(e.target.value).toISOString() : "")}
          />
          <Input
            label="Label"
            value={(block.props.label as string) ?? ""}
            onChange={(e) => onPropChange("label", e.target.value)}
          />
        </div>
      );

    case "rsvp":
      return (
        <div className="space-y-3">
          <Input
            label="Heading"
            value={(block.props.heading as string) ?? ""}
            onChange={(e) => onPropChange("heading", e.target.value)}
          />
          <Input
            label="Button Text"
            value={(block.props.buttonText as string) ?? ""}
            onChange={(e) => onPropChange("buttonText", e.target.value)}
          />
        </div>
      );

    case "html":
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">HTML</label>
          <textarea
            value={(block.props.html as string) ?? ""}
            onChange={(e) => onPropChange("html", e.target.value)}
            rows={6}
            className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 font-mono text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
            placeholder="<div>Custom HTML</div>"
          />
        </div>
      );

    case "divider":
      return <p className="text-sm text-dash-muted">A horizontal divider line. No configuration needed.</p>;

    case "gallery":
      return (
        <Input
          label="Columns"
          type="number"
          min={1}
          max={6}
          value={(block.props.columns as number) ?? 3}
          onChange={(e) => onPropChange("columns", parseInt(e.target.value, 10) || 3)}
        />
      );

    default:
      return <p className="text-sm text-dash-muted">No editor available for this block type.</p>;
  }
}
