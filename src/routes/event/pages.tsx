import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Modal, Card, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";
import { formatDateShort } from "../../lib/utils";

interface CustomPageDB {
  id: string;
  event_id: string;
  title: string;
  slug: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function PagesPage() {
  const { eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);

  const { data: pages, isLoading, isError, refetch } = useQuery({
    queryKey: ["custom-pages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPageDB[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const slug = slugify(newTitle);
      if (!isValidSlug(slug)) {
        throw new Error("Please enter a valid title (at least 2 characters, letters and numbers only).");
      }
      // Check slug uniqueness within this event
      const { data: existing } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", slug);
      if (existing && existing.length > 0) {
        throw new Error("A page with this slug already exists. Please use a different title.");
      }
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          title: newTitle,
          slug,
          sort_order: (pages?.length ?? 0),
          is_published: true,
          blocks: [],
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomPageDB;
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setCreateOpen(false);
      setNewTitle("");
      setSlugError(null);
      navigate(`/event/${eventId}/pages/${page.id}/builder`);
    },
    onError: (err) => {
      setSlugError(err instanceof Error ? err.message : "Failed to create page");
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

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSlugError(null);
    createMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dash-text">Custom Pages</h2>
          <p className="text-sm text-dash-muted">
            Create custom pages with a flexible block-based editor.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Create Page</Button>
      </div>

      {pages && pages.length === 0 ? (
        <EmptyState
          title="No custom pages"
          description="Create a page to add custom content like travel info, FAQ, or a story page."
          icon={<span className="text-5xl">📄</span>}
          action={<Button onClick={() => setCreateOpen(true)}>Create Page</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages?.map((page) => (
            <Card key={page.id} hover className="cursor-pointer" onClick={() => navigate(`/event/${eventId}/pages/${page.id}/builder`)}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-dash-text truncate">{page.title}</h3>
                <Badge variant={page.is_published ? "success" : "default"}>
                  {page.is_published ? "published" : "draft"}
                </Badge>
              </div>
              <p className="text-sm text-dash-muted">🔗 /{page.slug}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-dash-muted">
                  Created {formatDateShort(page.created_at)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this page? This cannot be undone.")) {
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
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Page">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Page Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Travel Info, FAQ, Our Story..."
            required
            autoFocus
          />
          {newTitle && (
            <div className="rounded-md border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-muted">
              URL: <code className="text-dash-text">/{slugify(newTitle)}</code>
            </div>
          )}
          {slugError && <p className="text-xs text-dash-danger">{slugError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
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
