import { useState, useEffect } from "react";
import { useParams, useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Card, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { EventThemeProvider } from "../../lib/theme-context";
import { BLOCK_TYPES, createBlock, type BlockContent, type BlockType } from "./block-types";
import { BlockRenderer } from "../guest/block-renderer";
import { cn } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function PageBuilder() {
  const { pageId } = useParams<{ pageId: string }>();
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();

  const { data: page, isLoading, isError, error } = useQuery({
    queryKey: ["custom-page", pageId],
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

  const [blocks, setBlocks] = useState<BlockContent[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (page?.blocks && Array.isArray(page.blocks)) {
      setBlocks(page.blocks as unknown as BlockContent[]);
    } else {
      setBlocks([]);
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({ blocks })
        .eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load page" message={error instanceof Error ? error.message : "Unknown error"} />;
  if (!page) return <EmptyState title="Page not found" />;

  const addBlock = (type: BlockType) => {
    setBlocks((p) => [...p, createBlock(type)]);
    setShowLibrary(false);
  };

  const updateBlock = (id: string, data: Record<string, unknown>) => {
    setBlocks((p) => p.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...data } } : b)));
  };

  const removeBlock = (id: string) => {
    setBlocks((p) => p.filter((b) => b.id !== id));
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    setBlocks((p) => {
      const idx = p.findIndex((b) => b.id === id);
      if (idx === -1) return p;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= p.length) return p;
      const copy = [...p];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="../pages"><Button variant="ghost" size="sm">← Pages</Button></Link>
          <h2 className="text-lg font-semibold text-dash-text">{page.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save</Button>
        </div>
      </div>

      {/* Block editor */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {blocks.length === 0 && (
            <Card>
              <p className="text-sm text-dash-muted text-center py-8">No blocks yet. Click "Add Block" to get started.</p>
            </Card>
          )}
          {blocks.map((block, i) => (
            <Card key={block.id}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-dash-muted">{block.type}</span>
                <div className="flex gap-1">
                  <button onClick={() => moveBlock(block.id, -1)} disabled={i === 0} className="text-xs text-dash-muted hover:text-dash-text disabled:opacity-30">↑</button>
                  <button onClick={() => moveBlock(block.id, 1)} disabled={i === blocks.length - 1} className="text-xs text-dash-muted hover:text-dash-text disabled:opacity-30">↓</button>
                  <button onClick={() => removeBlock(block.id)} className="text-xs text-dash-danger hover:underline">Remove</button>
                </div>
              </div>
              <BlockEditor block={block} onChange={(data) => updateBlock(block.id, data)} eventId={eventId} userId={event.creator_id} />
            </Card>
          ))}
          <Button variant="secondary" className="w-full" onClick={() => setShowLibrary(true)}>+ Add Block</Button>
        </div>

        {/* Live preview */}
        <div>
          <Card className="p-0 overflow-hidden">
            <EventThemeProvider theme={event.draft_theme ?? event.theme}>
              <div className="p-4">
                {blocks.length === 0 ? (
                  <p className="py-8 text-center text-sm" style={{ color: "var(--event-muted)" }}>Preview will appear here</p>
                ) : (
                  <div className="space-y-4">
                    {blocks.map((block) => (
                      <BlockRenderer key={block.id} block={block} />
                    ))}
                  </div>
                )}
              </div>
            </EventThemeProvider>
          </Card>
        </div>
      </div>

      {/* Block library modal */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLibrary(false)} />
          <div className="relative z-10 w-full max-w-2xl rounded-lg border border-dash-border bg-dash-surface p-5 shadow-xl">
            <h2 className="mb-4 text-base font-semibold text-dash-text">Add Block</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {BLOCK_TYPES.map((bt) => (
                <button
                  key={bt.type}
                  onClick={() => addBlock(bt.type)}
                  className="flex flex-col items-start rounded-lg border border-dash-border p-3 text-left hover:bg-dash-bg"
                >
                  <span className="text-lg">{bt.icon}</span>
                  <span className="mt-1 text-sm font-medium text-dash-text">{bt.label}</span>
                  <span className="text-xs text-dash-muted">{bt.description}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setShowLibrary(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline block editor for the page builder
function BlockEditor({ block, onChange, eventId, userId }: { block: BlockContent; onChange: (data: Record<string, unknown>) => void; eventId: string; userId: string }) {
  const d = block.data;
  const update = (patch: Record<string, unknown>) => onChange({ ...d, ...patch });

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-3">
          <Input label="Text" value={(d.text as string) ?? ""} onChange={(e) => update({ text: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Level</label>
            <select value={(d.level as number) ?? 2} onChange={(e) => update({ level: Number(e.target.value) })} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:outline-none">
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </div>
        </div>
      );
    case "paragraph":
      return <RichTextEditor value={(d.html as string) ?? ""} onChange={(html) => update({ html })} />;
    case "image":
      return (
        <div className="space-y-3">
          <ImageUpload value={(d.url as string) ?? null} onChange={(url) => update({ url: url ?? "" })} userId={userId} />
          <Input label="Alt Text" value={(d.alt as string) ?? ""} onChange={(e) => update({ alt: e.target.value })} />
        </div>
      );
    case "spacer":
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">Height: {String(d.height ?? 40)}px</label>
          <input type="range" min={8} max={200} value={(d.height as number) ?? 40} onChange={(e) => update({ height: Number(e.target.value) })} className="w-full accent-dash-primary" />
        </div>
      );
    case "divider":
      return <p className="text-sm text-dash-muted">Horizontal divider line</p>;
    case "video":
      return <Input label="Video URL" value={(d.url as string) ?? ""} onChange={(e) => update({ url: e.target.value })} placeholder="YouTube or Vimeo URL" />;
    case "button":
      return (
        <div className="space-y-3">
          <Input label="Button Text" value={(d.text as string) ?? ""} onChange={(e) => update({ text: e.target.value })} />
          <Input label="URL" value={(d.url as string) ?? ""} onChange={(e) => update({ url: e.target.value })} />
        </div>
      );
    case "quote":
      return (
        <div className="space-y-3">
          <Input label="Quote" value={(d.text as string) ?? ""} onChange={(e) => update({ text: e.target.value })} />
          <Input label="Author" value={(d.author as string) ?? ""} onChange={(e) => update({ author: e.target.value })} />
        </div>
      );
    case "countdown":
      return <Input label="Target Date" type="datetime-local" value={(d.targetDate as string) ?? ""} onChange={(e) => update({ targetDate: e.target.value })} />;
    case "map":
      return <Input label="Address" value={(d.address as string) ?? ""} onChange={(e) => update({ address: e.target.value })} />;
    case "venue":
      return (
        <div className="space-y-3">
          <Input label="Venue Name" value={(d.name as string) ?? ""} onChange={(e) => update({ name: e.target.value })} />
          <Input label="Address" value={(d.address as string) ?? ""} onChange={(e) => update({ address: e.target.value })} />
        </div>
      );
    case "list":
      return (
        <div className="space-y-3">
          <Input label="Items (one per line)" value={Array.isArray(d.items) ? (d.items as string[]).join("\n") : ""} onChange={(e) => update({ items: e.target.value.split("\n") })} />
        </div>
      );
    case "faq":
      return (
        <div className="space-y-2">
          {Array.isArray(d.items) && (d.items as Array<{ question: string; answer: string }>).map((item, i) => (
            <div key={i} className="space-y-1">
              <Input value={item.question} onChange={(e) => { const items = [...(d.items as Array<{ question: string; answer: string }>)]; items[i] = { ...items[i], question: e.target.value }; update({ items }); }} placeholder="Question" />
              <Input value={item.answer} onChange={(e) => { const items = [...(d.items as Array<{ question: string; answer: string }>)]; items[i] = { ...items[i], answer: e.target.value }; update({ items }); }} placeholder="Answer" />
            </div>
          ))}
        </div>
      );
    case "gallery":
      return <p className="text-sm text-dash-muted">Gallery block — add images in the page builder</p>;
    case "columns":
      return <p className="text-sm text-dash-muted">Columns block — edit content in the preview</p>;
    case "rsvp-form":
    case "guest-list":
    case "schedule":
      return <p className="text-sm text-dash-muted">{block.type} block — renders dynamically on the guest site</p>;
    default:
      return <p className="text-sm text-dash-muted">No editor for this block type</p>;
  }
}
