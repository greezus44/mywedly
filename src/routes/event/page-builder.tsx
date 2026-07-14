import { useState, useEffect } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import {
  LoadingSpinner,
  ErrorState,
  EmptyState,
  IconButton,
  Card,
} from "../../components/ui";
import {
  BLOCK_TYPES,
  BlockContent,
  createBlock,
  blocksToJson,
  jsonToBlocks,
  type Block,
  type BlockType,
} from "./block-types";

export default function PageBuilder() {
  const { eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ["custom-page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("id", pageId)
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage;
    },
    enabled: !!pageId,
  });

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setNavLabel(page.nav_label ?? "");
      setShowInNav(page.show_in_nav);
      setBlocks(jsonToBlocks(page.blocks));
    }
  }, [page]);

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
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  const addBlock = (type: BlockType) => {
    const block = createBlock(type);
    setBlocks((prev) => [...prev, block]);
    setSelectedBlock(block.id);
  };

  const updateBlock = (id: string, data: Record<string, unknown>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...data } } : b))
    );
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      if (index === -1) return prev;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[newIndex]] = [
        newBlocks[newIndex],
        newBlocks[index],
      ];
      return newBlocks;
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <ErrorState
        title="Page not found"
        onRetry={() => navigate(`/event/${eventId}/pages`)}
      />
    );
  }

  const editingBlock = blocks.find((b) => b.id === selectedBlock);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/event/${eventId}/pages`)}
            className="text-muted hover:text-foreground"
          >
            ← Pages
          </button>
          <span className="text-muted">/</span>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-danger">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-success">Saved successfully!</p>
      )}

      {/* Page settings */}
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Nav Label"
            value={navLabel}
            onChange={(e) => setNavLabel(e.target.value)}
            placeholder="Label in navigation"
          />
          <label className="flex items-end gap-2 pb-2">
            <input
              type="checkbox"
              checked={showInNav}
              onChange={(e) => setShowInNav(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm text-foreground">Show in navigation</span>
          </label>
        </div>
      </Card>

      {/* Block types palette */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-surface-alt p-3">
        <span className="self-center text-xs font-medium text-muted">
          Add block:
        </span>
        {BLOCK_TYPES.map((bt) => (
          <button
            key={bt.type}
            onClick={() => addBlock(bt.type)}
            className="flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:bg-primary/5"
          >
            <span>{bt.icon}</span>
            {bt.label}
          </button>
        ))}
      </div>

      {/* Blocks list */}
      {blocks.length > 0 ? (
        <div className="flex flex-col gap-3">
          {blocks.map((block, index) => {
            const isSelected = selectedBlock === block.id;
            return (
              <div
                key={block.id}
                className={cn(
                  "rounded-lg border bg-surface p-4 transition-colors",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border"
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase text-muted">
                    {block.type}
                  </span>
                  <div className="flex gap-1">
                    <IconButton
                      onClick={() => moveBlock(block.id, "up")}
                      title="Move up"
                      disabled={index === 0}
                    >
                      ↑
                    </IconButton>
                    <IconButton
                      onClick={() => moveBlock(block.id, "down")}
                      title="Move down"
                      disabled={index === blocks.length - 1}
                    >
                      ↓
                    </IconButton>
                    <IconButton
                      onClick={() => deleteBlock(block.id)}
                      title="Delete"
                      className="hover:text-danger"
                    >
                      🗑
                    </IconButton>
                  </div>
                </div>

                {/* Block content preview */}
                <div
                  onClick={() => setSelectedBlock(block.id)}
                  className="cursor-pointer"
                >
                  <BlockContent block={block} />
                </div>

                {/* Inline editor for selected block */}
                {isSelected && (
                  <div className="mt-4 border-t border-border pt-4">
                    <BlockEditor block={block} updateBlock={updateBlock} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No blocks yet"
          description="Add blocks from the palette above to build your page."
        />
      )}
    </div>
  );
}

function BlockEditor({
  block,
  updateBlock,
}: {
  block: Block;
  updateBlock: (id: string, data: Record<string, unknown>) => void;
}) {
  const { id, data } = block;

  switch (block.type) {
    case "heading":
      return (
        <div className="flex flex-col gap-3">
          <Input
            label="Text"
            value={(data.text as string) ?? ""}
            onChange={(e) => updateBlock(id, { text: e.target.value })}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Level</span>
            <select
              value={(data.level as string) ?? "h2"}
              onChange={(e) => updateBlock(id, { level: e.target.value })}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>
          </div>
        </div>
      );

    case "paragraph":
      return (
        <Textarea
          label="Text"
          value={(data.text as string) ?? ""}
          onChange={(e) => updateBlock(id, { text: e.target.value })}
          rows={4}
        />
      );

    case "image":
      return (
        <div className="flex flex-col gap-3">
          <Input
            label="Image URL"
            value={(data.url as string) ?? ""}
            onChange={(e) => updateBlock(id, { url: e.target.value })}
            placeholder="https://..."
          />
          <Input
            label="Alt Text"
            value={(data.alt as string) ?? ""}
            onChange={(e) => updateBlock(id, { alt: e.target.value })}
          />
        </div>
      );

    case "spacer":
      return (
        <Input
          label="Height (px)"
          type="number"
          value={(data.height as number) ?? 40}
          onChange={(e) => updateBlock(id, { height: Number(e.target.value) })}
        />
      );

    case "video":
      return (
        <Input
          label="Video URL (embed link)"
          value={(data.url as string) ?? ""}
          onChange={(e) => updateBlock(id, { url: e.target.value })}
          placeholder="https://www.youtube.com/embed/..."
        />
      );

    case "button":
      return (
        <div className="flex flex-col gap-3">
          <Input
            label="Button Text"
            value={(data.text as string) ?? ""}
            onChange={(e) => updateBlock(id, { text: e.target.value })}
          />
          <Input
            label="URL"
            value={(data.url as string) ?? ""}
            onChange={(e) => updateBlock(id, { url: e.target.value })}
          />
        </div>
      );

    case "quote":
      return (
        <div className="flex flex-col gap-3">
          <Textarea
            label="Quote"
            value={(data.text as string) ?? ""}
            onChange={(e) => updateBlock(id, { text: e.target.value })}
            rows={2}
          />
          <Input
            label="Author"
            value={(data.author as string) ?? ""}
            onChange={(e) => updateBlock(id, { author: e.target.value })}
          />
        </div>
      );

    case "countdown":
      return (
        <Input
          label="Target Date"
          type="date"
          value={(data.target as string) ?? ""}
          onChange={(e) => updateBlock(id, { target: e.target.value })}
        />
      );

    case "map":
      return (
        <div className="flex flex-col gap-3">
          <Input
            label="Address"
            value={(data.address as string) ?? ""}
            onChange={(e) => updateBlock(id, { address: e.target.value })}
          />
          <Input
            label="Zoom"
            type="number"
            value={(data.zoom as number) ?? 14}
            onChange={(e) => updateBlock(id, { zoom: Number(e.target.value) })}
            min={1}
            max={20}
          />
        </div>
      );

    case "venue":
      return (
        <div className="flex flex-col gap-3">
          <Input
            label="Venue Name"
            value={(data.name as string) ?? ""}
            onChange={(e) => updateBlock(id, { name: e.target.value })}
          />
          <Input
            label="Address"
            value={(data.address as string) ?? ""}
            onChange={(e) => updateBlock(id, { address: e.target.value })}
          />
        </div>
      );

    case "gallery":
      return (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            Image URLs (one per line)
          </span>
          <textarea
            value={((data.images as string[]) ?? []).join("\n")}
            onChange={(e) =>
              updateBlock(id, {
                images: e.target.value.split("\n").filter(Boolean),
              })
            }
            rows={4}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      );

    case "list":
      return (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            Items (one per line)
          </span>
          <textarea
            value={((data.items as string[]) ?? []).join("\n")}
            onChange={(e) =>
              updateBlock(id, {
                items: e.target.value.split("\n").filter(Boolean),
              })
            }
            rows={4}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      );

    case "faq":
      return (
        <div className="flex flex-col gap-3">
          {((data.items as { question: string; answer: string }[]) ?? []).map(
            (item, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-md border border-border p-3">
                <Input
                  label={`Question ${i + 1}`}
                  value={item.question}
                  onChange={(e) => {
                    const items = [...((data.items as { question: string; answer: string }[]) ?? [])];
                    items[i] = { ...items[i], question: e.target.value };
                    updateBlock(id, { items });
                  }}
                />
                <Textarea
                  label="Answer"
                  value={item.answer}
                  onChange={(e) => {
                    const items = [...((data.items as { question: string; answer: string }[]) ?? [])];
                    items[i] = { ...items[i], answer: e.target.value };
                    updateBlock(id, { items });
                  }}
                  rows={2}
                />
                <button
                  onClick={() => {
                    const items = ((data.items as { question: string; answer: string }[]) ?? []).filter(
                      (_, idx) => idx !== i
                    );
                    updateBlock(id, { items });
                  }}
                  className="self-start text-xs text-danger hover:underline"
                >
                  Remove
                </button>
              </div>
            )
          )}
          <button
            onClick={() => {
              const items = [
                ...((data.items as { question: string; answer: string }[]) ?? []),
                { question: "New question?", answer: "" },
              ];
              updateBlock(id, { items });
            }}
            className="self-start rounded-md border border-border bg-surface-alt px-3 py-1.5 text-xs text-foreground hover:bg-muted/20"
          >
            + Add FAQ Item
          </button>
        </div>
      );

    case "columns":
      return (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            Column contents (one per line)
          </span>
          <textarea
            value={((data.columns as { text: string }[]) ?? []).map((c) => c.text).join("\n")}
            onChange={(e) => {
              const texts = e.target.value.split("\n");
              updateBlock(id, {
                columns: texts.map((t) => ({ text: t })),
              });
            }}
            rows={4}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      );

    default:
      return (
        <p className="text-sm text-muted">
          This block type is rendered on the guest page and has no editable
          properties here.
        </p>
      );
    }
}
