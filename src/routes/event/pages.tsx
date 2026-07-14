import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import {
  Input,
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { formatDate } from "../../lib/utils";
import type { EventOutletContext } from "./event-layout";

export default function Pages() {
  const { eventId } = useOutletContext<EventOutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);

  const { data: pages, isLoading, error, refetch } = useQuery({
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
        setSlugError("Invalid URL. Use lowercase letters, numbers, and hyphens.");
        throw new Error("Invalid slug");
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
        setSlugError("This URL is already taken. Please choose another.");
        throw new Error("Slug already taken");
      }
      setSlugError(null);
      const sortOrder = pages?.length ?? 0;
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          slug: finalSlug,
          title,
          sort_order: sortOrder,
          is_published: false,
          show_in_nav: true,
          is_footer: false,
          blocks: [],
          body: null,
          cover_image_url: null,
          inline_image_url: null,
          nav_label: null,
          icon: null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setCreateOpen(false);
      setTitle("");
      setSlug("");
      setSlugError(null);
      navigate(`/event/${eventId}/pages/${page.id}`);
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

  const handleCreate = () => {
    if (!title.trim()) return;
    createMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorState
          title="Failed to load pages"
          message={error.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-dash-text">Pages</h2>
            <p className="mt-1 text-sm text-dash-muted">
              Create custom pages for your invitation website
            </p>
          </div>
          <Button
            onClick={() => {
              setTitle("");
              setSlug("");
              setSlugError(null);
              setCreateOpen(true);
            }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Page
          </Button>
        </div>

        {pages && pages.length > 0 ? (
          <div className="space-y-3">
            {pages.map((page) => (
              <Card
                key={page.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dash-text">
                      {page.title}
                    </h3>
                    {page.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                    {page.show_in_nav && <Badge>In nav</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-dash-muted">
                    /{page.slug}
                  </p>
                  <p className="mt-1 text-xs text-dash-muted">
                    Updated {formatDate(page.updated_at)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      navigate(`/event/${eventId}/pages/${page.id}`)
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(page.id)}
                  >
                    <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.107 48.107 0 013.478-.397m7.5 0v-.916c0-1.616-1.314-2.9-2.94-2.9H10.5c-1.626 0-2.94 1.284-2.94 2.9v.916" />
                    </svg>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No custom pages yet"
            description="Create custom pages like 'Our Story', 'Travel Guide', 'FAQ', and more."
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9-9 0 00-9-9z" />
              </svg>
            }
            action={
              <Button
                onClick={() => {
                  setTitle("");
                  setSlug("");
                  setSlugError(null);
                  setCreateOpen(true);
                }}
              >
                Create First Page
              </Button>
            }
          />
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Page"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={!title.trim()}
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
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slug) setSlug(slugify(e.target.value));
              setSlugError(null);
            }}
            placeholder="e.g. Our Story, Travel Guide, FAQ"
          />
          <Input
            label="Page URL"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugError(null);
            }}
            error={slugError ?? undefined}
            placeholder="auto-generated from title"
          />
          {slug && (
            <div className="rounded-lg bg-dash-bg px-3 py-2 text-sm text-dash-muted">
              URL: /{slug}
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSlug(slugify(title))}
          >
            Auto-generate from title
          </Button>
        </div>
      </Modal>
    </div>
  );
}
