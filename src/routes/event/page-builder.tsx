import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, Textarea, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { BLOCK_TYPES, createBlock, jsonToBlocks, blocksToJson, type Block, type BlockType } from "./block-types";

export function PageBuilder() {
  const { eventId } = useEventContext();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: page, isLoading, isError, refetch } = useQuery({
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

  const [title, setTitle] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [inlineImage, setInlineImage] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showInNav, setShowInNav] = useState(true);
  const [icon, setIcon] = useState("");

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setNavLabel(page.nav_label ?? page.title);
      setSlug(page.slug);
      setBody(page.body ?? "");
      setCoverImage(page.cover_image_url);
      setInlineImage(page.inline_image_url);
      setBlocks(jsonToBlocks(page.blocks));
      setShowInNav(page.show_in_nav);
      setIcon(page.icon ?? "");
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title,
          nav_label: navLabel || title,
          slug,
          body,
          cover_image_url: coverImage,
          inline_image_url: inlineImage,
          blocks: blocksToJson(blocks),
          show_in_nav: showInNav,
          icon: icon || null,
          updated_at: new Date().toISOString(),
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
    setBlocks((prev) => [...prev, createBlock(type)]);
  };

  const updateBlock = (id: string, content: Partial<Block["content"]>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...content } } : b)),
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      if (index === -1) return prev;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      return newBlocks;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <ErrorState
        title="Page not found"
        message="This custom page could not be loaded."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/event/${eventId}/pages`)}
            className="text-sm text-dash-muted hover:text-dash-text"
          >
            ← Back to Pages
          </button>
          <h2 className="mt-1 text-xl font-bold text-dash-text">Edit Page</h2>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Page
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          Error: {(saveMutation.error as Error)?.message}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Page saved successfully!</p>
      )}

      {/* Page Settings */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Page Settings</h3>
        <div className="space-y-4">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Navigation Label"
              value={navLabel}
              onChange={(e) => setNavLabel(e.target.value)}
              placeholder="Label shown in nav"
            />
            <Input
              label="URL Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="page-slug"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Icon (emoji)"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="📄"
            />
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-dash-text">
                <input
                  type="checkbox"
                  checked={showInNav}
                  onChange={(e) => setShowInNav(e.target.checked)}
                  className="h-4 w-4 rounded border-dash-border"
                />
                Show in navigation
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Cover Image */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Cover Image</h3>
        <ImageUpload
          value={coverImage}
          onChange={setCoverImage}
          bucket="event-assets"
          pathPrefix={`events/${eventId}/pages/${pageId}`}
          label="Cover Image"
        />
      </Card>

      {/* Body (legacy rich text) */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Page Content</h3>
        <RichTextEditor
          value={body}
          onChange={setBody}
          placeholder="Write your page content..."
        />
      </Card>

      {/* Inline Image */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Inline Image</h3>
        <ImageUpload
          value={inlineImage}
          onChange={setInlineImage}
          bucket="event-assets"
          pathPrefix={`events/${eventId}/pages/${pageId}/inline`}
          label="Inline Image"
        />
      </Card>

      {/* Blocks */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Content Blocks</h3>

        {/* Add block buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          {BLOCK_TYPES.map((bt) => (
            <Button
              key={bt.type}
              variant="secondary"
              size="sm"
              onClick={() => addBlock(bt.type)}
            >
              {bt.icon} {bt.label}
            </Button>
          ))}
        </div>

        {/* Block list */}
        {blocks.length === 0 ? (
          <EmptyState
            title="No blocks yet"
            description="Add content blocks above to build your page."
            className="py-8"
          />
        ) : (
          <div className="space-y-3">
            {blocks.map((block, index) => (
              <div
                key={block.id}
                className="rounded-md border border-dash-border bg-dash-bg p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase text-dash-muted">
                    {block.type}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBlock(block.id, "up")}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBlock(block.id, "down")}
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

                {/* Block editors */}
                {(block.type === "heading" || block.type === "paragraph") && (
                  <Input
                    value={block.content.text ?? ""}
                    onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                    placeholder={block.type === "heading" ? "Heading text" : "Paragraph text"}
                  />
                )}
                {block.type === "image" && (
                  <Input
                    label="Image URL"
                    value={block.content.url ?? ""}
                    onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                    placeholder="https://..."
                  />
                )}
                {block.type === "button" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Button Label"
                      value={block.content.label ?? ""}
                      onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                      placeholder="Click Here"
                    />
                    <Input
                      label="Link URL"
                      value={block.content.href ?? ""}
                      onChange={(e) => updateBlock(block.id, { href: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                )}
                {block.type === "spacer" && (
                  <Input
                    label="Height (px)"
                    type="number"
                    value={block.content.height ?? 40}
                    onChange={(e) => updateBlock(block.id, { height: Number(e.target.value) })}
                  />
                )}
                {block.type === "html" && (
                  <Textarea
                    label="Custom HTML"
                    value={block.content.html ?? ""}
                    onChange={(e) => updateBlock(block.id, { html: e.target.value })}
                    placeholder="<p>Custom HTML</p>"
                  />
                )}
                {block.type === "divider" && (
                  <p className="text-sm text-dash-muted">A horizontal divider line will appear here.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
