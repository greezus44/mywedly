import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge } from "../../components/ui";

export default function Pages() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);

  const { data: pages, isLoading, isError, refetch } = useQuery({
    queryKey: ["custom-pages", event.id],
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

  const checkSlugUnique = async (slugToCheck: string): Promise<boolean> => {
    const { data } = await supabase
      .from("custom_pages")
      .select("id")
      .eq("event_id", event.id)
      .eq("slug", slugToCheck)
      .maybeSingle();
    return !data;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSlug(slug)) throw new Error("Invalid slug");
      const unique = await checkSlugUnique(slug);
      if (!unique) throw new Error("Slug already exists in this event");
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: event.id,
          slug,
          title,
          body: null,
          blocks: [],
          sort_order: pages?.length ?? 0,
          is_published: false,
          show_in_nav: true,
          is_footer: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", event.id] });
      setShowModal(false);
      setTitle("");
      setSlug("");
      setSlugError(null);
      navigate(`/event/${event.id}/pages/${data.id}`);
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
      queryClient.invalidateQueries({ queryKey: ["custom-pages", event.id] });
    },
  });

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(slugify(val));
    setSlugError(null);
  };

  const handleCreate = async () => {
    if (!isValidSlug(slug)) {
      setSlugError("Invalid slug — use lowercase letters, numbers, and hyphens");
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Pages</h2>
          <p className="mt-1 text-sm text-dash-muted">Create custom pages for your website.</p>
        </div>
        <Button onClick={() => { setShowModal(true); setSlugError(null); }}>+ Create Page</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !pages || pages.length === 0 ? (
        <EmptyState
          title="No custom pages"
          description="Create pages like 'Our Story', 'Travel Guide', 'FAQ', etc."
          action={<Button onClick={() => { setShowModal(true); setSlugError(null); }}>+ Create Page</Button>}
        />
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <Card key={page.id} className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-dash-text">{page.title}</h3>
                  {page.is_published ? (
                    <Badge variant="success">Published</Badge>
                  ) : (
                    <Badge variant="warning">Draft</Badge>
                  )}
                  {page.show_in_nav && <Badge>Nav</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-dash-muted">/{page.slug}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/event/${event.id}/pages/${page.id}`)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(page.id)}
                  loading={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create Page"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={!title.trim() || !slug.trim()}
            >
              Create & Edit
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Our Story"
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => { setSlug(slugify(e.target.value)); setSlugError(null); }}
            error={slugError ?? undefined}
          />
          <p className="mt-1 text-xs text-dash-muted">Auto-generated from title. Used in the page URL.</p>
        </div>
      </Modal>
    </div>
  );
}
