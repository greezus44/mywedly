import { useState, useEffect } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui";
import { LoadingSpinner, ErrorState } from "../../components/ui";
import { BLOCK_TYPES, createBlock, blocksToJson, jsonToBlocks, type Block, type BlockType } from "./block-types";

interface EventContextValue { event: UserEvent; eventId: string; }

export function PageBuilder() {
  const { pageId } = useParams<{ pageId: string }>();
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);

  const { data: page, isLoading, isError, error } = useQuery({
    queryKey: ["custom-page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_pages").select("*").eq("id", pageId).maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
    enabled: !!pageId,
  });

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setSlug(page.slug);
      setBlocks(jsonToBlocks(page.blocks));
    }
  }, [page]);

  const updateBlock = (id: string, content: Partial<Block["content"]>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...content } } : b)));
  };
  const removeBlock = (id: string) => setBlocks((prev) => prev.filter((b) => b.id !== id));
  const moveBlock = (id: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };
  const addBlock = (type: BlockType) => { setBlocks((prev) => [...prev, createBlock(type)]); setShowLibrary(false); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("custom_pages").update({
        title, slug, blocks: blocksToJson(blocks),
      }).eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load page" message={error instanceof Error ? error.message : "Unknown error"} />;
  if (!page) return <div className="py-12 text-center text-dash-muted">Page not found. <button onClick={() => navigate(`/event/${eventId}/pages`)} className="text-dash-primary hover:underline">Back to pages</button></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/event/${eventId}/pages`)} className="text-sm text-dash-muted hover:text-dash-text">← Pages</button>
          <h2 className="text-lg font-semibold text-dash-text">Page Builder</h2>
        </div>
        <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save</Button>
      </div>
      {saveMutation.isError && <p className="text-sm text-dash-danger">{saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}</p>}
      {saveMutation.isSuccess && <p className="text-sm text-green-600">Saved</p>}

      <div className="grid gap-4 rounded-lg border border-dash-border bg-dash-surface p-4 sm:grid-cols-2">
        <Input label="Page Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
      </div>

      <div className="space-y-3">
        {blocks.map((block, i) => (
          <div key={block.id} className="rounded-lg border border-dash-border bg-dash-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-dash-muted">{block.type}</span>
              <div className="flex gap-1">
                <button onClick={() => moveBlock(block.id, -1)} disabled={i === 0} className="rounded p-1 text-dash-muted hover:bg-dash-bg disabled:opacity-30">↑</button>
                <button onClick={() => moveBlock(block.id, 1)} disabled={i === blocks.length - 1} className="rounded p-1 text-dash-muted hover:bg-dash-bg disabled:opacity-30">↓</button>
                <button onClick={() => removeBlock(block.id)} className="rounded p-1 text-dash-danger hover:bg-red-50">✕</button>
              </div>
            </div>
            <BlockEditor block={block} onChange={(c) => updateBlock(block.id, c)} />
          </div>
        ))}
      </div>

      <Button variant="secondary" onClick={() => setShowLibrary((p) => !p)}>+ Add Block</Button>
      {showLibrary && (
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-dash-border bg-dash-surface p-4 sm:grid-cols-4">
          {BLOCK_TYPES.map((bt) => (
            <button key={bt.type} onClick={() => addBlock(bt.type)} className="flex flex-col items-center gap-1 rounded-lg border border-dash-border p-3 text-center text-xs text-dash-text hover:bg-dash-bg">
              <span className="text-lg">{bt.icon}</span>
              {bt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockEditor({ block, onChange }: { block: Block; onChange: (c: Partial<Block["content"]>) => void }) {
  const c = block.content;
  switch (block.type) {
    case "heading":
      return <div className="space-y-2"><Input label="Text" value={c.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} /><div><label className="mb-1 block text-xs text-dash-muted">Level</label><select value={c.level ?? 2} onChange={(e) => onChange({ level: Number(e.target.value) })} className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm"><option value={1}>H1</option><option value={2}>H2</option><option value={3}>H3</option></select></div></div>;
    case "paragraph":
      return <Textarea label="Text" value={c.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} rows={4} />;
    case "image":
      return <div className="space-y-2"><Input label="Image URL" value={c.url ?? ""} onChange={(e) => onChange({ url: e.target.value })} /><Input label="Alt Text" value={c.alt ?? ""} onChange={(e) => onChange({ alt: e.target.value })} /></div>;
    case "spacer":
      return <div><label className="mb-1 block text-xs text-dash-muted">Height (px): {c.height ?? 32}</label><input type="range" value={c.height ?? 32} onChange={(e) => onChange({ height: Number(e.target.value) })} min={8} max={200} className="w-full accent-dash-primary" /></div>;
    case "divider":
      return <p className="text-sm text-dash-muted">A horizontal divider line.</p>;
    case "gallery":
      return <Textarea label="Image URLs (one per line)" value={(c.images ?? []).join("\n")} onChange={(e) => onChange({ images: e.target.value.split("\n").filter(Boolean) })} rows={4} />;
    case "video":
      return <Input label="Video URL (YouTube/Vimeo)" value={c.url ?? ""} onChange={(e) => onChange({ url: e.target.value })} />;
    case "button":
      return <div className="space-y-2"><Input label="Label" value={c.label ?? ""} onChange={(e) => onChange({ label: e.target.value })} /><Input label="Link URL" value={c.href ?? ""} onChange={(e) => onChange({ href: e.target.value })} /></div>;
    case "list":
      return <Textarea label="Items (one per line)" value={(c.items ?? []).join("\n")} onChange={(e) => onChange({ items: e.target.value.split("\n").filter(Boolean) })} rows={4} />;
    case "quote":
      return <Textarea label="Quote Text" value={c.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} rows={3} />;
    case "countdown":
      return <Input label="Target Date & Time" type="datetime-local" value={(c.targetDate ?? "").slice(0, 16)} onChange={(e) => onChange({ targetDate: new Date(e.target.value).toISOString() })} />;
    case "map":
      return <div className="space-y-2"><Input label="Address" value={c.address ?? ""} onChange={(e) => onChange({ address: e.target.value })} /><div><label className="mb-1 block text-xs text-dash-muted">Zoom: {c.zoom ?? 14}</label><input type="range" value={c.zoom ?? 14} onChange={(e) => onChange({ zoom: Number(e.target.value) })} min={1} max={20} className="w-full accent-dash-primary" /></div></div>;
    case "venue":
      return <div className="space-y-2"><Input label="Venue Name" value={c.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} /><Input label="Address" value={c.address ?? ""} onChange={(e) => onChange({ address: e.target.value })} /></div>;
    case "faq":
      return <div className="space-y-2">{(c.questions ?? []).map((q, i) => (
        <div key={i} className="space-y-1 rounded border border-dash-border p-2">
          <Input label={`Question ${i + 1}`} value={q.question} onChange={(e) => onChange({ questions: (c.questions ?? []).map((x, j) => j === i ? { ...x, question: e.target.value } : x) })} />
          <Input label="Answer" value={q.answer} onChange={(e) => onChange({ questions: (c.questions ?? []).map((x, j) => j === i ? { ...x, answer: e.target.value } : x) })} />
          <button onClick={() => onChange({ questions: (c.questions ?? []).filter((_, j) => j !== i) })} className="text-xs text-dash-danger hover:underline">Remove</button>
        </div>
      ))}<Button size="sm" variant="secondary" onClick={() => onChange({ questions: [...(c.questions ?? []), { question: "", answer: "" }] })}>+ Add Q&A</Button></div>;
    case "columns":
      return <div className="space-y-2">{(c.columns ?? []).map((col, i) => (
        <div key={i} className="flex gap-2"><Input label={`Column ${i + 1}`} value={col.text ?? ""} onChange={(e) => onChange({ columns: (c.columns ?? []).map((x, j) => j === i ? { ...x, text: e.target.value } : x) })} /><button onClick={() => onChange({ columns: (c.columns ?? []).filter((_, j) => j !== i) })} className="mt-6 text-xs text-dash-danger">✕</button></div>
      ))}<Button size="sm" variant="secondary" onClick={() => onChange({ columns: [...(c.columns ?? []), { text: "" }] })}>+ Add Column</Button></div>;
    default:
      return <p className="text-sm text-dash-muted">No editor available for this block type.</p>;
  }
}
