import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, FormField, Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";

export function PagesPage() {
  const { eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: pages, isLoading, isError, error } = useQuery({
    queryKey: ["custom-pages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", eventId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const slug = slugify(title);
      if (!isValidSlug(slug)) {
        throw new Error("Please enter a valid title (letters, numbers, spaces only)");
      }
      // Check uniqueness within event
      const { data: existing } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", slug)
        .maybeSingle();
      if (existing) {
        throw new Error("A page with this slug already exists. Please use a different title.");
      }
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          title,
          slug,
          sort_order: (pages?.length ?? 0),
          is_published: false,
          show_in_nav: true,
          blocks: [],
          is_footer: false,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setShowCreate(false);
      setNewTitle("");
      setCreateError(null);
      navigate(`/event/${eventId}/pages/${page.id}`);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
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
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from("custom_pages")
        .update({ is_published: published, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!newTitle.trim()) {
      setCreateError("Title is required");
      return;
    }
    createMutation.mutate(newTitle.trim());
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Failed to load pages"} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Custom Pages</h2>
          <p className="mt-1 text-sm text-dash-muted">Create and manage custom pages for your website</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Add Page</Button>
      </div>

      {pages && pages.length === 0 ? (
        <EmptyState
          title="No custom pages yet"
          description="Create custom pages like 'Our Story', 'Travel Guide', or 'FAQ' for your invitation website."
          action={<Button onClick={() => setShowCreate(true)}>Add Page</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages?.map((page) => (
            <Card key={page.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-dash-text">{page.title}</h3>
                  <p className="mt-1 text-xs text-dash-muted">/{page.slug}</p>
                  <div className="mt-2 flex gap-2">
                    {page.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                    {page.show_in_nav && <Badge>In Nav</Badge>}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => navigate(`/event/${eventId}/pages/${page.id}`)}>
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    togglePublishMutation.mutate({
                      id: page.id,
                      published: !page.is_published,
                    })
                  }
                >
                  {page.is_published ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  variant="danger"
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
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Custom Page">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Page Title" required error={createError ?? undefined}>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Our Story"
              autoFocus
            />
          </FormField>
          <p className="text-xs text-dash-muted">
            Slug will be auto-generated: /{slugify(newTitle || "page-slug")}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Page
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
