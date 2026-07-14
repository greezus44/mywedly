import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, Modal, Badge, Toggle, EmptyState, LoadingSpinner, ErrorState } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";

export function PagesPage() {
  const { eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);

  const { data: pages, isLoading, isError, refetch } = useQuery({
    queryKey: ["custom-pages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", eventId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomPage[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const finalSlug = slug || slugify(title);
      if (!isValidSlug(finalSlug)) {
        throw new Error("Invalid URL slug. Use only lowercase letters, numbers, and hyphens.");
      }
      // Check uniqueness within event
      const { data: existing } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", finalSlug)
        .maybeSingle();
      if (existing) throw new Error("A page with this slug already exists.");

      const maxOrder = pages?.length ?? 0;
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          title,
          slug: finalSlug,
          body: null,
          cover_image_url: null,
          inline_image_url: null,
          sort_order: maxOrder,
          is_published: false,
          nav_label: title,
          icon: null,
          show_in_nav: true,
          blocks: [],
          is_footer: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setShowForm(false);
      setTitle("");
      setSlug("");
      setSlugError(null);
      // Navigate to the page builder route
      navigate(`/event/${eventId}/pages/${data.id}`);
    },
    onError: (err: Error) => {
      setSlugError(err.message);
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

  const togglePublishedMutation = useMutation({
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load custom pages." onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Pages</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Create custom pages for your invitation website (e.g. Travel Info, FAQ, Registry).
          </p>
        </div>
        <Button
          onClick={() => {
            setTitle("");
            setSlug("");
            setSlugError(null);
            setShowForm(true);
          }}
        >
          Add Page
        </Button>
      </div>

      {pages && pages.length === 0 ? (
        <EmptyState
          title="No custom pages yet"
          description="Create custom pages to add more content to your invitation website."
          icon={<div className="text-4xl">📄</div>}
          action={<Button onClick={() => setShowForm(true)}>Create First Page</Button>}
        />
      ) : (
        <div className="space-y-3">
          {pages?.map((page) => (
            <Card key={page.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dash-text">{page.title}</h3>
                    {page.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-dash-muted">/e/{page.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Toggle
                    checked={page.is_published}
                    onChange={(v) =>
                      togglePublishedMutation.mutate({ id: page.id, published: v })
                    }
                  />
                  <Button
                    size="sm"
                    onClick={() => navigate(`/event/${eventId}/pages/${page.id}`)}
                  >
                    Edit
                  </Button>
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

      {/* Create Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Custom Page">
        <div className="space-y-4">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(slugify(e.target.value));
              setSlugError(null);
            }}
            placeholder="e.g. Travel Information"
          />
          <Input
            label="URL Slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value.toLowerCase());
              setSlugError(null);
            }}
            placeholder="travel-info"
            error={slugError ?? undefined}
          />
          {slug && (
            <p className="text-xs text-dash-muted">
              URL: /e/{eventSlugPreview(eventId)}/{slug}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!title.trim()}
            >
              Create & Edit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function eventSlugPreview(_eventId: string): string {
  return "your-event";
}
