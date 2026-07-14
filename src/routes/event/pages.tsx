import { useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Card, LoadingSpinner, ErrorState, EmptyState, Modal, Toggle } from "../../components/ui";
import { slugify } from "../../lib/theme";
import { formatDate } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function PagesPage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editPage, setEditPage] = useState<CustomPage | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: pages, isLoading, isError, error } = useQuery({
    queryKey: ["custom-pages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CustomPage[];
    },
  });

  const resetForm = () => {
    setTitle(""); setSlug(""); setShowInNav(true);
    setEditPage(null); setFormError(null);
  };

  const openAdd = () => { resetForm(); setShowForm(true); };
  const openEdit = (page: CustomPage) => {
    setEditPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setShowInNav(page.show_in_nav);
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const finalSlug = slug || slugify(title);
      if (!finalSlug) throw new Error("Slug is required");
      const payload = {
        event_id: eventId,
        title,
        slug: finalSlug,
        show_in_nav: showInNav,
        is_published: editPage?.is_published ?? false,
      };
      if (editPage) {
        const { error } = await supabase.from("custom_pages").update(payload).eq("id", editPage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("custom_pages").insert({ ...payload, blocks: [] });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setShowForm(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save page");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] }),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ page, published }: { page: CustomPage; published: boolean }) => {
      const { error } = await supabase.from("custom_pages").update({ is_published: published }).eq("id", page.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load pages" message={error instanceof Error ? error.message : "Unknown error"} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Pages</h2>
        <Button size="sm" onClick={openAdd}>Add Page</Button>
      </div>

      {!pages || pages.length === 0 ? (
        <EmptyState title="No custom pages" description="Create custom pages for your event website." action={<Button size="sm" onClick={openAdd}>Add Page</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pages.map((page) => (
            <Card key={page.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-dash-text">{page.title}</h3>
                  <p className="text-sm text-dash-muted">/{page.slug}</p>
                  <p className="mt-1 text-xs text-dash-muted">Updated {formatDate(page.updated_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Toggle checked={page.is_published} onChange={(v) => togglePublish.mutate({ page, published: v })} />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Link to={`../page-builder/${page.id}`}>
                  <Button size="sm" variant="secondary">Edit Content</Button>
                </Link>
                <button onClick={() => openEdit(page)} className="text-xs text-dash-primary hover:underline">Settings</button>
                <button onClick={() => deleteMutation.mutate(page.id)} className="text-xs text-dash-danger hover:underline">Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); resetForm(); }} title={editPage ? "Edit Page" : "Add Page"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => { setTitle(e.target.value); if (!editPage) setSlug(slugify(e.target.value)); }} required autoFocus />
          <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="page-url" />
          <Toggle label="Show in navigation" checked={showInNav} onChange={setShowInNav} />
          {formError && <p className="text-sm text-dash-danger">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editPage ? "Save" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
