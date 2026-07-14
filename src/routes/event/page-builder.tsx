import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import {
  Input,
  Textarea,
  Card,
  LoadingSpinner,
  ErrorState,
  Select,
} from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import {
  BLOCK_TYPES,
  createBlock,
  jsonToBlocks,
  blocksToJson,
  type Block,
  type BlockType,
} from "./block-types";
import { cn } from "../../lib/utils";

async function fetchPage(pageId: string): Promise<CustomPage | null> {
  const { data, error } = await supabase
    .from("custom_pages")
    .select("*")
    .eq("id", pageId)
    .maybeSingle();
  if (error) throw error;
  return data as CustomPage | null;
}

async function updatePage(
  pageId: string,
  updates: Partial<Pick<CustomPage, "title" | "slug" | "body" | "blocks" | "cover_image_url" | "nav_label" | "show_in_nav">>
): Promise<void> {
  const { error } = await supabase
    .from("custom_pages")
    .update(updates)
    .eq("id", pageId);
  if (error) throw error;
}

export function PageBuilder() {
  const { eventId } = useEventContext();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const { data: page, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["custom-page", pageId],
    queryFn: () => fetchPage(pageId!),
    enabled: !!pageId,
  });

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setSlug(page.slug);
      setNavLabel(page.nav_label ?? "");
      setShowInNav(page.show_in_nav);
      setCoverImage(page.cover_image_url);
      setBlocks(jsonToBlocks(page.blocks));
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await updatePage(pageId!, {
        title,
        slug,
        body: blocks.map((b) => b.content.text ?? "").join("\n\n"),
        blocks: blocksToJson(blocks),
        cover_image_url: coverImage,
        nav_label: navLabel || null,
        show_in_nav: showInNav,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  const addBlock = (type: BlockType) => {
    const block = createBlock(type);
    setBlocks([...blocks, block]);
    setSelectedBlockId(block.id);
  };

  const updateBlock = (id: string, content: Partial<Block["content"]>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...content } } : b)));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = blocks.findIndex((b) => b.id === id);
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const updated = [...blocks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setBlocks(updated);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load page"
        description={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
      />
    );
  }

  if (!page) {
    return <ErrorState title="Page not found" />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/event/${eventId}/pages`}>
            <Button variant="ghost" size="sm">
              ← Back to pages
            </Button>
          </Link>
          <h2 className="text-xl font-bold text-dash-text">Page Builder</h2>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save changes
        </Button>
      </div>

      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved!</p>
      )}
      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      )}

      {/* Page settings */}
      <Card className="p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Page title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="URL slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Nav label"
            type="text"
            value={navLabel}
            onChange={(e) => setNavLabel(e.target.value)}
            placeholder="Label shown in navigation"
          />
          <Select
            label="Show in navigation"
            value={showInNav ? "true" : "false"}
            onChange={(e) => setShowInNav(e.target.value === "true")}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </div>
        <ImageUpload
          label="Cover image"
          value={coverImage}
          onChange={setCoverImage}
          pathPrefix={`events/${eventId}/pages`}
          aspectRatio="wide"
        />
      </Card>

      {/* Block types palette */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-dash-text mb-3">Add Block</h3>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              type="button"
              onClick={() => addBlock(bt.type)}
              className="inline-flex items-center gap-2 rounded-md border border-dash-border bg-dash-bg px-3 py-1.5 text-sm font-medium text-dash-text hover:border-dash-primary hover:bg-dash-primary/5 transition-colors"
            >
              <span className="text-base">{bt.icon}</span>
              {bt.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Blocks */}
      <div className="space-y-3">
        {blocks.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-dash-muted">
              No blocks yet. Add a block from the palette above to get started.
            </p>
          </Card>
        )}
        {blocks.map((block, index) => (
          <Card
            key={block.id}
            className={cn(
              "p-4 transition-colors",
              selectedBlockId === block.id && "border-dash-primary"
            )}
            onClick={() => setSelectedBlockId(block.id)}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">
                  {BLOCK_TYPES.find((bt) => bt.type === block.type)?.icon}
                </span>
                <span className="text-sm font-medium text-dash-text capitalize">
                  {block.type}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={index === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveBlock(block.id, "up");
                  }}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={index === blocks.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveBlock(block.id, "down");
                  }}
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBlock(block.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Block editor */}
            <BlockEditor block={block} onChange={(content) => updateBlock(block.id, content)} eventId={eventId} />
          </Card>
        ))}
      </div>
    </div>
  );
}

function BlockEditor({
  block,
  onChange,
  eventId,
}: {
  block: Block;
  onChange: (content: Partial<Block["content"]>) => void;
  eventId: string;
}) {
  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <Input
            type="text"
            value={block.content.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Heading text"
          />
          <div className="flex gap-2">
            <Select
              value={String(block.content.level ?? 2)}
              onChange={(e) => onChange({ level: Number(e.target.value) as 1 | 2 | 3 })}
            >
              <option value="1">H1</option>
              <option value="2">H2</option>
              <option value="3">H3</option>
            </Select>
            <Select
              value={block.content.align ?? "left"}
              onChange={(e) => onChange({ align: e.target.value as "left" | "center" | "right" })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </div>
        </div>
      );
    case "paragraph":
      return (
        <div>
          <Textarea
            value={block.content.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Paragraph text"
            rows={3}
          />
          <Select
            className="mt-2"
            value={block.content.align ?? "left"}
            onChange={(e) => onChange({ align: e.target.value as "left" | "center" | "right" })}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </Select>
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          <ImageUpload
            value={block.content.url ?? null}
            onChange={(url) => onChange({ url: url ?? "" })}
            pathPrefix={`events/${eventId}/blocks`}
            aspectRatio="auto"
          />
          <Input
            type="text"
            value={block.content.alt ?? ""}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="Alt text"
          />
        </div>
      );
    case "button":
      return (
        <div className="space-y-2">
          <Input
            type="text"
            value={block.content.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Button text"
          />
          <Input
            type="text"
            value={block.content.url ?? ""}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="Button URL"
          />
          <Select
            value={block.content.variant ?? "primary"}
            onChange={(e) => onChange({ variant: e.target.value as "primary" | "secondary" })}
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </Select>
        </div>
      );
    case "divider":
      return <div className="border-t border-dash-border" />;
    case "spacer":
      return <div className="h-12 bg-dash-bg rounded text-center text-xs text-dash-muted py-4">Spacer block</div>;
    default:
      return null;
  }
}
