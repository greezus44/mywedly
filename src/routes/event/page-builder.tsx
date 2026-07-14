import { BlockType, BLOCK_TYPES, createBlock } from "./block-types";
import type { BlockContent } from "./block-types";
import { useState } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { Button, Card, LoadingSpinner, ErrorState } from "../../components/ui";
import { BlockRenderer } from "../guest/block-renderer";
import { EventThemeProvider } from "../../lib/theme-context";

interface EventContextValue { event: UserEvent; eventId: string; }

export type { BlockType, BlockContent };
export { BLOCK_TYPES, createBlock };

export function PageBuilder() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const { pageId } = useParams<{ pageId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: page, isLoading, isError, error } = useQuery({
    queryKey: ["custom-page", pageId],
    queryFn: async () => { const { data, error } = await supabase.from("custom_pages").select("*").eq("id", pageId).single(); if (error) throw error; return data as CustomPage; },
    enabled: !!pageId,
  });

  const [blocks, setBlocks] = useState<BlockContent[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (page && !initialized) {
    setBlocks((page.blocks as unknown as BlockContent[]) ?? []);
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("custom_pages").update({ blocks }).eq("id", pageId); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-page", pageId] }),
  });

  const addBlock = (type: BlockType) => { setBlocks((p) => [...p, createBlock(type)]); };
  const updateBlock = (i: number, patch: Partial<BlockContent>) => setBlocks((p) => p.map((b, idx) => idx === i ? { ...b, ...patch } : b));
  const removeBlock = (i: number) => setBlocks((p) => p.filter((_, idx) => idx !== i));
  const moveBlock = (i: number, dir: -1 | 1) => { setBlocks((p) => { const ni = i + dir; if (ni < 0 || ni >= p.length) return p; const copy = [...p]; [copy[i], copy[ni]] = [copy[ni], copy[i]]; return copy; }); };

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load page" message={error instanceof Error ? error.message : "Unknown error"} />;
  if (!page) return <ErrorState title="Page not found" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">{page.title}</h2>
          <p className="text-sm text-dash-muted">/{page.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/event/${eventId}/pages`)}>Back</Button>
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save</Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Add Block</h3>
            <div className="flex flex-wrap gap-2">
              {BLOCK_TYPES.map((bt) => (
                <button key={bt.type} onClick={() => addBlock(bt.type)} className="rounded-lg border border-dash-border bg-dash-surface px-3 py-1.5 text-sm text-dash-text hover:bg-dash-bg">
                  {bt.label}
                </button>
              ))}
            </div>
          </Card>
          {blocks.map((block, i) => (
            <Card key={i}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-dash-text">{block.type}</span>
                <div className="flex gap-2">
                  <button onClick={() => moveBlock(i, -1)} className="text-xs text-dash-muted hover:text-dash-text">↑</button>
                  <button onClick={() => moveBlock(i, 1)} className="text-xs text-dash-muted hover:text-dash-text">↓</button>
                  <button onClick={() => removeBlock(i)} className="text-xs text-dash-danger hover:underline">Remove</button>
                </div>
              </div>
              <BlockEditor block={block} onChange={(patch) => updateBlock(i, patch)} eventId={eventId} userId={event.creator_id} />
            </Card>
          ))}
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-dash-text">Preview</h3>
          <EventThemeProvider theme={event.draft_theme ?? event.theme}>
            <div className="space-y-4 rounded-lg border border-dash-border p-4">
              {blocks.length === 0 ? <p className="text-sm text-dash-muted">No blocks yet.</p> : blocks.map((block, i) => <BlockRenderer key={i} block={block} />)}
            </div>
          </EventThemeProvider>
        </div>
      </div>
    </div>
  );
}

function BlockEditor({ block, onChange, eventId, userId }: { block: BlockContent; onChange: (patch: Partial<BlockContent>) => void; eventId: string; userId: string }) {
  switch (block.type) {
    case "heading":
    case "paragraph":
      return <input value={block.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} placeholder="Text" className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />;
    case "image":
      return <input value={block.url ?? ""} onChange={(e) => onChange({ url: e.target.value })} placeholder="Image URL" className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />;
    case "spacer":
      return <input type="number" value={block.height ?? 40} onChange={(e) => onChange({ height: Number(e.target.value) })} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />;
    case "divider":
      return <p className="text-sm text-dash-muted">A horizontal divider line.</p>;
    case "button":
      return (
        <div className="space-y-2">
          <input value={block.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} placeholder="Button text" className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
          <input value={block.href ?? ""} onChange={(e) => onChange({ href: e.target.value })} placeholder="Link URL" className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
        </div>
      );
    case "video":
      return <input value={block.url ?? ""} onChange={(e) => onChange({ url: e.target.value })} placeholder="Video URL (YouTube/Vimeo)" className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />;
    case "quote":
      return (
        <div className="space-y-2">
          <textarea value={block.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} placeholder="Quote text" rows={3} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
          <input value={block.author ?? ""} onChange={(e) => onChange({ author: e.target.value })} placeholder="Author (optional)" className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
        </div>
      );
    case "countdown":
      return <input type="datetime-local" value={block.targetDate ?? ""} onChange={(e) => onChange({ targetDate: e.target.value })} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />;
    case "map":
      return <input value={block.address ?? ""} onChange={(e) => onChange({ address: e.target.value })} placeholder="Address" className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />;
    case "list":
      return <textarea value={(block.items ?? []).join("\n")} onChange={(e) => onChange({ items: e.target.value.split("\n") })} placeholder="One item per line" rows={4} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />;
    default:
      return <p className="text-sm text-dash-muted">No editor for this block type.</p>;
  }
}
