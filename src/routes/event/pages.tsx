import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Modal, Card, Badge, EmptyState, LoadingSpinner, ErrorState, Toggle } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";
import { formatDate } from "../../lib/utils";

export function PagesPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        .eq("event_id", eventId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async (pageTitle: string) => {
      const slug = slugify(pageTitle);
      // Check uniqueness within event
      const { data: existing } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", slug)
        .maybeSingle();
      if (existing) {
        throw new Error("A page with this title already exists. Please use a different title.");
      }
      const nextOrder = (pages?.length ?? 0);
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          title: pageTitle,
          slug,
          sort_order: nextOrder,
          is_published: false,
          show_in_nav: true,
          is_footer: false,
          blocks: [],
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setShowForm(false);
      setTitle("");
      setError(null);
      navigate(`/event/${eventId}/pages/${newPage.id}`);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create page");
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

  const toggleNavMutation = useMutation({
    mutationFn: async ({ pageId, showInNav }: { pageId: string; showInNav: boolean }) => {
      const { error } = await supabase
        .from("custom_pages")
        .update({ show_in_nav: showInNav })
        .eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  const handleCreate = () => {
    if (!title.trim()) return;
    setError(null);
    createMutation.mutate(title.trim());
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Custom Pages</h2>
        <Button
          onClick={() => {
            setTitle("");
            setError(null);
            setShowForm(true);
          }}
        >
          Add Page
        </Button>
      </div>

      {pages && pages.length === 0 ? (
        <EmptyState
          title="No custom pages"
          description="Create custom pages for your invitation website (e.g. Our Story, Travel Info)."
          action={
            <Button
              onClick={() => {
                setTitle("");
                setError(null);
                setShowForm(true);
              }}
            >
              Add Page
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {pages?.map((page) => (
            <Card key={page.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-dash-text">
                      {page.title}
                    </h3>
                    {page.is_published ? (
                      <Badge color="success">Published</Badge>
                    ) : (
                      <Badge color="warning">Draft</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-dash-muted">
                    /{page.slug}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <Toggle
                      checked={page.show_in_nav}
                      onChange={(v) =>
                        toggleNavMutation.mutate({
                          pageId: page.id,
                          showInNav: v,
                        })
                      }
                      label="Show in nav"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
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
                    variant="danger"
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

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setError(null);
        }}
        title="Add Page"
      >
        <div className="space-y-4">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Our Story"
            autoFocus
          />
          {title.trim() && (
            <p className="text-sm text-dash-muted">
              URL slug: /{slugify(title)}
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={!title.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
