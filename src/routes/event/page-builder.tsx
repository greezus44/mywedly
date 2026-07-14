import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, LoadingSpinner, ErrorState, FormField, Toggle, Badge } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { BLOCK_TYPES, createBlock, blocksToJson, jsonToBlocks, type Block, type BlockType } from "./block-types";
import { cn } from "../../lib/utils";

export const PageBuilder: React.FC = () => {
  const { eventId } = useEventContext();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: page, isLoading, isError, refetch } = useQuery({
    queryKey: ["custom-page", pageId],
    queryFn: async () => {
      if (!pageId) throw new Error("Missing page ID");
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("id", pageId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Page not found");
      return data as CustomPage;
    },
    enabled: !!pageId,
  });

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Load page data once
  React.useEffect(() => {
    if (page && !loaded) {
      setBlocks(jsonToBlocks(page.blocks));
      setTitle(page.title);
      setNavLabel(page.nav_label ?? page.title);
      setShowInNav(page.show_in_nav);
      setIsPublished(page.is_published);
      setCoverImage(page.cover_image_url);
      setBody(page.body);
      setLoaded(true);
    }
  }, [page, loaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!pageId) throw new Error("Missing page ID");
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title: title,
          nav_label: navLabel || title,
          show_in_nav: showInNav,
          is_published: isPublished,
          cover_image_url: coverImage,
          body: body,
          blocks: blocksToJson(blocks),
        })
        .eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleAddBlock = (type: BlockType) => {
    setBlocks((prev) => [...prev, createBlock(type)]);
  };

  const handleUpdateBlock = (id: string, content: Block["content"]) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content } : b)),
    );
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleMoveBlock = (id: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const newBlocks = [...prev];
      [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
      return newBlocks;
    });
  };

  if (isLoading) {
    return <LoadingSpinner size="md" label="Loading page..." />;
  }

  if (isError || !page) {
    return (
      <ErrorState
        title="Page not found"
        onRetry={() => {
          refetch();
          navigate(`/event/${eventId}/pages`);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/event/${eventId}/pages`)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Button>
          <h2 className="text-xl font-bold text-dash-text">Page Builder</h2>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={saveMutation.isPending}>
          {saved ? "Saved!" : "Save"}
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Editor */}
        <div className="space-y-4">
          {/* Page Settings */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Page Settings</h3>
            <div className="space-y-3">
              <FormField label="Title">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </FormField>
              <FormField label="Navigation label">
                <Input value={navLabel} onChange={(e) => setNavLabel(e.target.value)} />
              </FormField>
              <div className="flex items-center justify-between rounded-md border border-dash-border bg-dash-bg px-3 py-2">
                <span className="text-sm font-medium text-dash-text">Show in navigation</span>
                <Toggle checked={showInNav} onChange={setShowInNav} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-dash-border bg-dash-bg px-3 py-2">
                <span className="text-sm font-medium text-dash-text">Published</span>
                <Toggle checked={isPublished} onChange={setIsPublished} />
              </div>
            </div>
          </Card>

          {/* Cover Image */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Cover Image</h3>
            <ImageUpload
              value={coverImage}
              onChange={setCoverImage}
              folder="pages"
              eventId={eventId}
              aspectRatio="wide"
            />
          </Card>

          {/* Body (fallback rich text) */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Body (Rich Text)</h3>
            <RichTextEditor
              value={body ?? ""}
              onChange={setBody}
              placeholder="Write page content..."
            />
          </Card>

          {/* Block Builder */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Blocks</h3>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {BLOCK_TYPES.map((bt) => (
                <button
                  key={bt.type}
                  type="button"
                  onClick={() => handleAddBlock(bt.type)}
                  className="rounded-md border border-dash-border bg-dash-surface px-2.5 py-1 text-xs font-medium text-dash-text hover:bg-dash-bg"
                  title={bt.description}
                >
                  <span className="mr-1">{bt.icon}</span>
                  {bt.label}
                </button>
              ))}
            </div>

            {blocks.length === 0 && (
              <p className="text-sm text-dash-muted">No blocks yet. Add a block type above to get started.</p>
            )}

            <div className="space-y-3">
              {blocks.map((block, idx) => (
                <div
                  key={block.id}
                  className="rounded-md border border-dash-border bg-dash-bg p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-dash-muted">{block.type}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(block.id, "up")}
                        disabled={idx === 0}
                        className="rounded p-1 text-dash-muted hover:bg-dash-surface disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(block.id, "down")}
                        disabled={idx === blocks.length - 1}
                        className="rounded p-1 text-dash-muted hover:bg-dash-surface disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(block.id)}
                        className="rounded p-1 text-dash-danger hover:bg-dash-surface"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <BlockEditor block={block} onChange={(content) => handleUpdateBlock(block.id, content)} eventId={eventId} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="rounded-lg border border-dash-border bg-dash-bg p-4">
          <h3 className="mb-3 text-sm font-semibold text-dash-text">Preview</h3>
          <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
            {coverImage && (
              <div className="mb-4 overflow-hidden rounded-lg">
                <img src={coverImage} alt="Cover" className="h-48 w-full object-cover" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-dash-text">{title}</h1>
            {body && (
              <div className="rich-content mt-3 text-sm text-dash-text" dangerouslySetInnerHTML={{ __html: body }} />
            )}
            <div className="mt-4 space-y-3">
              {blocks.map((block) => (
                <BlockPreview key={block.id} block={block} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Block Editor ----
const BlockEditor: React.FC<{ block: Block; onChange: (content: Block["content"]) => void; eventId: string }> = ({
  block,
  onChange,
  eventId,
}) => {
  const c = block.content;
  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <Input
            value={c.text ?? ""}
            onChange={(e) => onChange({ ...c, text: e.target.value })}
            placeholder="Heading text"
          />
          <div className="flex gap-2">
            <select
              value={String(c.level ?? 2)}
              onChange={(e) => onChange({ ...c, level: parseInt(e.target.value) })}
              className="h-9 rounded-md border border-dash-border bg-dash-surface px-2 text-sm text-dash-text"
            >
              <option value="1">H1</option>
              <option value="2">H2</option>
              <option value="3">H3</option>
            </select>
            <select
              value={c.align ?? "left"}
              onChange={(e) => onChange({ ...c, align: e.target.value as "left" | "center" | "right" })}
              className="h-9 rounded-md border border-dash-border bg-dash-surface px-2 text-sm text-dash-text"
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
        <Textarea
          value={c.text ?? ""}
          onChange={(e) => onChange({ ...c, text: e.target.value })}
          placeholder="Paragraph text"
        />
      );
    case "image":
      return (
        <ImageUpload
          value={c.src ?? null}
          onChange={(url) => onChange({ ...c, src: url ?? "" })}
          folder="blocks"
          eventId={eventId}
          aspectRatio="auto"
        />
      );
    case "button":
      return (
        <div className="space-y-2">
          <Input
            value={c.text ?? ""}
            onChange={(e) => onChange({ ...c, text: e.target.value })}
            placeholder="Button text"
          />
          <Input
            value={c.href ?? ""}
            onChange={(e) => onChange({ ...c, href: e.target.value })}
            placeholder="https://..."
          />
        </div>
      );
    case "divider":
      return <p className="text-sm text-dash-muted">A horizontal divider line.</p>;
    case "spacer":
      return (
        <FormField label={`Height: ${c.height ?? 40}px`}>
          <input
            type="range"
            min={10}
            max={200}
            step={10}
            value={c.height ?? 40}
            onChange={(e) => onChange({ ...c, height: parseInt(e.target.value) })}
            className="w-full"
          />
        </FormField>
      );
    case "quote":
      return (
        <div className="space-y-2">
          <Textarea
            value={c.text ?? ""}
            onChange={(e) => onChange({ ...c, text: e.target.value })}
            placeholder="Quote text"
          />
          <Input
            value={c.caption ?? ""}
            onChange={(e) => onChange({ ...c, caption: e.target.value })}
            placeholder="Caption / attribution"
          />
        </div>
      );
    case "list":
      return (
        <Textarea
          value={(c.items ?? []).join("\n")}
          onChange={(e) => onChange({ ...c, items: e.target.value.split("\n").filter(Boolean) })}
          placeholder="One item per line"
        />
      );
    case "video":
      return (
        <Input
          value={c.src ?? ""}
          onChange={(e) => onChange({ ...c, src: e.target.value })}
          placeholder="Video URL (YouTube, Vimeo, etc.)"
        />
      );
    case "gallery":
      return <p className="text-sm text-dash-muted">Gallery block — add images in the preview.</p>;
    default:
      return null;
  }
};

// ---- Block Preview ----
const BlockPreview: React.FC<{ block: Block }> = ({ block }) => {
  const c = block.content;
  const align = c.align ?? "left";
  switch (block.type) {
    case "heading": {
      const Tag = (`h${c.level ?? 2}`) as keyof React.JSX.IntrinsicElements;
      return <Tag style={{ textAlign: align }} className="font-bold text-dash-text">{c.text}</Tag>;
    }
    case "paragraph":
      return <p style={{ textAlign: align }} className="text-sm text-dash-text">{c.text}</p>;
    case "image":
      return c.src ? <img src={c.src} alt={c.alt ?? ""} className="w-full rounded-lg" /> : null;
    case "button":
      return (
        <a
          href={c.href ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-block rounded-md px-4 py-2 text-sm font-medium",
            c.variant === "secondary"
              ? "border border-dash-border bg-dash-surface text-dash-text"
              : "bg-dash-primary text-dash-primary-fg",
          )}
        >
          {c.text}
        </a>
      );
    case "divider":
      return <hr className="border-dash-border" />;
    case "spacer":
      return <div style={{ height: c.height ?? 40 }} />;
    case "quote":
      return (
        <blockquote className="border-l-4 border-dash-primary pl-4 italic text-dash-text">
          "{c.text}"
          {c.caption && <footer className="mt-1 text-sm not-italic text-dash-muted">— {c.caption}</footer>}
        </blockquote>
      );
    case "list":
      return (
        <ul className="list-inside list-disc space-y-1 text-sm text-dash-text">
          {(c.items ?? []).map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    case "video":
      return c.src ? (
        <div className="aspect-video overflow-hidden rounded-lg">
          <iframe src={c.src} className="h-full w-full" title="Video" />
        </div>
      ) : null;
    default:
      return null;
  }
};
