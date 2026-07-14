import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, EmptyState, LoadingSpinner, ErrorState, Modal, Badge, Toggle } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";

interface PageForm {
  title: string;
  slug: string;
  is_published: boolean;
}

export function PagesPage() {
  const { eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CustomPage | null>(null);
  const [form, setForm] = useState<PageForm>({ title: "", slug: "", is_published: false });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: pages, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["pages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Title is required.");
      const slug = form.slug || slugify(form.title);
      if (!isValidSlug(slug)) throw new Error("Slug must contain only lowercase letters, numbers, and hyphens.");

      // Check slug uniqueness within this event
      const { data: existing, error: checkError } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", slug)
        .maybeSingle();
      if (checkError) throw checkError;
      if (existing && existing.id !== editing?.id) {
        throw new Error("A page with this slug already exists. Please choose a different slug.");
      }

      if (editing) {
        const { error } = await supabase
          .from("custom_pages")
          .update({ title: form.title, slug, is_published: form.is_published })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const sortOrder = (pages?.length ?? 0);
        const { error } = await supabase
          .from("custom_pages")
          .insert({
            event_id: eventId,
            title: form.title,
            slug,
            content: { blocks: [] } as Json,
            sort_order: sortOrder,
            is_published: form.is_published,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", eventId] });
      setShowModal(false);
      setEditing(null);
      setFormError(null);
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : "Failed to save page.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_pages")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", eventId] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", slug: "", is_published: false });
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (page: CustomPage) => {
    setEditing(page);
    setForm({ title: page.title, slug: page.slug, is_published: page.is_published });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load pages"
        message={error instanceof Error ? error.message : "An error occurred."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Pages</h2>
          <p className="text-sm text-dash-muted">Create custom pages for your event site.</p>
        </div>
        <Button onClick={openCreate}>Add Page</Button>
      </div>

      {!pages || pages.length === 0 ? (
        <EmptyState
          title="No pages yet"
          message="Create custom pages like 'Our Story', 'Travel Info', or 'Registry'."
          action={<Button onClick={openCreate}>Add Page</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card key={page.id} className="cursor-pointer" onClick={() => navigate(`/event/${eventId}/pages/${page.id}`)}>
              <div className="flex items-start justify-between" onClick={(e) => e.stopPropagation()}>
                <div className="flex-1">
                  <h3 className="font-semibold text-dash-text">{page.title}</h3>
                  <p className="text-xs text-dash-muted">/{page.slug}</p>
                  <div className="mt-2">
                    {page.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="default">Draft</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(page)}
                    className="rounded-md p-1.5 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text"
                    title="Edit settings"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(page.id)}
                    className="rounded-md p-1.5 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-danger"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/event/${eventId}/pages/${page.id}`)}
                >
                  Edit Content
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Page Settings" : "Add Page"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Our Story"
            required
            autoFocus
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="our-story"
          />
          <p className="-mt-2 text-xs text-dash-muted">Leave blank to auto-generate from title.</p>
          <Toggle
            checked={form.is_published}
            onChange={(is_published) => setForm((f) => ({ ...f, is_published }))}
            label="Published"
          />
          {formError && <p className="text-sm text-dash-danger">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editing ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
