import React from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState, LoadingSpinner, ErrorState } from "../../components/ui";
import { slugify } from "../../lib/theme";

export default function Pages() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<CustomPage | null>(null);

  const { data: pages, isLoading, error, refetch } = useQuery({
    queryKey: ["custom_pages", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          title: newTitle,
          slug: slugify(newTitle),
          event_id: event.id,
          wedding_id: event.id,
          body: "",
          sort_order: pages?.length ?? 0,
          is_published: false,
          show_in_nav: true,
          nav_label: newTitle,
          blocks: [],
          is_footer: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["custom_pages", event.id] });
      setShowCreate(false);
      setNewTitle("");
      navigate(`/event/${event.id}/page-builder/${data.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_pages", event.id] });
      setDeleteTarget(null);
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner className="h-8 w-8" /></div>;
  if (error) return <ErrorState message="Failed to load pages." onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Custom Pages</h2>
        <Button onClick={() => setShowCreate(true)}>+ Create Page</Button>
      </div>

      {!pages || pages.length === 0 ? (
        <EmptyState
          title="No custom pages yet"
          description="Create custom pages to add additional content like FAQ, Travel Info, or Registry."
          action={<Button onClick={() => setShowCreate(true)}>+ Create Page</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pages.map((page) => (
            <Card key={page.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-dash-text">{page.title}</h3>
                  <p className="text-xs text-dash-muted font-mono mt-0.5">/{page.slug}</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {page.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="default">Draft</Badge>
                    )}
                    {page.show_in_nav && <Badge variant="info">In Nav</Badge>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/event/${event.id}/page-builder/${page.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => setDeleteTarget(page)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Page">
        <div className="space-y-4">
          <Input
            label="Page Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g., Travel & Accommodation"
            autoFocus
          />
          <p className="text-xs text-dash-muted">
            URL slug: <span className="font-mono">/{newTitle ? slugify(newTitle) : "page-url"}</span>
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              loading={createMutation.isPending}
              disabled={!newTitle.trim()}
              onClick={() => createMutation.mutate()}
            >
              Create & Edit
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Page">
        <div className="space-y-4">
          <p className="text-sm text-dash-text">
            Are you sure you want to delete <span className="font-semibold">{deleteTarget?.title}</span>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
