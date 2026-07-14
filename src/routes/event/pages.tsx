import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";
import { formatDate } from "../../lib/utils";

export function PagesPage() {
  const { eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
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
      return data as CustomPage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const finalSlug = slug ? slugify(slug) : slugify(title);
      if (!isValidSlug(finalSlug)) {
        throw new Error("Invalid slug. Use only lowercase letters, numbers, and hyphens.");
      }
      // Check uniqueness
      const { data: existing } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", finalSlug)
        .maybeSingle();
      if (existing) {
        throw new Error("A page with this slug already exists. Choose a different slug.");
      }
      const sortOrder = (pages?.length ?? 0);
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          title,
          slug: finalSlug,
          content: { blocks: [] },
          sort_order: sortOrder,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setShowForm(false);
      setTitle("");
      setSlug("");
      setSlugError(null);
      if (page) {
        navigate(`/event/${eventId}/pages/${page.id}`);
      }
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

  function handleSlugChange(value: string) {
    setSlug(value);
    if (value && !isValidSlug(slugify(value))) {
      setSlugError("Use only lowercase letters, numbers, and hyphens.");
    } else {
      setSlugError(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load pages." onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Pages</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Create custom pages with a drag-and-drop builder.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          Add Page
        </Button>
      </div>

      {showForm && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-dash-text">New Page</h2>
          <div className="space-y-4">
            <Input
              label="Page title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Our Story"
              autoFocus
            />
            <Input
              label="URL slug (optional)"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="auto-generated from title"
            />
            {slugError && <p className="text-sm text-dash-danger">{slugError}</p>}
            <div className="flex gap-2">
              <Button
                onClick={() => createMutation.mutate()}
                loading={createMutation.isPending}
                disabled={!title.trim() || createMutation.isPending}
              >
                Create
              </Button>
              <Button variant="secondary" onClick={() => { setShowForm(false); setTitle(""); setSlug(""); setSlugError(null); }}>
                Cancel
              </Button>
            </div>
            {createMutation.isError && (
              <p className="text-sm text-dash-danger">
                {createMutation.error instanceof Error ? createMutation.error.message : "Create failed."}
              </p>
            )}
          </div>
        </Card>
      )}

      {pages && pages.length > 0 ? (
        <div className="space-y-3">
          {pages.map((page, idx) => (
            <Card key={page.id} hover className="cursor-pointer" onClick={() => navigate(`/event/${eventId}/pages/${page.id}`)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">Page {idx + 1}</Badge>
                    <h3 className="text-base font-semibold text-dash-text">{page.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-dash-muted">/{page.slug}</p>
                  <p className="mt-1 text-xs text-dash-muted">Updated {formatDate(page.updated_at)}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/event/${eventId}/pages/${page.id}`);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${page.title}"?`)) {
                        deleteMutation.mutate(page.id);
                      }
                    }}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        !showForm && (
          <EmptyState
            title="No pages yet"
            description="Create custom pages like 'Our Story', 'Gallery', or 'Travel Info'."
            action={<Button onClick={() => setShowForm(true)}>Add Page</Button>}
          />
        )
      )}
    </div>
  );
}
