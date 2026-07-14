import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
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
import { slugify } from "../../lib/theme";
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

export function PagesPage() {
  const { eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pages, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["custom-pages", eventId],
    queryFn: () => fetchPages(eventId),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");
      const slug = slugify(title);
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

      const maxSort = pages?.reduce((max, p) => Math.max(max, p.sort_order), 0) ?? 0;

      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          title: title.trim(),
          slug,
          sort_order: maxSort + 1,
          is_published: false,
          show_in_nav: true,
          is_footer: false,
          blocks: [] as unknown as Json,
        })
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setShowCreate(false);
      setTitle("");
      setCreateError(null);
      // Navigate to the page builder for editing
      if (newPage) {
        navigate(`/event/${eventId}/pages/${newPage.id}`);
      }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load pages"}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Custom Pages</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Create additional pages for your website (e.g. Travel, FAQ, Registry)
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Add Page</Button>
      </div>

      {!pages || pages.length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">📄</span>}
          title="No custom pages yet"
          description="Add pages like Travel Info, FAQ, or Gift Registry to provide more details to your guests."
          action={<Button onClick={() => setShowCreate(true)}>Add Page</Button>}
        />
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <Card key={page.id} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-dash-text">{page.title}</h3>
                  {page.is_published ? (
                    <Badge color="success">Published</Badge>
                  ) : (
                    <Badge color="warning">Draft</Badge>
                  )}
                  {page.show_in_nav && <Badge color="default">In Nav</Badge>}
                  {page.is_footer && <Badge color="default">Footer</Badge>}
                </div>
                <p className="mt-1 text-sm text-dash-muted">
                  /{page.slug} · Updated {formatDateShort(page.updated_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
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

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Page">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <Input
              label="Page Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Travel & Accommodation"
              required
            />
            <p className="mt-1 text-sm text-dash-muted">
              Slug: {slugify(title) || "page-slug"}
            </p>
          </div>
          {createError && <p className="text-sm text-dash-danger">{createError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending} disabled={!title.trim()}>
              Create & Edit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
