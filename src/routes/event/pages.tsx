import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useOutletContext } from "./event-layout";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import {
  Card,
  Modal,
  Input,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";

export default function Pages() {
  const { event, eventId } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);

  const {
    data: pages,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["custom_pages", eventId],
    enabled: !!eventId,
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
      const generatedSlug = slugify(slug || title);
      if (!isValidSlug(generatedSlug)) {
        throw new Error(
          "Invalid slug. Use only lowercase letters, numbers, and hyphens (2-80 chars)."
        );
      }

      // Check uniqueness within event
      const { data: existing } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", generatedSlug)
        .maybeSingle();
      if (existing) {
        throw new Error("A page with this slug already exists. Please choose a different slug.");
      }

      const maxOrder = pages?.reduce((max, p) => Math.max(max, p.sort_order), 0) ?? 0;

      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          wedding_id: eventId,
          slug: generatedSlug,
          title: title,
          body: "",
          sort_order: maxOrder + 1,
          is_published: false,
          show_in_nav: true,
          nav_label: title,
          blocks: [],
          is_footer: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["custom_pages", eventId] });
      setShowModal(false);
      setTitle("");
      setSlug("");
      setSlugError(null);
      navigate(`/event/${eventId}/pages/${page.id}`);
    },
    onError: (err) => {
      setSlugError(err instanceof Error ? err.message : "Failed to create page");
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
      queryClient.invalidateQueries({ queryKey: ["custom_pages", eventId] });
    },
  });

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug || slug === slugify(title)) {
      setSlug(slugify(value));
    }
    setSlugError(null);
  };

  const handleAdd = () => {
    setTitle("");
    setSlug("");
    setSlugError(null);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    createMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Failed to load pages" />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Custom Pages</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Create custom pages with a block-based editor
          </p>
        </div>
        <Button onClick={handleAdd}>Add Page</Button>
      </div>

      {!pages || pages.length === 0 ? (
        <EmptyState
          title="No custom pages"
          description="Create custom pages like 'Our Story', 'Travel Info', or 'Registry'."
          icon={<span className="text-4xl">📄</span>}
          action={<Button onClick={handleAdd}>Add Page</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {pages.map((page) => (
            <Card key={page.id} className="flex items-center justify-between p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-dash-text">
                    {page.title}
                  </h3>
                  {page.is_published ? (
                    <Badge variant="success">Published</Badge>
                  ) : (
                    <Badge variant="warning">Draft</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-dash-muted">/e/{event.slug ?? event.draft_slug}/{page.slug}</p>
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
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(page.id)}
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
        title="Create Custom Page"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Our Story"
            autoFocus
          />
          <Input
            label="URL Slug"
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugError(null);
            }}
            placeholder="our-story"
            error={slugError ?? undefined}
          />
          <p className="text-sm text-dash-muted">
            The slug is auto-generated from the title. You can customize it.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
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
