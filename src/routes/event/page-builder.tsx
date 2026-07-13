import { useState, useEffect } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import {
  Button, Card, Input, Toggle, Badge, ErrorState, LoadingSpinner, Modal,
} from "../../components/ui";
import { BlockEditor, BLOCK_TYPES, createBlock, genId, type Block } from "./block-editor";

export default function PageBuilder() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: page, isLoading, isError, refetch } = useQuery({
    queryKey: ["custom_pages", event.id, pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("id", pageId!)
        .eq("event_id", event.id)
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
    enabled: !!pageId,
  });

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [isFooter, setIsFooter] = useState(false);
  const [body, setBody] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [blockPickerOpen, setBlockPickerOpen] = useState(false);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setSlug(page.slug);
      setNavLabel(page.nav_label ?? "");
      setShowInNav(page.show_in_nav);
      setIsPublished(page.is_published);
      setIsFooter(page.is_footer);
      setBody(page.body ?? "");
      const parsed = Array.isArray(page.blocks) ? (page.blocks as unknown as Block[]) : [];
      setBlocks(parsed.map((b) => ({ ...b, id: b.id || genId() })));
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("custom_pages")
        .update({
          title, slug, nav_label: navLabel, show_in_nav: showInNav,
          is_published: isPublished, is_footer: isFooter, body,
          blocks: blocks as unknown as Json,
        })
        .eq("id", pageId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_pages", event.id] });
      queryClient.invalidateQueries({ queryKey: ["custom_pages", event.id, pageId] });
      setSavedMsg("Saved successfully");
      setTimeout(() => setSavedMsg(null), 3000);
    },
  });

  const addBlock = (type: string) => {
    setBlocks([...blocks, createBlock(type)]);
    setBlockPickerOpen(false);
  };

  const updateBlock = (id: string, data: Record<string, unknown>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, data } : b)));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setBlocks(newBlocks);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (isError || !page) {
    return (
      <div className="space-y-4">
        <ErrorState message="Failed to load page." onRetry={() => refetch()} />
        <div className="text-center">
          <Button variant="secondary" onClick={() => navigate(`/event/${event.id}/pages`)}>
            Back to Pages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(`/event/${event.id}/pages`)}
            className="text-dash-muted hover:text-dash-text">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-dash-text">Page Builder</h2>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
        </p>
      )}
      {savedMsg && <p className="text-sm text-green-600">{savedMsg}</p>}

      <Card className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Page Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="page-url" />
          <Input label="Nav Label" value={navLabel} onChange={(e) => setNavLabel(e.target.value)} placeholder="Label shown in navigation" />
          <Input label="Body (fallback text)" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Optional fallback text" />
        </div>
        <div className="flex flex-wrap gap-4">
          <Toggle checked={showInNav} onChange={setShowInNav} label="Show in navigation" />
          <Toggle checked={isPublished} onChange={setIsPublished} label="Published" />
          <Toggle checked={isFooter} onChange={setIsFooter} label="Footer page" />
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dash-text">Blocks ({blocks.length})</h3>
          <Button size="sm" onClick={() => setBlockPickerOpen(true)}>+ Add Block</Button>
        </div>

        {blocks.length === 0 && (
          <Card className="text-center text-sm text-dash-muted py-8">
            No blocks yet. Click "Add Block" to start building your page.
          </Card>
        )}

        {blocks.map((block, index) => (
          <BlockEditor
            key={block.id}
            block={block}
            index={index}
            total={blocks.length}
            onChange={(data) => updateBlock(block.id, data)}
            onRemove={() => removeBlock(block.id)}
            onMoveUp={() => moveBlock(index, "up")}
            onMoveDown={() => moveBlock(index, "down")}
          />
        ))}
      </div>

      <Modal open={blockPickerOpen} onClose={() => setBlockPickerOpen(false)} title="Add Block" size="lg">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {BLOCK_TYPES.map((bt) => (
            <button key={bt.type} type="button" onClick={() => addBlock(bt.type)}
              className="flex flex-col items-center gap-2 rounded-lg border border-dash-border bg-dash-surface p-4 text-center transition-colors hover:border-dash-primary hover:bg-dash-bg">
              <span className="text-2xl">{bt.icon}</span>
              <span className="text-sm font-medium text-dash-text">{bt.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
