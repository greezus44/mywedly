import React, { useEffect, useState, useRef, useCallback } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card, Badge, Select, Modal, LoadingSpinner, ErrorState, EmptyState, FormField } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { cn } from "../../lib/utils";

type BlockType =
  | "heading" | "paragraph" | "image" | "spacer" | "divider" | "gallery"
  | "video" | "button" | "columns" | "list" | "quote" | "countdown"
  | "map" | "rsvp-form" | "guest-list" | "schedule" | "venue" | "faq";

interface Block {
  id: string;
  type: BlockType;
  data: Record<string, any>;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
  { type: "heading", label: "Heading", icon: "H" },
  { type: "paragraph", label: "Paragraph", icon: "¶" },
  { type: "image", label: "Image", icon: "🖼" },
  { type: "spacer", label: "Spacer", icon: "↕" },
  { type: "divider", label: "Divider", icon: "—" },
  { type: "gallery", label: "Gallery", icon: "▦" },
  { type: "video", label: "Video", icon: "▶" },
  { type: "button", label: "Button", icon: "▢" },
  { type: "columns", label: "Columns", icon: "⫴" },
  { type: "list", label: "List", icon: "☰" },
  { type: "quote", label: "Quote", icon: "❝" },
  { type: "countdown", label: "Countdown", icon: "⏰" },
  { type: "map", label: "Map", icon: "📍" },
  { type: "rsvp-form", label: "RSVP Form", icon: "✓" },
  { type: "guest-list", label: "Guest List", icon: "👥" },
  { type: "schedule", label: "Schedule", icon: "📅" },
  { type: "venue", label: "Venue", icon: "🏛" },
  { type: "faq", label: "FAQ", icon: "?" },
];

function newBlock(type: BlockType): Block {
  return { id: crypto.randomUUID(), type, data: {} };
}

function BlockEditor({ block, onChange, eventId }: { block: Block; onChange: (data: Record<string, any>) => void; eventId: string }) {
  const update = (key: string, val: any) => onChange({ ...block.data, [key]: val });

  switch (block.type) {
    case "heading":
      return <Input label="Heading Text" value={block.data.text ?? ""} onChange={(e) => update("text", e.target.value)} />;
    case "paragraph":
      return (
        <div>
          <label className="block text-sm font-medium text-dash-text mb-1.5">Paragraph</label>
          <RichTextEditor value={block.data.html ?? ""} onChange={(html) => update("html", html)} />
        </div>
      );
    case "image":
      return <ImageUpload label="Image" value={block.data.url ?? null} onChange={(url) => update("url", url)} eventId={eventId} />;
    case "spacer":
      return <Input label="Height (px)" type="number" value={block.data.height ?? 40} onChange={(e) => update("height", Number(e.target.value))} />;
    case "divider":
      return null;
    case "gallery":
      return (
        <div className="space-y-2">
          <p className="text-sm text-dash-muted">Add image URLs (one per line):</p>
          <Textarea rows={4} value={(block.data.urls ?? []).join("\n")} onChange={(e) => update("urls", e.target.value.split("\n").filter(Boolean))} />
        </div>
      );
    case "video":
      return <Input label="Video URL (YouTube/Vimeo)" value={block.data.url ?? ""} onChange={(e) => update("url", e.target.value)} />;
    case "button":
      return (
        <div className="space-y-2">
          <Input label="Button Text" value={block.data.text ?? ""} onChange={(e) => update("text", e.target.value)} />
          <Input label="Link URL" value={block.data.url ?? ""} onChange={(e) => update("url", e.target.value)} />
        </div>
      );
    case "columns":
      return (
        <div className="space-y-2">
          <Input label="Column 1" value={block.data.col1 ?? ""} onChange={(e) => update("col1", e.target.value)} />
          <Input label="Column 2" value={block.data.col2 ?? ""} onChange={(e) => update("col2", e.target.value)} />
        </div>
      );
    case "list":
      return <Textarea label="Items (one per line)" rows={5} value={(block.data.items ?? []).join("\n")} onChange={(e) => update("items", e.target.value.split("\n").filter(Boolean))} />;
    case "quote":
      return (
        <div className="space-y-2">
          <Textarea label="Quote" rows={3} value={block.data.text ?? ""} onChange={(e) => update("text", e.target.value)} />
          <Input label="Author" value={block.data.author ?? ""} onChange={(e) => update("author", e.target.value)} />
        </div>
      );
    case "countdown":
      return <Input label="Target Date" type="date" value={block.data.date ?? ""} onChange={(e) => update("date", e.target.value)} />;
    case "map":
      return <Input label="Google Maps Embed URL" value={block.data.url ?? ""} onChange={(e) => update("url", e.target.value)} />;
    case "venue":
      return (
        <div className="space-y-2">
          <Input label="Venue Name" value={block.data.name ?? ""} onChange={(e) => update("name", e.target.value)} />
          <Textarea label="Address" rows={2} value={block.data.address ?? ""} onChange={(e) => update("address", e.target.value)} />
        </div>
      );
    case "faq":
      return (
        <div className="space-y-2">
          <Input label="Question" value={block.data.question ?? ""} onChange={(e) => update("question", e.target.value)} />
          <Textarea label="Answer" rows={3} value={block.data.answer ?? ""} onChange={(e) => update("answer", e.target.value)} />
        </div>
      );
    case "rsvp-form":
    case "guest-list":
    case "schedule":
      return <p className="text-sm text-dash-muted">This block displays automatically on the guest page.</p>;
    default:
      return null;
  }
}

export default function PageBuilder() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [saved, setSaved] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: page, isLoading, error, refetch } = useQuery({
    queryKey: ["custom_page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_pages").select("*").eq("id", pageId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!pageId,
  });

  useEffect(() => {
    if (page) {
      setTitle(page.title ?? "");
      setSlug(page.slug ?? "");
      setShowInNav(page.show_in_nav ?? true);
      setBlocks((page.blocks as Block[]) ?? []);
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const { error } = await supabase.from("custom_pages").update(payload).eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom_pages", event.id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const triggerSave = useCallback((newBlocks: Block[], newTitle: string, newSlug: string, newNav: boolean) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate({
        title: newTitle,
        slug: newSlug,
        show_in_nav: newNav,
        nav_label: newTitle,
        blocks: newBlocks as unknown as Json,
      });
    }, 1000);
  }, [saveMutation, pageId]);

  function updateBlocks(newBlocks: Block[]) {
    setBlocks(newBlocks);
    triggerSave(newBlocks, title, slug, showInNav);
  }

  function addBlock(type: BlockType) {
    updateBlocks([...blocks, newBlock(type)]);
  }

  function updateBlock(id: string, data: Record<string, any>) {
    updateBlocks(blocks.map((b) => (b.id === id ? { ...b, data } : b)));
  }

  function removeBlock(id: string) {
    updateBlocks(blocks.filter((b) => b.id !== id));
  }

  function moveBlock(from: number, to: number) {
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(from, 1);
    newBlocks.splice(to, 0, moved);
    updateBlocks(newBlocks);
    setDragIndex(null);
  }

  function handleTitleChange(v: string) { setTitle(v); triggerSave(blocks, v, slug, showInNav); }
  function handleSlugChange(v: string) { setSlug(v); triggerSave(blocks, title, v, showInNav); }
  function handleNavChange(v: boolean) { setShowInNav(v); triggerSave(blocks, title, slug, v); }

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner className="h-8 w-8" /></div>;
  if (error) return <ErrorState message="Failed to load page." onRetry={() => refetch()} />;
  if (!page) return <EmptyState title="Page not found" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/event/${event.id}/pages`)}>← Pages</Button>
          <h2 className="text-xl font-semibold text-dash-text">Page Builder</h2>
        </div>
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        {saveMutation.isPending && <LoadingSpinner className="h-4 w-4" />}
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Page Title" value={title} onChange={(e) => handleTitleChange(e.target.value)} />
          <Input label="URL Slug" value={slug} onChange={(e) => handleSlugChange(e.target.value)} />
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={showInNav} onChange={(e) => handleNavChange(e.target.checked)} className="accent-dash-primary" />
          <span className="text-sm text-dash-text">Show in navigation</span>
        </label>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-dash-text mb-3">Add Block</h3>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              onClick={() => addBlock(bt.type)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dash-border bg-dash-surface text-sm text-dash-text hover:border-dash-primary/50 hover:bg-dash-bg transition-colors"
            >
              <span className="text-base">{bt.icon}</span>
              {bt.label}
            </button>
          ))}
        </div>
      </Card>

      {blocks.length === 0 ? (
        <EmptyState title="No blocks yet" description="Add blocks above to build your page content." />
      ) : (
        <div className="space-y-2">
          {blocks.map((block, index) => (
            <Card
              key={block.id}
              className={cn(
                "p-4 transition-opacity",
                dragIndex === index && "opacity-40 border-dash-primary",
              )}
              {...({
                draggable: true,
                onDragStart: () => setDragIndex(index),
                onDragOver: (e: React.DragEvent) => e.preventDefault(),
                onDrop: () => dragIndex !== null && moveBlock(dragIndex, index),
              } as any)}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="cursor-grab text-dash-muted text-lg">⠿</span>
                  <Badge variant="info">{block.type}</Badge>
                </div>
                <div className="flex gap-1">
                  {index > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => moveBlock(index, index - 1)}>↑</Button>
                  )}
                  {index < blocks.length - 1 && (
                    <Button size="sm" variant="ghost" onClick={() => moveBlock(index, index + 1)}>↓</Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeBlock(block.id)}>Delete</Button>
                </div>
              </div>
              <BlockEditor block={block} onChange={(data) => updateBlock(block.id, data)} eventId={event.id} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
