import { useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Toggle } from "../../components/ui";
import { LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";
import { slugify, formatDate } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function PagesPage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: pages, isLoading, isError, error } = useQuery({
    queryKey: ["custom-pages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_pages").select("*").eq("event_id", eventId).order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");
      const finalSlug = slug || slugify(title);
      const { error } = await supabase.from("custom_pages").insert({
        event_id: eventId, title: title.trim(), slug: finalSlug,
        body: "", blocks: [], content: {}, is_published: false,
        show_in_nav: showInNav, sort_order: (pages?.length ?? 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setShowForm(false); setTitle(""); setSlug(""); setShowInNav(true); setFormError(null);
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Failed to create page"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("custom_pages").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] }),
  });

  const togglePublish = async (page: CustomPage) => {
    await supabase.from("custom_pages").update({ is_published: !page.is_published }).eq("id", page.id);
    queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
  };

  const handleCreate = async () => {
    setSaving(true); setFormError(null);
    try { await createMutation.mutateAsync(); } catch { /* handled in onError */ }
    finally { setSaving(false); }
  };

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load pages" message={error instanceof Error ? error.message : "Unknown error"} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Pages</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>Add Page</Button>
      </div>
      {!pages || pages.length === 0 ? (
        <EmptyState title="No custom pages" description="Create custom pages for your event website." action={<Button size="sm" onClick={() => setShowForm(true)}>Add Page</Button>} />
      ) : (
        <div className="space-y-2">
          {pages.map((page) => (
            <div key={page.id} className="flex items-center justify-between rounded-lg border border-dash-border bg-dash-surface p-4">
              <div>
                <h3 className="font-semibold text-dash-text">{page.title}</h3>
                <p className="text-sm text-dash-muted">/{page.slug} · {page.is_published ? "Published" : "Draft"} · Updated {formatDate(page.updated_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Toggle checked={page.is_published} onChange={() => togglePublish(page)} label="Published" />
                <Link to={`/event/${eventId}/pages/${page.id}`}><Button size="sm" variant="secondary">Edit</Button></Link>
                <button onClick={() => deleteMutation.mutate(page.id)} className="text-xs text-dash-danger hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Page">
        <div className="space-y-4">
          <Input label="Page Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Travel & Accommodation" autoFocus />
          <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated from title" />
          <Toggle checked={showInNav} onChange={setShowInNav} label="Show in navigation" />
          {formError && <p className="text-sm text-dash-danger">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
