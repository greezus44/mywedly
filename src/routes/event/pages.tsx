import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { Button, Card, Modal, Input, Textarea, EmptyState, LoadingSpinner, Badge, Toggle } from "../../components/ui";
import { truncate } from "../../lib/utils";
import { slugify } from "../../lib/theme";

export function PagesPage() {
  const { eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "" });
  const [slugManual, setSlugManual] = useState(false);

  const { data: pages, isLoading } = useQuery({
    queryKey: ["custom-pages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", eventId)
        .order("title", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomPage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .insert({
          event_id: eventId,
          title: form.title.trim(),
          slug: form.slug.trim() || slugify(form.title.trim()),
          content: {},
          blocks: [],
          is_published: false,
          show_in_nav: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] });
      setShowModal(false);
      navigate(`/event/${eventId}/pages/${page.id}`);
    },
  });

  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from("custom_pages").update({ is_published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] }),
  });

  const toggleNavMutation = useMutation({
    mutationFn: async ({ id, show_in_nav }: { id: string; show_in_nav: boolean }) => {
      const { error } = await supabase.from("custom_pages").update({ show_in_nav }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-pages", eventId] }),
  });

  function handleTitleChange(title: string) {
    setForm((f) => ({ ...f, title }));
    if (!slugManual) setForm((f) => ({ ...f, title, slug: slugify(title) }));
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Custom Pages</h2>
        <Button size="sm" onClick={() => setShowModal(true)}>New page</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : !pages || pages.length === 0 ? (
        <EmptyState
          title="No custom pages yet"
          description="Add pages for travel info, registry, your story, and more."
          action={<Button size="sm" onClick={() => setShowModal(true)}>Create first page</Button>}
        />
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <Card key={page.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dash-text">{page.title}</h3>
                    <Badge variant={page.is_published ? "success" : "default"}>
                      {page.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-xs text-dash-muted mt-0.5">/p/{page.slug}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <Toggle
                      checked={page.is_published}
                      onChange={(v) => togglePublishedMutation.mutate({ id: page.id, is_published: v })}
                      label="Published"
                    />
                    <Toggle
                      checked={page.show_in_nav}
                      onChange={(v) => toggleNavMutation.mutate({ id: page.id, show_in_nav: v })}
                      label="Show in nav"
                    />
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/event/${eventId}/pages/${page.id}`)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(page.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Page">
        <div className="space-y-4">
          <Input
            label="Page Title"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Our Story"
            autoFocus
          />
          <Input
            label="URL Slug"
            value={form.slug}
            onChange={(e) => { setSlugManual(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
            placeholder="e.g. our-story"
          />
          <p className="text-xs text-dash-muted">/e/[event-url]/p/{form.slug || "page-slug"}</p>
          {createMutation.isError && (
            <p className="text-sm text-red-500">{(createMutation.error as Error)?.message}</p>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              loading={createMutation.isPending}
              disabled={!form.title.trim()}
              onClick={() => createMutation.mutate()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
