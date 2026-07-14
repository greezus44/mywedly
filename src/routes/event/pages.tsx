import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge, Toggle } from "../../components/ui";
import { formatDate } from "../../lib/utils";

export function PagesPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [navLabel, setNavLabel] = useState("");
  const [showInNav, setShowInNav] = useState(true);
  const [isFooter, setIsFooter] = useState(false);

  const { data: pages, isLoading, isError } = useQuery({
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
      if (!isValidSlug(slug)) {
        setSlugError("Slug can only contain lowercase letters, numbers, and hyphens.");
        throw new Error("Invalid slug");
      }

      // Check uniqueness within event
      const { data: existing } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", eventId)
        .eq("slug", slug)
        .maybeSingle();
      if (existing) {
        setSlugError("A page with this slug already exists.");
        throw new Error("Slug not unique");
      }
      setSlugError(null);

      const maxSort = pages ? Math.max(...pages.map((p) => p.sort_order), 0) : 0;
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          title: title.trim(),
          slug,
          body: "",
          sort_order: maxSort + 1,
          is_published: false,
          nav_label: navLabel.trim() || null,
          show_in_nav: showInNav,
          is_footer: isFooter,
          blocks: [],
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setShowCreate(false);
      setTitle("");
      setSlug("");
      setNavLabel("");
      setShowInNav(true);
      setIsFooter(false);
      setSlugError(null);
      // Navigate to page builder
      navigate(`/event/${eventId}/pages/${newPage.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase.from("custom_pages").delete().eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20">
        <ErrorState message="Failed to load pages" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Pages</h2>
          <p className="text-sm text-dash-muted mt-1">
            Create custom pages with a flexible block editor.
          </p>
        </div>
        <Button
          onClick={() => {
            setTitle("");
            setSlug("");
            setNavLabel("");
            setShowInNav(true);
            setIsFooter(false);
            setSlugError(null);
            setShowCreate(true);
          }}
        >
          Create Page
        </Button>
      </div>

      {pages && pages.length > 0 ? (
        <div className="space-y-3">
          {pages.map((page) => (
            <Card key={page.id} className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-dash-text">{page.title}</h3>
                  {page.is_published ? (
                    <Badge variant="success">Published</Badge>
                  ) : (
                    <Badge variant="warning">Draft</Badge>
                  )}
                  {page.show_in_nav && <Badge variant="primary">Nav</Badge>}
                  {page.is_footer && <Badge>Footer</Badge>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dash-muted">
                  <span>/p/{page.slug}</span>
                  {page.nav_label && <span>Label: {page.nav_label}</span>}
                  <span>Updated: {formatDate(page.updated_at?.slice(0, 10))}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/event/${eventId}/pages/${page.id}`)}
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
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No custom pages"
            description="Create custom pages like Our Story, Travel Info, or FAQ."
            icon={<span className="text-4xl">📄</span>}
            action={<Button onClick={() => setShowCreate(true)}>Create Page</Button>}
          />
        </Card>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Page">
        <div className="space-y-4">
          <Input
            label="Page Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(slugify(e.target.value));
              setSlugError(null);
            }}
            placeholder="e.g. Our Story"
            autoFocus
          />
          <Input
            label="URL Slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugError(null);
            }}
            placeholder="our-story"
          />
          {slugError && <p className="text-xs text-dash-danger">{slugError}</p>}
          <Input
            label="Navigation Label (optional)"
            value={navLabel}
            onChange={(e) => setNavLabel(e.target.value)}
            placeholder="e.g. Story (defaults to title)"
          />
          <div className="flex items-center gap-6">
            <Toggle
              checked={showInNav}
              onChange={setShowInNav}
              label="Show in navigation"
            />
            <Toggle
              checked={isFooter}
              onChange={setIsFooter}
              label="Footer page"
            />
          </div>
          {createMutation.isError && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create page"}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!title.trim() || !slug.trim()}
            >
              Create & Edit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
