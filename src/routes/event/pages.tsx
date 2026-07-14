import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { UserEvent, CustomPage } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";
import { formatDate } from "../../lib/utils";

export function PagesPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    data: pages,
    isLoading,
    isError,
    refetch,
  } = useQuery({
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
      const title = newTitle.trim();
      if (!title) throw new Error("Please enter a page title");

      // Auto-generate slug and check uniqueness within event
      let slug = slugify(title);
      if (!isValidSlug(slug)) {
        slug = `page-${Date.now()}`;
      }

      // Check uniqueness
      const { data: existing } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", slug)
        .maybeSingle();

      if (existing) {
        slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
      }

      const maxOrder = pages ? Math.max(...pages.map((p) => p.sort_order), -1) : -1;

      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          title,
          slug,
          sort_order: maxOrder + 1,
          is_published: false,
          show_in_nav: true,
          nav_label: title,
          blocks: [],
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setCreateOpen(false);
      setNewTitle("");
      setCreateError(null);
      navigate(`/event/${eventId}/pages/${newPage.id}`);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
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

  const togglePublishMutation = useMutation({
    mutationFn: async ({ page, isPublished }: { page: CustomPage; isPublished: boolean }) => {
      const { error } = await supabase
        .from("custom_pages")
        .update({ is_published: isPublished })
        .eq("id", page.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load pages" onRetry={() => refetch()} />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Pages</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Create custom pages with a block-based editor for your website.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Add Page</Button>
      </div>

      {pages && pages.length > 0 ? (
        <div className="space-y-3">
          {pages.map((page) => (
            <Card key={page.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-dash-text">{page.title}</h3>
                    {page.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                    {page.show_in_nav && <Badge variant="default">In Nav</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-dash-muted">
                    <span className="font-mono">/{page.slug}</span>
                    {page.nav_label && <span>Nav: {page.nav_label}</span>}
                    <span>Updated {formatDate(page.updated_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/event/${eventId}/pages/${page.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      togglePublishMutation.mutate({
                        page,
                        isPublished: !page.is_published,
                      })
                    }
                    loading={togglePublishMutation.isPending}
                  >
                    {page.is_published ? "Unpublish" : "Publish"}
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
      ) : (
        <EmptyState
          title="No custom pages yet"
          description="Create custom pages like 'Our Story', 'Travel Guide', or 'Registry' using the block editor."
          action={<Button onClick={() => setCreateOpen(true)}>Add Page</Button>}
        />
      )}

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setNewTitle("");
          setCreateError(null);
        }}
        title="Create New Page"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCreateOpen(false);
                setNewTitle("");
                setCreateError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Page Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g., Our Story"
            autoFocus
          />
          {newTitle.trim() && (
            <p className="text-sm text-dash-muted">
              URL: /{slugify(newTitle) || "page"}
            </p>
          )}
          {createError && (
            <p className="text-sm text-dash-danger">{createError}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
