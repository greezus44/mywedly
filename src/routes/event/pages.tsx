import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { slugify } from "../../lib/theme";
import { Input, Modal, LoadingSpinner, ErrorState, EmptyState, Card, Badge } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { formatDate } from "../../lib/utils";

export default function Pages() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [navLabel, setNavLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: pages, isLoading, error: queryError } = useQuery({
    queryKey: ["custom_pages", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = slugify(title);
      if (editingId) {
        const { error } = await supabase.from("custom_pages").update({
          title, nav_label: navLabel || title, slug,
        }).eq("id", editingId).select().maybeSingle();
        if (error) throw error;
      } else {
        const maxOrder = pages?.reduce((max, p) => Math.max(max, p.sort_order), -1) ?? -1;
        const { error } = await supabase.from("custom_pages").insert({
          event_id: event.id, wedding_id: event.id,
          title, nav_label: navLabel || title, slug,
          sort_order: maxOrder + 1, is_published: false, show_in_nav: true,
          blocks: [],
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_pages", event.id] });
      setModalOpen(false);
      setTitle(""); setNavLabel(""); setEditingId(null); setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to save page."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom_pages", event.id] }),
  });

  function openAdd() { setTitle(""); setNavLabel(""); setEditingId(null); setError(null); setModalOpen(true); }
  function openEdit(page: CustomPage) { setTitle(page.title); setNavLabel(page.nav_label || ""); setEditingId(page.id); setError(null); setModalOpen(true); }

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (queryError) return <ErrorState message="Failed to load pages." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Pages</h2>
          <p className="mt-1 text-sm text-dash-muted">Create and manage custom pages for your website.</p>
        </div>
        <Button onClick={openAdd}>Add Page</Button>
      </div>

      {!pages || pages.length === 0 ? (
        <EmptyState title="No pages yet" description="Create custom pages to add more content to your website." action={<Button onClick={openAdd}>Add Page</Button>} />
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <Card key={page.id} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-dash-text">{page.title}</h3>
                  {page.is_published ? <Badge variant="success">Published</Badge> : <Badge variant="warning">Draft</Badge>}
                  {page.show_in_nav && <Badge variant="info">In Nav</Badge>}
                </div>
                <div className="mt-1 flex gap-4 text-xs text-dash-muted">
                  <span>Slug: /{page.slug}</span>
                  {page.nav_label && <span>Nav: {page.nav_label}</span>}
                  <span>Updated: {formatDate(page.updated_at)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`../page-builder/${page.id}`} relative="path">
                  <Button size="sm" variant="secondary">Edit Blocks</Button>
                </Link>
                <Button size="sm" variant="secondary" onClick={() => openEdit(page)}>Settings</Button>
                <Button size="sm" variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(page.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setError(null); }} title={editingId ? "Edit Page" : "Add Page"}>
        <div className="space-y-4">
          <Input label="Page Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Travel Guide" autoFocus />
          <Input label="Navigation Label" value={navLabel} onChange={(e) => setNavLabel(e.target.value)} placeholder="Short label for navigation (optional)" />
          {error && <div className="rounded-md border border-dash-danger/30 bg-red-50 px-4 py-3 text-sm text-dash-danger">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); setError(null); }}>Cancel</Button>
            <Button loading={saveMutation.isPending} disabled={!title.trim()} onClick={() => saveMutation.mutate()}>{editingId ? "Save" : "Add"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
