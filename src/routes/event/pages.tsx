import { useState, type FormEvent } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { cn } from "../../lib/utils";
import {
  Button,
  Card,
  Modal,
  Input,
  FormField,
  Badge,
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "../../components/ui";

export default function PagesPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: pages, isLoading, isError, refetch } = useQuery({
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
      const trimmedTitle = title.trim();
      if (!trimmedTitle) throw new Error("Title is required");

      // Auto-generate slug from title
      let slug = slugify(trimmedTitle);
      if (!slug) slug = `page-${Date.now()}`;
      if (!isValidSlug(slug)) throw new Error("Invalid slug generated from title");

      // Check slug uniqueness within the same event
      const { data: existing, error: checkError } = await supabase
        .from("custom_pages")
        .select("id")
        .eq("event_id", event.id)
        .eq("slug", slug)
        .maybeSingle();
      if (checkError) throw checkError;
      if (existing) throw new Error(`A page with slug "${slug}" already exists. Please use a different title.`);

      // Insert with event_id (NOT wedding_id)
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          title: trimmedTitle,
          slug,
          event_id: event.id,
          body: "",
          is_published: true,
          sort_order: 0,
          show_in_nav: true,
          blocks: [],
          is_footer: false,
          nav_label: "",
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["custom_pages", event.id] });
      setCreateOpen(false);
      setTitle("");
      setCreateError(null);
      if (data) {
        navigate(`/event/${event.id}/pages/${data.id}`);
      }
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_pages", event.id] });
    },
  });

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!title.trim()) {
      setCreateError("Please enter a page title");
      return;
    }
    createMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (isError) {
    return <ErrorState message="Failed to load pages." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Pages</h2>
          <p className="text-sm text-dash-muted">
            Create custom pages for your website using the block editor.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Create Page</Button>
      </div>

      {(!pages || pages.length === 0) && (
        <EmptyState
          title="No custom pages yet"
          description="Create pages for your schedule, venue, FAQ, or any custom content."
          icon={<span className="text-4xl">📄</span>}
          action={<Button onClick={() => setCreateOpen(true)}>Create Page</Button>}
        />
      )}

      {pages && pages.length > 0 && (
        <div className="space-y-3">
          {pages.map((page) => (
            <Card key={page.id} className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-dash-text">{page.title}</h3>
                  {page.is_published ? (
                    <Badge variant="success">Published</Badge>
                  ) : (
                    <Badge variant="warning">Draft</Badge>
                  )}
                  {page.show_in_nav ? (
                    <Badge variant="info">In Nav</Badge>
                  ) : (
                    <Badge variant="default">Hidden</Badge>
                  )}
                  {page.is_footer && <Badge variant="default">Footer</Badge>}
                </div>
                <div className="mt-1 flex items-center gap-3 text-sm text-dash-muted">
                  <span>/{page.slug}</span>
                  {page.nav_label && <span>• Label: {page.nav_label}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/event/${event.id}/pages/${page.id}`)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm(`Delete page "${page.title}"?`)) deleteMutation.mutate(page.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Page Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Page">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField
            label="Page Title"
            error={createError ?? undefined}
            hint={`Slug will be auto-generated: ${slugify(title) || "—"}`}
          >
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Schedule, Venue, FAQ"
              autoFocus
            />
          </FormField>
          {createError && (
            <p className="rounded-lg border border-dash-danger/30 bg-dash-danger/5 px-3 py-2 text-sm text-dash-danger">
              {createError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCreateOpen(false);
                setTitle("");
                setCreateError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Page
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
