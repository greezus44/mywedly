import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import {
  Card,
  Modal,
  EmptyState,
  LoadingSpinner,
  ErrorState,
  Badge,
} from "../../components/ui";
import { formatDate } from "../../lib/utils";

export default function PagesPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);

  const { data: pages, isLoading, isError, error } = useQuery({
    queryKey: ["custom-pages", eventId],
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

  const createMutation = useMutation({
    mutationFn: async () => {
      const finalSlug = slug || slugify(title);
      if (!isValidSlug(finalSlug)) {
        throw new Error("Invalid URL slug. Use only lowercase letters, numbers, and hyphens.");
      }
      const { data: existing } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", finalSlug)
        .maybeSingle();
      if (existing) {
        throw new Error("A page with this slug already exists. Please choose another.");
      }

      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          slug: finalSlug,
          title,
          body: "",
          sort_order: (pages?.length ?? 0),
          is_published: false,
          show_in_nav: true,
          nav_label: title,
          blocks: [],
          is_footer: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setShowModal(false);
      setTitle("");
      setSlug("");
      setSlugError(null);
      navigate(`/event/${eventId}/pages/${page.id}`);
    },
    onError: (err) => {
      setSlugError(err instanceof Error ? err.message : "Failed to create page.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  function openCreate() {
    setTitle("");
    setSlug("");
    setSlugError(null);
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20">
        <ErrorState message={error?.message} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Pages</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Create custom pages for {event.name} with a drag-and-drop block editor.
          </p>
        </div>
        <Button onClick={openCreate}>Create Page</Button>
      </div>

      {pages && pages.length === 0 ? (
        <EmptyState
          title="No custom pages"
          description="Create custom pages like 'Our Story', 'Travel Info', or 'FAQ' to add to your event website."
          action={<Button onClick={openCreate}>Create Page</Button>}
        />
      ) : (
        <div className="space-y-3">
          {pages?.map((page) => (
            <Card key={page.id} className="flex items-center justify-between p-4">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-base font-semibold text-dash-text">{page.title}</h3>
                  {page.is_published ? (
                    <Badge variant="success">Published</Badge>
                  ) : (
                    <Badge variant="warning">Draft</Badge>
                  )}
                  {page.show_in_nav && <Badge variant="info">In nav</Badge>}
                </div>
                <p className="text-xs text-dash-muted">
                  /{page.slug} · Updated {formatDate(page.updated_at)}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => navigate(`/event/${eventId}/pages/${page.id}`)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(page.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Page">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(slugify(e.target.value));
              setSlugError(null);
            }}
            placeholder="e.g. Our Story, Travel Info, FAQ"
            required
            autoFocus
          />
          <div>
            <Input
              label="URL Slug"
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugError(null);
              }}
              placeholder="auto-generated from title"
              error={slugError ?? undefined}
            />
            <p className="mt-1 text-xs text-dash-muted">
              The URL will be: /e/{event.slug ?? "your-event"}/{slug || "page-slug"}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
