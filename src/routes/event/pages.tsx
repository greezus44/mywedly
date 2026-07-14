import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Card,
  Modal,
  Badge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from "../../components/ui";

export function PagesPage() {
  const { event, eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: pages,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["custom-pages", eventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (queryError) throw queryError;
      return data as CustomPage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const finalSlug = slug || slugify(title);
      if (!isValidSlug(finalSlug)) throw new Error("Invalid URL slug");

      // Check uniqueness within event
      const existing = pages?.find((p) => p.slug === finalSlug);
      if (existing) throw new Error("A page with this slug already exists");

      const { data, error: createError } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          title,
          slug: finalSlug,
          nav_label: title,
          sort_order: pages?.length ?? 0,
          is_published: false,
          show_in_nav: true,
          blocks: [],
        })
        .select()
        .single();
      if (createError) throw createError;
      return data as CustomPage;
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setShowForm(false);
      setTitle("");
      setSlug("");
      setFormError(null);
      navigate(`/event/${eventId}/pages/${page.id}`);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase
        .from("custom_pages")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async (page: CustomPage) => {
      const { error: updateError } = await supabase
        .from("custom_pages")
        .update({ is_published: !page.is_published, updated_at: new Date().toISOString() })
        .eq("id", page.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  const handleTitleChange = (t: string) => {
    setTitle(t);
    if (!slug) setSlug(slugify(t));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError("Title is required");
      return;
    }
    createMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Failed to load"} onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dash-text">Custom Pages</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Create custom pages for your invitation website (e.g., Our Story, Venue, Travel).
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add Page</Button>
      </div>

      {!pages || pages.length === 0 ? (
        <EmptyState
          title="No custom pages"
          description="Create custom pages to add more content to your invitation website."
          icon={<span className="text-4xl">📄</span>}
          action={<Button onClick={() => setShowForm(true)}>Add Page</Button>}
        />
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <Card key={page.id} hover>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{page.title}</h3>
                    {page.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="default">Draft</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-dash-muted">/e/{event.slug || "..."}/p/{page.slug}</p>
                  {page.nav_label && (
                    <p className="mt-1 text-xs text-dash-muted">Nav label: {page.nav_label}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/event/${eventId}/pages/${page.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={togglePublishMutation.isPending}
                    onClick={() => togglePublishMutation.mutate(page)}
                  >
                    {page.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm("Delete this page?")) {
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

      {/* Create page modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Page">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Page Title"
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Our Story"
            required
          />
          <Input
            label="URL Slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="our-story"
          />
          {slug && (
            <p className="text-xs text-dash-muted">Preview: /e/{event.slug || "..."}/p/{slug}</p>
          )}
          {formError && (
            <p className="rounded-md bg-dash-danger/10 px-3 py-2 text-sm text-dash-danger">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
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
