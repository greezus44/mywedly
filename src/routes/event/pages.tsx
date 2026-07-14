import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge, FormField, Toggle } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";
import { formatDate } from "../../lib/utils";

export const PagesPage: React.FC = () => {
  const { eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [showInNav, setShowInNav] = useState(true);

  const { data: pages, isLoading, isError, refetch } = useQuery({
    queryKey: ["custom-pages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomPage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const finalSlug = slugify(title);
      // Check uniqueness within event
      const { data: existing } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", finalSlug)
        .maybeSingle();
      if (existing) {
        throw new Error("A page with this slug already exists. Please choose a different title.");
      }
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          title: title.trim(),
          slug: finalSlug,
          nav_label: title.trim(),
          show_in_nav: showInNav,
          sort_order: (pages?.length ?? 0),
          is_published: false,
          blocks: [],
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setModalOpen(false);
      setTitle("");
      setSlug("");
      setSlugError(null);
      setShowInNav(true);
      navigate(`/event/${eventId}/pages/${page.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase
        .from("custom_pages")
        .delete()
        .eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(slugify(value));
    setSlugError(null);
  };

  const handleCreate = () => {
    if (!title.trim()) {
      setSlugError("Title is required");
      return;
    }
    if (slug && !isValidSlug(slug)) {
      setSlugError("Invalid slug");
      return;
    }
    createMutation.mutate();
  };

  if (isLoading) {
    return <LoadingSpinner size="md" label="Loading pages..." />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Pages</h2>
          <p className="text-sm text-dash-muted">Create custom pages for your invitation website.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Add Page</Button>
      </div>

      {(!pages || pages.length === 0) && (
        <EmptyState
          title="No custom pages"
          description="Create custom pages like 'Our Story', 'Travel Guide', or 'Registry'."
          action={<Button onClick={() => setModalOpen(true)}>Add Page</Button>}
        />
      )}

      {pages && pages.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card key={page.id} hover className="flex flex-col">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-dash-text">{page.title}</h3>
                  {page.is_published ? (
                    <Badge variant="success">Published</Badge>
                  ) : (
                    <Badge variant="default">Draft</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-dash-muted">/{page.slug}</p>
                {page.show_in_nav && (
                  <Badge variant="primary" className="mt-2">In Nav</Badge>
                )}
                <p className="mt-2 text-xs text-dash-muted">
                  Created {formatDate(page.created_at)}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Page"
      >
        <div className="space-y-4">
          <FormField label="Page title" required>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Our Story"
              autoFocus
            />
          </FormField>
          <FormField label="URL slug">
            <Input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="our-story"
            />
          </FormField>
          {slugError && <p className="text-sm text-dash-danger">{slugError}</p>}
          <div className="flex items-center justify-between rounded-md border border-dash-border bg-dash-bg px-3 py-2">
            <div>
              <p className="text-sm font-medium text-dash-text">Show in Navigation</p>
              <p className="text-xs text-dash-muted">Display this page in the guest navigation menu</p>
            </div>
            <Toggle checked={showInNav} onChange={setShowInNav} />
          </div>
          {createMutation.isError && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error ? createMutation.error.message : "Failed to create page"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={createMutation.isPending || !title.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
