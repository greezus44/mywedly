import { useState, useEffect } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { Button } from "../../components/ui/Button";
import { Card, Input, Select, LoadingSpinner } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { ImageUpload } from "../../components/ui/ImageUpload";
import {
  BLOCK_TYPES,
  createBlock,
  blocksToJson,
  jsonToBlocks,
  renderBlockPreview,
  type Block,
  type BlockType,
  type BlockContent,
} from "./block-types";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme, themeToEventCssVars } from "../../lib/theme";
import type { EventContextValue } from "./event-layout";

export function PageBuilder() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = event.creator_id;

  const { data: page, isLoading: pageLoading } = useQuery({
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

  const [title, setTitle] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (page && !loaded) {
      setBlocks(jsonToBlocks(page.blocks));
      setTitle(page.title);
      setNavLabel(page.nav_label ?? "");
      setShowInNav(page.show_in_nav);
      setLoaded(true);
    }
  }, [page, loaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title,
          nav_label: navLabel || null,
          show_in_nav: showInNav,
          blocks: blocksToJson(blocks),
        })
        .eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", eventId] });
      queryClient.invalidateQueries({ queryKey: ["page", pageId] });
    },
  });

  function addBlock(type: BlockType) {
    const newBlock = createBlock(type, blocks.length);
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  }

  function updateBlock(id: string, content: BlockContent) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...content } } : b))
    );
  }

  function deleteBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  }

  function moveBlock(id: string, direction: "up" | "down") {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      if (index === -1) return prev;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      return newBlocks.map((b, i) => ({ ...b, order_index: i }));
    });
  }

  if (pageLoading || !page) return <LoadingSpinner />;
  if (!loaded) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const fullTheme = jsonToTheme(event.draft_theme ?? event.theme);
  const cssVars = themeToEventCssVars(fullTheme) as React.CSSProperties;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/event/${eventId}/pages`)}>
            ← Back to Pages
          </Button>
          <h2 className="text-lg font-semibold text-dash-text">Page Builder</h2>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={saveMutation.isPending}
        >
          Save Page
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-dash-danger">
          {saveMutation.error?.message ?? "Failed to save"}
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Page saved successfully!
        </div>
      )}

      {/* Page Settings */}
      <Card className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
        <Input
          label="Page Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Nav Label"
          value={navLabel}
          onChange={(e) => setNavLabel(e.target.value)}
          placeholder="Menu label"
        />
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showInNav}
              onChange={(e) => setShowInNav(e.target.checked)}
              className="rounded border-dash-border"
            />
            <span className="text-sm text-dash-text">Show in navigation</span>
          </label>
        </div>
      </Card>

      <div className="h-[calc(100vh-340px)] min-h-[500px]">
        <SplitEditor
          editorRatio={0.5}
          editor={
            <div className="space-y-4">
              {/* Block Palette */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-dash-text">Add Block</h3>
                <div className="grid grid-cols-4 gap-2">
                  {BLOCK_TYPES.map((bt) => (
                    <button
                      key={bt.type}
                      type="button"
                      onClick={() => addBlock(bt.type)}
                      title={bt.description}
                      className="flex flex-col items-center gap-1 rounded-md border border-dash-border bg-dash-surface p-2 text-center transition-colors hover:border-dash-primary"
                    >
                      <span className="text-lg">{bt.icon}</span>
                      <span className="text-xs text-dash-text">{bt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Block List */}
              <div className="space-y-2">
                {blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={`rounded-md border p-2 ${
                      selectedBlockId === block.id
                        ? "border-dash-primary bg-dash-primary/5"
                        : "border-dash-border bg-dash-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setSelectedBlockId(block.id)}
                        className="flex-1 text-left text-sm font-medium text-dash-text"
                      >
                        {BLOCK_TYPES.find((bt) => bt.type === block.type)?.label ?? block.type}
                      </button>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveBlock(block.id, "up")}
                          disabled={index === 0}
                          className="rounded p-1 text-dash-muted hover:bg-dash-bg disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBlock(block.id, "down")}
                          disabled={index === blocks.length - 1}
                          className="rounded p-1 text-dash-muted hover:bg-dash-bg disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBlock(block.id)}
                          className="rounded p-1 text-dash-danger hover:bg-red-50"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {blocks.length === 0 && (
                  <p className="py-4 text-center text-sm text-dash-muted">
                    No blocks yet. Add one from above.
                  </p>
                )}
              </div>

              {/* Block Editor */}
              {selectedBlock && (
                <Card className="space-y-3 p-3">
                  <h3 className="text-sm font-semibold text-dash-text">
                    Edit: {BLOCK_TYPES.find((bt) => bt.type === selectedBlock.type)?.label}
                  </h3>
                  {selectedBlock.type === "heading" && (
                    <>
                      <Input
                        label="Text"
                        value={selectedBlock.content.text ?? ""}
                        onChange={(e) => updateBlock(selectedBlock.id, { text: e.target.value })}
                      />
                      <Input
                        label="Font Size"
                        type="number"
                        value={selectedBlock.content.fontSize ?? 32}
                        onChange={(e) => updateBlock(selectedBlock.id, { fontSize: Number(e.target.value) })}
                      />
                      <Input
                        label="Colour"
                        type="color"
                        value={selectedBlock.content.color ?? "#78350f"}
                        onChange={(e) => updateBlock(selectedBlock.id, { color: e.target.value })}
                      />
                      <Select
                        label="Alignment"
                        value={selectedBlock.content.align ?? "center"}
                        onChange={(e) => updateBlock(selectedBlock.id, { align: e.target.value as "left" | "center" | "right" })}
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </Select>
                    </>
                  )}
                  {selectedBlock.type === "paragraph" && (
                    <RichTextEditor
                      value={selectedBlock.content.html ?? ""}
                      onChange={(html) => updateBlock(selectedBlock.id, { html })}
                    />
                  )}
                  {selectedBlock.type === "image" && (
                    <>
                      <ImageUpload
                        value={selectedBlock.content.url ?? null}
                        onChange={(url) => updateBlock(selectedBlock.id, { url: url ?? "" })}
                        userId={userId}
                        label="Image"
                      />
                      <Input
                        label="Alt Text"
                        value={selectedBlock.content.alt ?? ""}
                        onChange={(e) => updateBlock(selectedBlock.id, { alt: e.target.value })}
                      />
                    </>
                  )}
                  {selectedBlock.type === "button" && (
                    <>
                      <Input
                        label="Button Text"
                        value={selectedBlock.content.buttonText ?? ""}
                        onChange={(e) => updateBlock(selectedBlock.id, { buttonText: e.target.value })}
                      />
                      <Input
                        label="Link URL"
                        value={selectedBlock.content.href ?? ""}
                        onChange={(e) => updateBlock(selectedBlock.id, { href: e.target.value })}
                      />
                    </>
                  )}
                  {selectedBlock.type === "spacer" && (
                    <Input
                      label="Height (px)"
                      type="number"
                      value={selectedBlock.content.heightPx ?? 40}
                      onChange={(e) => updateBlock(selectedBlock.id, { heightPx: Number(e.target.value) })}
                    />
                  )}
                </Card>
              )}
            </div>
          }
          preview={
            <EventThemeProvider theme={event.draft_theme ?? event.theme}>
              <div className="event-themed min-h-full p-6" style={cssVars}>
                <h1 className="guest-title mb-4">{title}</h1>
                <div className="space-y-4">
                  {blocks.map((block) => (
                    <div key={block.id}>{renderBlockPreview(block)}</div>
                  ))}
                </div>
              </div>
            </EventThemeProvider>
          }
        />
      </div>
    </div>
  );
}

export default PageBuilder;
