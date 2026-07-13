import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, EVENT_TYPES, EVENT_TEMPLATES, type UserEvent } from "../lib/supabase";
import { slugify, DEFAULT_THEME } from "../lib/theme";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Card, Badge, EmptyState, Modal, Skeleton, ErrorState } from "../components/ui";
import { Calendar, Plus, Copy, Archive, Trash2, MoreVertical } from "lucide-react";

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<{ name: string; event_type: string; template_id: string }>({
    name: "",
    event_type: EVENT_TYPES[0] as string,
    template_id: EVENT_TEMPLATES[0].id,
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });

  const {
    data: events,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["events"],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const slug = slugify(newEvent.name) || `event-${Date.now()}`;
      const template = EVENT_TEMPLATES.find((t) => t.id === newEvent.template_id);
      const isRusty = newEvent.template_id === "rusty";

      const insertData = {
        creator_id: user.id,
        name: newEvent.name,
        event_type: newEvent.event_type,
        template_id: newEvent.template_id,
        slug,
        draft_slug: slug,
        draft_name: newEvent.name,
        draft_event_type: newEvent.event_type,
        draft_theme: isRusty ? { ...DEFAULT_THEME, preset: "rusty" } : DEFAULT_THEME,
        draft_cover_config: null,
        draft_login_config: null,
        draft_logo_config: { enabled: false },
        draft_content: null,
        draft_sharing_config: { showShareButtons: true },
        draft_cover_image: null,
        draft_event_date: null,
        draft_event_time: null,
        draft_venue: null,
        draft_address: null,
        draft_rsvp_deadline: null,
        is_published: false,
        is_archived: false,
      };

      const { data, error } = await supabase.from("user_events").insert(insertData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowCreateModal(false);
      setNewEvent({
        name: "",
        event_type: EVENT_TYPES[0] as string,
        template_id: EVENT_TEMPLATES[0].id,
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (event: UserEvent) => {
      if (!user) throw new Error("Not authenticated");
      const slug = slugify(`${event.name}-copy`);
      const { name: _name, id: _id, created_at: _ca, updated_at: _ua, ...rest } = event;
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          ...rest,
          creator_id: user.id,
          name: `${event.name} (Copy)`,
          draft_name: `${event.draft_name ?? event.name} (Copy)`,
          slug,
          draft_slug: slug,
          is_published: false,
          is_archived: false,
          published_at: null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (event: UserEvent) => {
      const { error } = await supabase
        .from("user_events")
        .update({ is_archived: !event.is_archived })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from("user_events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  function handleCreate() {
    if (!newEvent.name.trim()) return;
    createMutation.mutate();
  }

  function getStatusBadge(event: UserEvent) {
    if (event.is_archived) return <Badge variant="default">Archived</Badge>;
    if (event.is_published) return <Badge variant="success">Published</Badge>;
    return <Badge variant="warning">Draft</Badge>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Your Events</h1>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={error instanceof Error ? error.message : "Failed to load events"} onRetry={refetch} />
        ) : !events || events.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              icon={<Calendar className="w-12 h-12" />}
              title="No events yet"
              description="Create your first event website to get started. Choose a template, customize the details, and share with your guests."
              action={
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4" />
                  Create your first event
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => (
              <Card key={event.id} className="p-5 relative group">
                <div className="flex items-start justify-between mb-4">
                  {getStatusBadge(event)}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenuId === event.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 top-9 z-20 w-44 bg-white rounded-lg border border-slate-200 shadow-lg py-1">
                          <button
                            onClick={() => {
                              duplicateMutation.mutate(event);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => {
                              archiveMutation.mutate(event);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                          >
                            <Archive className="w-4 h-4" />
                            {event.is_archived ? "Unarchive" : "Archive"}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this event? This cannot be undone.")) {
                                deleteMutation.mutate(event.id);
                              }
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Link to={`/event/${event.id}/cover`} className="block">
                  <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-1 hover:underline">
                    {event.draft_name || event.name || "Untitled Event"}
                  </h3>
                  <p className="text-sm text-slate-500 mb-3">{event.draft_event_type || event.event_type}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    {event.draft_event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {event.draft_event_date}
                      </span>
                    )}
                    {event.slug && <span className="font-mono">/{event.slug}</span>}
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Event">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Event Name</label>
            <Input
              value={newEvent.name}
              onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
              placeholder="e.g. Sarah & John's Wedding"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Event Type</label>
            <Select
              value={newEvent.event_type}
              onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Template</label>
            <div className="grid grid-cols-1 gap-3">
              {EVENT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setNewEvent({ ...newEvent, template_id: template.id })}
                  className={`text-left p-4 rounded-lg border-2 transition-colors ${
                    newEvent.template_id === template.id
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-medium text-slate-900 text-sm">{template.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {createMutation.isError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-600">
                {createMutation.error instanceof Error ? createMutation.error.message : "Failed to create event"}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={createMutation.isPending} disabled={!newEvent.name.trim()}>
              Create Event
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
