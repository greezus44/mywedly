import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Card,
  Badge,
} from "../../components/ui";
import { formatDateShort } from "../../lib/utils";

async function fetchPages(eventId: string): Promise<CustomPage[]> {
  const { data, error } = await supabase
    .from("custom_pages")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CustomPage[];
}

export default function Pages() {
  const { eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: pages,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["custom_pages", eventId],
    queryFn: () => fetchPages(eventId),
  });

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const finalSlug = slug || slugify(title);
      if (!isValidSlug(finalSlug)) {
        setSlugError("Invalid URL. Use lowercase letters, numbers, and hyphens (2-80 chars).");
        throw new Error("Invalid slug");
      }

      // Check uniqueness within event
      const { data: existing, error: checkError } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", finalSlug)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        setSlugError("A page with this URL already exists.");
        throw new Error("Slug not unique");
      }

      setSlugError(null);

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
      queryClient.invalidateQueries({ queryKey: ["custom_pages", eventId] });
      setShowModal(false);
      setTitle("");
      setSlug("");
      setSlugError(null);
      navigate(`/event/${eventId}/pages/${page.id}`);
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
      queryClient.invalidateQueries({ queryKey: ["custom_pages", eventId] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load pages"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Pages</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Create custom pages with a block-based editor.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setTitle("");
            setSlug("");
            setSlugError(null);
            setShowModal(true);
          }}
        >
          + Add Page
        </Button>
      </div>

      {pages && pages.length === 0 ? (
        <EmptyState
          title="No pages yet"
          description="Create custom pages like 'Travel Guide', 'FAQ', or 'Photo Gallery' for your guests."
          action={
            <Button
              onClick={() => {
                setTitle("");
                setSlug("");
                setSlugError(null);
                setShowModal(true);
              }}
            >
              Add Page
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {pages?.map((page) => (
            <Card key={page.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dash-text">{page.title}</h3>
                    {page.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                    {page.show_in_nav && <Badge variant="info">In Nav</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-dash-muted">
                    /{page.slug} · Updated {formatDateShort(page.updated_at)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      navigate(`/event/${eventId}/pages/${page.id}`)
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(page.id)}
                    loading={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Page"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(slugify(e.target.value));
              setSlugError(null);
            }}
            placeholder="e.g. Travel Guide"
            required
            autoFocus
          />
          <Input
            label="URL Slug"
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugError(null);
            }}
            placeholder="travel-guide"
            error={slugError ?? undefined}
          />
          <p className="text-xs text-dash-muted">
            The URL will be: /e/{eventId}/p/{slug || "your-page"}
          </p>
          {createMutation.isError && !slugError && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create page"}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              {createMutation.isPending ? <LoadingSpinner size="sm" /> : "Create & Edit"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
