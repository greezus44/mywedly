import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Toggle } from "../../components/ui";
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
  const { event, eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: pages, isLoading, isError, error } = useQuery({
    queryKey: ["pages", eventId],
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
      setCreateError(null);
      if (!title.trim()) {
        setCreateError("Title is required.");
        throw new Error("Title required");
      }
      const finalSlug = slug || slugify(title);
      if (!isValidSlug(finalSlug)) {
        setCreateError("Invalid URL slug. Use lowercase letters, numbers, and hyphens.");
        throw new Error("Invalid slug");
      }
      // Check uniqueness
      const { data: existing } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", finalSlug)
        .maybeSingle();
      if (existing) {
        setCreateError("A page with this URL already exists.");
        throw new Error("Slug taken");
      }
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          title: title.trim(),
          slug: finalSlug,
          body: "",
          sort_order: (pages?.length ?? 0),
          is_published: false,
          show_in_nav: true,
          is_footer: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["pages", eventId] });
      setShowCreate(false);
      setTitle("");
      setSlug("");
      setCreateError(null);
      navigate(`/event/${eventId}/pages/${page.id}`);
    },
    onError: (err: Error) => {
      if (!createError) setCreateError(err.message);
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
      queryClient.invalidateQueries({ queryKey: ["pages", eventId] });
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ page, published }: { page: CustomPage; published: boolean }) => {
      const { error } = await supabase
        .from("custom_pages")
        .update({ is_published: published, updated_at: new Date().toISOString() })
        .eq("id", page.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", eventId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load pages" description={error instanceof Error ? error.message : undefined} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dash-text">Pages</h2>
        <Button onClick={() => setShowCreate(true)}>Add Page</Button>
      </div>

      {pages && pages.length === 0 ? (
        <EmptyState
          title="No custom pages yet"
          description="Create custom pages for your event — like travel info, FAQ, or a love story."
          action={<Button onClick={() => setShowCreate(true)}>Add Page</Button>}
        />
      ) : (
        <div className="space-y-3">
          {pages?.map((page) => (
            <Card key={page.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 cursor-pointer" onClick={() => navigate(`/event/${eventId}/pages/${page.id}`)}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-dash-text hover:text-dash-primary transition-colors">
                      {page.title}
                    </h3>
                    {page.is_published ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">Published</Badge>
                    ) : (
                      <Badge>Draft</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-dash-muted">
                    <span className="font-mono">/e/{event.slug || event.draft_slug}/p/{page.slug}</span>
                    <span>Updated {formatDate(page.updated_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle
                    checked={page.is_published}
                    onChange={(checked) => togglePublish.mutate({ page, published: checked })}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/event/${eventId}/pages/${page.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-dash-danger"
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
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Page">
        <div className="space-y-4">
          <Input
            label="Page title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slug) setSlug(slugify(e.target.value));
            }}
            placeholder="e.g. Travel & Accommodation"
            autoFocus
          />
          <Input
            label="URL slug"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="auto-generated from title"
          />
          {createError && <p className="text-sm text-dash-danger">{createError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
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
