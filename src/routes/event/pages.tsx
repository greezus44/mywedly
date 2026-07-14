import { useState, type FormEvent } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Input, Badge, LoadingSpinner, ErrorState, EmptyState, Modal, Toggle } from "../../components/ui";
import { slugify } from "../../lib/theme";
import { formatDate } from "../../lib/utils";
import type { EventContextValue } from "./event-layout";

const emptyForm = {
  title: "",
  slug: "",
  body: "",
  nav_label: "",
  show_in_nav: true,
  is_published: false,
};

export function PagesPage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [builderPage, setBuilderPage] = useState<CustomPage | null>(null);
  const navigate = useNavigate();

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
      const slug = form.slug || slugify(form.title);
      if (!slug) throw new Error("Slug is required");

      // Check slug uniqueness
      const { data: existing } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", slug)
        .maybeSingle();
      if (existing && existing.id !== editingPage?.id) {
        throw new Error("A page with this slug already exists. Please choose another.");
      }

      const sortOrder = editingPage
        ? (editingPage.sort_order ?? 0)
        : (pages?.length ?? 0);
      const payload = {
        event_id: eventId,
        title: form.title,
        slug,
        body: form.body,
        nav_label: form.nav_label || null,
        show_in_nav: form.show_in_nav,
        is_published: form.is_published,
        sort_order: sortOrder,
      };
      if (editingPage) {
        const { error } = await supabase
          .from("custom_pages")
          .update(payload)
          .eq("id", editingPage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("custom_pages")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", eventId] });
      setShowForm(false);
      setEditingPage(null);
      setForm(emptyForm);
      setSlugError(null);
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

  function handleEdit(page: CustomPage) {
    setEditingPage(page);
    setForm({
      title: page.title,
      slug: page.slug,
      body: page.body,
      nav_label: page.nav_label ?? "",
      show_in_nav: page.show_in_nav,
      is_published: page.is_published,
    });
    setShowForm(true);
  }

  function handleAdd() {
    setEditingPage(null);
    setForm(emptyForm);
    setSlugError(null);
    setShowForm(true);
  }

  function handleTitleChange(title: string) {
    setForm((f) => {
      const slug = f.slug || slugify(title);
      return { ...f, title, slug };
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  if (builderPage) {
    navigate(`/event/${eventId}/pages/${builderPage.id}`);
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState message={error?.message ?? "Failed to load pages"} onRetry={refetch} />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Pages</h2>
          <p className="text-sm text-dash-muted">Create custom pages for your invitation website.</p>
        </div>
        <Button onClick={handleAdd}>Add Page</Button>
      </div>

      {!pages || pages.length === 0 ? (
        <EmptyState
          title="No custom pages"
          description="Create custom pages like 'Our Story', 'Travel Guide', or 'FAQ' for your guests."
          icon={<span className="text-4xl">📄</span>}
          action={<Button onClick={handleAdd}>Create First Page</Button>}
        />
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <Card key={page.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{page.title}</h3>
                    {page.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                    {page.show_in_nav && <Badge variant="default">In Nav</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-dash-muted">
                    /{page.slug} · Updated {formatDate(page.updated_at)}
                  </p>
                  {page.nav_label && (
                    <p className="mt-1 text-xs text-dash-muted">Nav label: {page.nav_label}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setBuilderPage(page)}>
                    Build
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(page)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete page "${page.title}"?`)) {
                        deleteMutation.mutate(page.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingPage ? "Edit Page" : "Add Page"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Page Title"
            required
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Our Story"
          />
          <Input
            label="URL Slug"
            required
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="our-story"
          />
          {slugError && <p className="text-xs text-dash-danger">{slugError}</p>}
          <Input
            label="Navigation Label"
            value={form.nav_label}
            onChange={(e) => setForm((f) => ({ ...f, nav_label: e.target.value }))}
            placeholder="Menu label (optional)"
          />
          <div className="flex items-center gap-4">
            <Toggle
              label="Show in navigation"
              checked={form.show_in_nav}
              onChange={(v) => setForm((f) => ({ ...f, show_in_nav: v }))}
            />
            <Toggle
              label="Published"
              checked={form.is_published}
              onChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Body Content</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Write page content..."
              rows={6}
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
            />
          </div>
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error?.message ?? "Failed to save"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editingPage ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PagesPage;
