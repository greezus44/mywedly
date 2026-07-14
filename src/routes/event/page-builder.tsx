import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";

type Block =
  | { type: "heading"; text: string }
  | { type: "text"; text: string }
  | { type: "image"; url: string }
  | { type: "spacer" }
  | { type: "divider" };

const BLOCK_TYPES: { type: Block["type"]; label: string }[] = [
  { type: "heading", label: "Heading" },
  { type: "text", label: "Text" },
  { type: "image", label: "Image" },
  { type: "spacer", label: "Spacer" },
  { type: "divider", label: "Divider" },
];

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  blocks: unknown[];
}

function newBlock(type: Block["type"]): Block {
  switch (type) {
    case "heading":
      return { type: "heading", text: "" };
    case "text":
      return { type: "text", text: "" };
    case "image":
      return { type: "image", url: "" };
    case "spacer":
      return { type: "spacer" };
    case "divider":
      return { type: "divider" };
  }
}

export function PageBuilder() {
  const { eventId, pageId } = useParams<{ eventId: string; pageId: string }>();
  const qc = useQueryClient();
  const [page, setPage] = useState<CustomPage | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (event && pageId) {
      const content = (event.draft_content ?? event.content ?? {}) as Record<string, unknown>;
      const allPages = (content.pages as unknown as CustomPage[]) || [];
      const found = allPages.find((p) => p.id === pageId) ?? null;
      setPage(found);
      setBlocks((found?.blocks as unknown as Block[]) || []);
    }
  }, [event, pageId]);

  const save = async () => {
    if (!event || !page || !pageId) return;
    setSaving(true);
    const content = { ...((event.draft_content ?? event.content ?? {}) as Record<string, unknown>) };
    const allPages = (content.pages as unknown as CustomPage[]) || [];
    const next = allPages.map((p) => (p.id === pageId ? { ...p, blocks } : p));
    content.pages = next;
    const { error } = await supabase
      .from("user_events")
      .update({ draft_content: content })
      .eq("id", event.id);
    setSaving(false);
    if (!error) qc.invalidateQueries({ queryKey: ["event", eventId] });
  };

  const updateBlock = (index: number, patch: Partial<Block>) => {
    setBlocks((prev) => prev.map((b, i) => (i === index ? ({ ...b, ...patch } as Block) : b)));
  };

  const addBlock = (type: Block["type"]) => {
    setBlocks((prev) => [...prev, newBlock(type)]);
  };

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  if (!event) return <div>Loading…</div>;
  if (!page) return <div>Page not found.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">{page.title}</h2>
        <p className="text-sm text-gray-500">Build your page by adding and arranging blocks.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {BLOCK_TYPES.map((b) => (
          <Button key={b.type} variant="outline" size="sm" onClick={() => addBlock(b.type)}>
            + {b.label}
          </Button>
        ))}
      </div>

      {blocks.length > 0 ? (
        <div className="space-y-3">
          {blocks.map((block, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{block.type}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => moveBlock(i, -1)} disabled={i === 0} className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30">↑</button>
                  <button onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30">↓</button>
                  <button onClick={() => removeBlock(i)} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              </div>

              {block.type === "heading" && (
                <Input
                  value={block.text}
                  onChange={(e) => updateBlock(i, { text: e.target.value } as Partial<Block>)}
                  placeholder="Heading text"
                />
              )}
              {block.type === "text" && (
                <textarea
                  value={block.text}
                  onChange={(e) => updateBlock(i, { text: e.target.value } as Partial<Block>)}
                  placeholder="Body text"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--event-primary,#8B7355)]"
                />
              )}
              {block.type === "image" && (
                <ImageUpload value={block.url} onChange={(url) => updateBlock(i, { url } as Partial<Block>)} bucket="event-assets" />
              )}
              {block.type === "spacer" && <div className="h-8 bg-gray-50 rounded text-center text-xs text-gray-400 leading-8">Spacer</div>}
              {block.type === "divider" && <hr className="border-gray-200" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
          <p className="text-sm text-gray-500">No blocks yet. Add a block above to start building.</p>
        </div>
      )}

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save Page"}
      </Button>
    </div>
  );
}
