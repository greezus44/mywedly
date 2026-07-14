import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { formatDate } from "../../lib/utils";
import type { EventOutletContext } from "./event-layout";

export default function Pages(): React.ReactElement {
  const { eventId } = useOutletContext<EventOutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const { data: pages, isLoading, error } = useQuery({
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
      const finalSlug = slug || slugify(title);
      if (!isValidSlug(finalSlug)) {
        throw new Error("Invalid slug. Use only lowercase letters, numbers, and hyphens.");
      }
      // Check uniqueness within event
      const { data: existing, error: checkError } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", finalSlug)
        .maybeSingle();
      if (checkError) throw checkError;
      if (existing) {
        throw new Error("A page with this slug already exists. Please choose another.");
      }
      const maxOrder = pages?.length ?? 0;
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          title,
          slug: finalSlug,
          body: "",
          sort_order: maxOrder,
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
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setShowModal(false);
      setTitle("");
      setSlug("");
      setSlugError(null);
      setSlugTouched(false);
      navigate(`/event/${eventId}/pages/${page.id}`);
    },
    onError: (err: Error) => setSlugError(err.message),
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

  function handleAdd(): void {
    setTitle("");
    setSlug("");
    setSlugError(null);
    setSlugTouched(false);
    setShowModal(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Pages</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Create custom pages with a block-based editor
          </p>
        </div>
        <Button onClick={handleAdd}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Page
        </Button>
      </div>

      {pages && pages.length > 0 ? (
        <div className="space-y-2">
          {pages.map((page) => (
            <Card key={page.id} className="flex items-center justify-between gap-4 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-dash-text">{page.title}</h3>
                  {page.is_published ? (
                    <Badge variant="success">Published</Badge>
                  ) : (
                    <Badge>Draft</Badge>
                  )}
                </div>
                <p className="text-xs text-dash-muted mt-0.5">/{page.slug}</p>
                <p className="text-xs text-dash-muted mt-0.5">{formatDate(page.updated_at)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/event/${eventId}/pages/${page.id}`)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
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
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title="No custom pages"
            description="Create custom pages to add more content to your website."
            action={<Button onClick={handleAdd}>Create Page</Button>}
          />
        </Card>
      )}

      {/* Create modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Page">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Page title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) {
                setSlug(slugify(e.target.value));
              }
            }}
            placeholder="e.g. Our Story, Travel Guide, FAQ"
            required
            autoFocus
          />
          <Input
            label="Page URL slug"
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugTouched(true);
            }}
            placeholder="auto-generated from title"
            error={slugError ?? undefined}
          />
          {slug && (
            <div className="rounded-md bg-dash-bg px-3 py-2">
              <p className="text-xs text-dash-muted">URL will be:</p>
              <p className="text-sm font-medium text-dash-text">/e/{eventId}/p/{slug}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending} disabled={createMutation.isPending}>
              Create & Edit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
