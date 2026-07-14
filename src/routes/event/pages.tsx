import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import {
  Input,
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
  Toggle,
} from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";
import { formatDate } from "../../lib/utils";

async function fetchPages(eventId: string): Promise<CustomPage[]> {
  const { data, error } = await supabase
    .from("custom_pages")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CustomPage[];
}

async function createPage(
  eventId: string,
  title: string,
  slug: string
): Promise<CustomPage> {
  const { data, error } = await supabase
    .from("custom_pages")
    .insert({
      event_id: eventId,
      title,
      slug,
      body: "",
      sort_order: 0,
      is_published: true,
      show_in_nav: true,
      blocks: [],
      is_footer: false,
    })
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Failed to create page");
  return data as CustomPage;
}

async function deletePage(id: string): Promise<void> {
  const { error } = await supabase.from("custom_pages").delete().eq("id", id);
  if (error) throw error;
}

async function updatePageNav(
  id: string,
  showInNav: boolean
): Promise<void> {
  const { error } = await supabase
    .from("custom_pages")
    .update({ show_in_nav: showInNav })
    .eq("id", id);
  if (error) throw error;
}

export function PagesPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);

  const { data: pages, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["custom-pages", eventId],
    queryFn: () => fetchPages(eventId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      setSlugError(null);
      const finalSlug = slug || slugify(title);
      if (!finalSlug) {
        setSlugError("Slug is required");
        throw new Error("Slug required");
      }
      if (!isValidSlug(finalSlug)) {
        setSlugError("Slug must contain only lowercase letters, numbers, and hyphens");
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
        setSlugError("A page with this slug already exists");
        throw new Error("Slug already taken");
      }
      return createPage(eventId, title.trim(), finalSlug);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setShowModal(false);
      setTitle("");
      setSlug("");
      setSlugError(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  const toggleNavMutation = useMutation({
    mutationFn: ({ id, showInNav }: { id: string; showInNav: boolean }) =>
      updatePageNav(id, showInNav),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Pages</h2>
          <p className="text-sm text-dash-muted">
            Create custom pages with a block-based editor
          </p>
        </div>
        <Button onClick={openCreate}>Add page</Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      )}

      {isError && (
        <ErrorState
          title="Failed to load pages"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      )}

      {pages && pages.length === 0 && (
        <EmptyState
          title="No custom pages"
          description="Create custom pages like 'Our Story', 'Travel Guide', or 'Registry' to add to your website."
          action={<Button onClick={openCreate}>Add page</Button>}
        />
      )}

      {pages && pages.length > 0 && (
        <div className="space-y-3">
          {pages.map((page) => (
            <Card key={page.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-dash-text">{page.title}</h3>
                    {page.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="default">Draft</Badge>
                    )}
                  </div>
                  <p className="text-sm text-dash-muted">
                    /{page.slug}
                    {page.nav_label && ` • Nav: "${page.nav_label}"`}
                  </p>
                  <p className="text-xs text-dash-muted mt-1">
                    Updated {formatDate(page.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Toggle
                    checked={page.show_in_nav}
                    onChange={(checked) =>
                      toggleNavMutation.mutate({ id: page.id, showInNav: checked })
                    }
                    label="Nav"
                  />
                  <Link to={`/event/${eventId}/pages/${page.id}`}>
                    <Button variant="secondary" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete "${page.title}"?`)) {
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

      {/* Create modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Custom Page"
      >
        <div className="space-y-4">
          <Input
            label="Page title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slug || slug === slugify(title)) {
                setSlug(slugify(e.target.value));
              }
            }}
            placeholder="e.g. Our Story, Travel Guide"
            required
            autoFocus
          />
          <Input
            label="URL slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="auto-generated-from-title"
            error={slugError ?? undefined}
          />
          {createMutation.isError && !slugError && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error ? createMutation.error.message : "Create failed"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!title.trim()}
            >
              Create page
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
