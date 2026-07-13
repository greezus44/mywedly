import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, EVENT_TYPES, EVENT_TEMPLATES } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { formatDateShort } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Card, Badge, EmptyState, Skeleton, ErrorState, Modal, FormField } from "../components/ui";
import { Plus, Copy, Archive, Trash2, Calendar, AlertCircle } from "lucide-react";

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>(EVENT_TYPES[0]);
  const [newTemplate, setNewTemplate] = useState<string>(EVENT_TEMPLATES[0].id);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });

  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey: ["events"],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
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
      const slug = slugify(newName) || `event-${Date.now()}`;
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: user.id,
          name: newName,
          event_type: newType,
          template_id: newTemplate,
          slug,
          draft_name: newName,
          draft_event_type: newType,
          draft_event_date: null,
          draft_event_time: null,
          draft_venue: null,
          draft_address: null,
          draft_cover_image: null,
          draft_cover_config: null,
          draft_login_config: null,
          draft_theme: null,
          draft_logo_config: null,
          draft_content: null,
          draft_sharing_config: null,
          draft_slug: slug,
          draft_rsvp_deadline: null,
          is_published: false,
          is_archived: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowCreate(false);
      setNewName("");
      setNewType(EVENT_TYPES[0]);
      setNewTemplate(EVENT_TEMPLATES[0].id);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (event: UserEvent) => {
      if (!user) throw new Error("Not authenticated");
      const slug = slugify(`${event.name}-copy`) || `event-${Date.now()}`;
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: user.id,
          name: `${event.name} (Copy)`,
          event_type: event.event_type,
          template_id: event.template_id,
          slug,
          draft_name: `${event.draft_name || event.name} (Copy)`,
          draft_event_type: event.draft_event_type || event.event_type,
          draft_event_date: event.draft_event_date,
          draft_event_time: event.draft_event_time,
          draft_venue: event.draft_venue,
          draft_address: event.draft_address,
          draft_cover_image: event.draft_cover_image,
          draft_cover_config: event.draft_cover_config,
          draft_login_config: event.draft_login_config,
          draft_theme: event.draft_theme,
          draft_logo_config: event.draft_logo_config,
          draft_content: event.draft_content,
          draft_sharing_config: event.draft_sharing_config,
          draft_slug: slug,
          draft_rsvp_deadline: event.draft_rsvp_deadline,
          is_published: false,
          is_archived: false,
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
      const { error } = await supabase
        .from("user_events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate();
  };

  const activeEvents = events?.filter((e) => !e.is_archived) ?? [];
  const archivedEvents = events?.filter((e) => e.is_archived) ?? [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Your Events</h1>
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-5 w-2/3 mb-3" />
                <Skeleton className="h-4 w-1/3 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <ErrorState message="Failed to load events" onRetry={() => refetch()} />
        ) : activeEvents.length === 0 && archivedEvents.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-12 h-12" />}
            title="No events yet"
            description="Create your first event to get started."
            action={
              <Button onClick={() => setShowCreate(true)} size="md">
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
            }
          />
        ) : (
          <>
            {activeEvents.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-slate-500 mb-4">Active</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onDuplicate={() => duplicateMutation.mutate(event)}
                      onArchive={() => archiveMutation.mutate(event)}
                      onDelete={() => deleteMutation.mutate(event.id)}
                      duplicating={duplicateMutation.isPending}
                      archiving={archiveMutation.isPending}
                      deleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              </section>
            )}

            {archivedEvents.length > 0 && (
              <section className="mt-10">
                <h2 className="text-sm font-medium text-slate-500 mb-4">Archived</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {archivedEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onDuplicate={() => duplicateMutation.mutate(event)}
                      onArchive={() => archiveMutation.mutate(event)}
                      onDelete={() => deleteMutation.mutate(event.id)}
                      duplicating={duplicateMutation.isPending}
                      archiving={archiveMutation.isPending}
                      deleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Event">
        <div className="space-y-4">
          <FormField label="Event Name">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="My Wedding"
              autoFocus
            />
          </FormField>
          <FormField label="Event Type">
            <Select value={newType} onChange={(e) => setNewType(e.target.value)}>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Template">
            <Select value={newTemplate} onChange={(e) => setNewTemplate(e.target.value)}>
              {EVENT_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-slate-500">
              {EVENT_TEMPLATES.find((t) => t.id === newTemplate)?.description}
            </p>
          </FormField>

          {createMutation.isError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">
                {createMutation.error instanceof Error ? createMutation.error.message : "Failed to create event"}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={createMutation.isPending} disabled={!newName.trim()}>
              Create Event
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function EventCard({
  event,
  onDuplicate,
  onArchive,
  onDelete,
  duplicating,
  archiving,
  deleting,
}: {
  event: UserEvent;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  duplicating: boolean;
  archiving: boolean;
  deleting: boolean;
}) {
  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <Link
          to={`/event/${event.id}/cover`}
          className="text-base font-semibold hover:underline truncate"
        >
          {event.draft_name || event.name}
        </Link>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {event.is_published ? (
            <Badge variant="success">Published</Badge>
          ) : (
            <Badge variant="default">Draft</Badge>
          )}
          {event.is_archived && <Badge variant="warning">Archived</Badge>}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
        <Badge variant="info">{event.draft_event_type || event.event_type}</Badge>
        {event.draft_event_date && (
          <span className="truncate">{formatDateShort(event.draft_event_date)}</span>
        )}
      </div>

      {event.draft_venue && (
        <p className="text-sm text-slate-500 truncate">{event.draft_venue}</p>
      )}

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onDuplicate} loading={duplicating}>
          <Copy className="w-3.5 h-3.5" />
          Duplicate
        </Button>
        <Button variant="ghost" size="sm" onClick={onArchive} loading={archiving}>
          <Archive className="w-3.5 h-3.5" />
          {event.is_archived ? "Unarchive" : "Archive"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} loading={deleting} className="text-red-600 hover:bg-red-50">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}
