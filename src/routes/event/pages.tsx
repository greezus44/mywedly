import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import {
  Modal,
  Input,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Card,
  Badge,
} from "../../components/ui";
import { formatDate } from "../../lib/utils";

export default function PagesPage() {
  const { eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);

  const {
    data: pages,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
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
      if (!title.trim()) throw new Error("Page title is required.");
      const finalSlug = slug || slugify(title);
      if (!isValidSlug(finalSlug)) {
        throw new Error("Invalid URL slug. Use lowercase letters, numbers, and hyphens.");
      }
      // Check slug uniqueness within this event
      const { data: existing, error: checkErr } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", finalSlug)
        .maybeSingle();
      if (checkErr) throw checkErr;
      if (existing) throw new Error("A page with this slug already exists.");

      const maxSort = pages?.reduce((max, p) => Math.max(max, p.sort_order), -1) ?? -1;
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          wedding_id: eventId,
          slug: finalSlug,
          title: title.trim(),
          body: "",
          cover_image_url: null,
          inline_image_url: null,
          sort_order: maxSort + 1,
          is_published: false,
          nav_label: title.trim(),
          icon: null,
          show_in_nav: true,
          blocks: [],
          is_footer: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setShowCreate(false);
      setTitle("");
      setSlug("");
      setSlugError(null);
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error?.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Pages</h1>
          <p className="text-sm text-dash-muted">
            Create and manage custom pages for your website.
          </p>
        </div>
        <Button
          onClick={() => {
            setSlugError(null);
            setTitle("");
            setSlug("");
            setShowCreate(true);
          }}
        >
          + Create Page
        </Button>
      </div>

      {!pages || pages.length === 0 ? (
        <EmptyState
          title="No custom pages"
          description="Create custom pages like 'Our Story', 'Travel Guide', or 'FAQ' for your website."
          icon={<span className="text-4xl">📄</span>}
          action={
            <Button
              onClick={() => {
                setSlugError(null);
                setTitle("");
                setSlug("");
                setShowCreate(true);
              }}
            >
              + Create Page
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card key={page.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-dash-text">{page.title}</h3>
                {page.is_published ? (
                  <Badge variant="success">Published</Badge>
                ) : (
                  <Badge variant="warning">Draft</Badge>
                )}
              </div>
              <p className="text-xs text-dash-muted">/e/{page.slug}</p>
              {page.show_in_nav && <Badge variant="info">In Nav</Badge>}
              <p className="text-xs text-dash-muted">Updated {formatDate(page.updated_at)}</p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
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
      )}

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Custom Page"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              loading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
              disabled={!title.trim()}
            >
              Create & Edit
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slug) setSlug(slugify(e.target.value));
            }}
            placeholder="e.g. Our Story"
            autoFocus
          />
          <Input
            label="URL Slug"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="our-story"
            error={slugError ?? undefined}
          />
          {slug && (
            <p className="text-xs text-dash-muted">
              URL: <span className="font-mono">/e/{slug}</span>
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
