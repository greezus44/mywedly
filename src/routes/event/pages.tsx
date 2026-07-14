import { useState, type FormEvent } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { formatDateShort } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
  IconButton,
} from "../../components/ui";

export default function Pages() {
  const { eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);

  const { data: pages, isLoading, isError } = useQuery({
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
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const finalSlug = slug || slugify(title);
      if (!isValidSlug(finalSlug)) {
        throw new Error(
          "Invalid slug. Use only lowercase letters, numbers, and hyphens."
        );
      }
      // Check uniqueness within event
      const { data: existing } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", finalSlug)
        .maybeSingle();
      if (existing) {
        throw new Error("A page with this slug already exists.");
      }
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          title,
          slug: finalSlug,
          sort_order: pages?.length ?? 0,
          is_published: false,
          show_in_nav: true,
          is_footer: false,
          blocks: [],
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
      setSlugError(err instanceof Error ? err.message : "Failed to create page");
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

  const openCreate = () => {
    setTitle("");
    setSlug("");
    setSlugError(null);
    setShowModal(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load pages" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Custom Pages</h2>
          <p className="text-sm text-muted">
            Create custom pages with a drag-and-drop block editor.
          </p>
        </div>
        <Button onClick={openCreate}>Add Page</Button>
      </div>

      {pages && pages.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card key={page.id} className="flex flex-col">
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{page.title}</h3>
                  {page.is_published ? (
                    <Badge variant="success">Published</Badge>
                  ) : (
                    <Badge variant="warning">Draft</Badge>
                  )}
                </div>
                <p className="text-xs text-muted">/{page.slug}</p>
                {page.nav_label && (
                  <p className="text-xs text-muted">Nav: {page.nav_label}</p>
                )}
                <p className="text-xs text-muted">
                  Updated: {formatDateShort(page.updated_at)}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    navigate(`/event/${eventId}/pages/${page.id}`)
                  }
                >
                  Edit Page
                </Button>
                <IconButton
                  onClick={() => deleteMutation.mutate(page.id)}
                  title="Delete"
                  className="hover:text-danger"
                >
                  🗑
                </IconButton>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No custom pages"
          description="Create custom pages like 'Our Story', 'Travel Guide', or 'Registry'."
          action={<Button onClick={openCreate}>Add Page</Button>}
        />
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create Page"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slug || slug === slugify(title)) {
                setSlug(slugify(e.target.value));
              }
              setSlugError(null);
            }}
            placeholder="e.g. Our Story"
            required
            autoFocus
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugError(null);
            }}
            placeholder="auto-generated from title"
            error={slugError ?? undefined}
          />
          <p className="text-xs text-muted">
            URL: /e/{eventId ? "..." : ""}/{slug || "page-slug"}
          </p>
          {createMutation.isError && !slugError && (
            <p className="text-sm text-danger">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create page"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create & Edit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
