import { useState, type FormEvent } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { Button, Card, LoadingSpinner, ErrorState, EmptyState, Modal, Toggle } from "../../components/ui";
import { Input } from "../../components/ui";
import { slugify } from "../../lib/theme";

interface EventContextValue { event: UserEvent; eventId: string; }

export function PagesPage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: pages, isLoading, isError, error } = useQuery({
    queryKey: ["custom-pages", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("custom_pages").select("*").eq("event_id", eventId).order("created_at", { ascending: false }); if (error) throw error; return data as CustomPage[]; },
  });

  const createPage = async (e: FormEvent) => {
    e.preventDefault(); setSubmitting(true); setFormError(null);
    try {
      const finalSlug = slug.trim() || slugify(title);
      const { data, error } = await supabase.from("custom_pages").insert({ event_id: eventId, title: title.trim(), slug: finalSlug, show_in_nav: showInNav, is_published: false, blocks: [] }).select().single();
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] }); setShowForm(false); setTitle(""); setSlug(""); setShowInNav(true);
    } catch (err) { setFormError(err instanceof Error ? err.message : "Failed to create page"); }
    finally { setSubmitting(false); }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("custom_pages").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] }),
  });

  const togglePublish = useMutation({
    mutationFn: async (page: CustomPage) => { const { error } = await supabase.from("custom_pages").update({ is_published: !page.is_published }).eq("id", page.id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load pages" message={error instanceof Error ? error.message : "Unknown error"} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-dash-text">Custom Pages</h2><Button size="sm" onClick={() => setShowForm(true)}>Add Page</Button></div>
      {!pages || pages.length === 0 ? (
        <EmptyState title="No custom pages" description="Create custom pages to share more content with your guests." action={<Button size="sm" onClick={() => setShowForm(true)}>Add Page</Button>} />
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <Card key={page.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-dash-text">{page.title}</h3>
                  <p className="text-sm text-dash-muted">/{page.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle checked={page.is_published} onChange={() => togglePublish.mutate(page)} label={page.is_published ? "Published" : "Draft"} />
                  <Link to={`/event/${eventId}/page-builder/${page.id}`}><Button size="sm" variant="secondary">Edit</Button></Link>
                  <button onClick={() => deleteMutation.mutate(page.id)} className="text-xs text-dash-danger hover:underline">Delete</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={showForm} onClose={() => { setShowForm(false); setFormError(null); }} title="Add Page">
        <form onSubmit={createPage} className="space-y-4">
          <Input label="Page Title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          <Input label="Slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated" />
          <Toggle checked={showInNav} onChange={setShowInNav} label="Show in navigation" />
          {formError && <p className="text-sm text-dash-danger">{formError}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => { setShowForm(false); setFormError(null); }}>Cancel</Button><Button type="submit" loading={submitting}>Create</Button></div>
        </form>
      </Modal>
    </div>
  );
}
