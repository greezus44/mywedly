import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge, FormField } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";

export function PagesPage() {
  const { eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: pages, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["pages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");
      const finalSlug = slug || slugify(title);
      if (!isValidSlug(finalSlug)) throw new Error("Slug can only contain lowercase letters, numbers, and hyphens.");

      // Check uniqueness within this event
      const { data: existing, error: checkError } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", finalSlug)
        .maybeSingle();
      if (checkError) throw checkError;
      if (existing) throw new Error("A page with this slug already exists. Please choose a different slug.");

      const maxOrder = pages?.reduce((max, p) => Math.max(max, p.sort_order), -1) ?? -1;

      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          title: title.trim(),
          slug: finalSlug,
          body: "",
          sort_order: maxOrder + 1,
          is_published: false,
          show_in_nav: true,
          blocks: { blocks: [] },
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["pages", eventId] });
      setShowModal(false);
      setTitle("");
      setSlug("");
      setFormError(null);
      navigate(`/event/${eventId}/pages/${page.id}`);
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : "Failed to create page");
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

  const openAdd = () => {
    setTitle("");
    setSlug("");
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load pages"
        message={error instanceof Error ? error.message : "An unexpected error occurred."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Pages</h2>
          <p className="text-sm text-dash-muted">Create custom pages for your invitation site.</p>
        </div>
        <Button onClick={openAdd}>Add Page</Button>
      </div>

      {!pages || pages.length === 0 ? (
        <EmptyState
          title="No pages yet"
          description="Create custom pages like 'Our Story', 'Travel & Accommodation', or 'Gift List' for your invitation."
          action={<Button onClick={openAdd}>Add Page</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card
              key={page.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate(`/event/${eventId}/pages/${page.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-dash-text">{page.title}</h3>
                  <p className="mt-1 text-xs text-dash-primary">/{page.slug}</p>
                  <div className="mt-2 flex gap-2">
                    {page.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="default">Draft</Badge>
                    )}
                    {page.show_in_nav && <Badge variant="primary">In Nav</Badge>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(page.id);
                  }}
                  loading={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Page">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Our Story"
            required
            autoFocus
          />
          <FormField label="Slug (optional)" hint="The URL path for this page, e.g. 'our-story'.">
            <Input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="auto-generated from title"
            />
          </FormField>
          {formError && <p className="text-sm text-dash-danger">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create Page</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
