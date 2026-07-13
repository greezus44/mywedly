import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, Copy, Archive, Trash2, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Card, Badge, EmptyState, ErrorState, Skeleton, Modal, FormField } from "../components/ui";
import { supabase, type UserEvent, EVENT_TYPES, EVENT_TEMPLATES } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { formatDateShort } from "../lib/utils";

interface CreateEventData {
  name: string;
  event_type: string;
  template_id: string;
}

function StatusBadges({ event }: { event: UserEvent }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {event.is_published ? (
        <Badge variant="success">Published</Badge>
      ) : (
        <Badge variant="default">Draft</Badge>
      )}
      {event.is_archived && <Badge variant="warning">Archived</Badge>}
      {!event.is_archived && !event.is_published && <Badge variant="info">Unpublished</Badge>}
    </div>
  );
}

function EventCard({ event, onDuplicate, onArchive, onDelete }: {
  event: UserEvent;
  onDuplicate: (event: UserEvent) => void;
  onArchive: (event: UserEvent) => void;
  onDelete: (event: UserEvent) => void;
}) {
  return (
    <Card className="p-5 flex flex-col hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900 truncate">
            {event.draft_name || event.name}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">{event.draft_event_type || event.event_type}</p>
        </div>
        <StatusBadges event={event} />
      </div>

      <div className="space-y-1.5 text-sm text-slate-600 flex-1">
        {event.draft_event_date && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{formatDateShort(event.draft_event_date)}</span>
          </div>
        )}
        {event.draft_venue && (
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 text-slate-400 text-xs">📍</span>
            <span className="truncate">{event.draft_venue}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <Link to={`/event/${event.id}/cover`}>
          <Button variant="ghost" size="sm" className="group">
            Edit
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicate(event)}
            title="Duplicate"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onArchive(event)}
            title={event.is_archived ? "Unarchive" : "Archive"}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(event)}
            title="Delete"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

function CreateEventModal({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: CreateEventData) => void;
}) {
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState<string>(EVENT_TYPES[0]);
  const [templateId, setTemplateId] = useState<string>(EVENT_TEMPLATES[0].id);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onCreate({ name: name.trim(), event_type: eventType, template_id: templateId });
      setName("");
      setEventType(EVENT_TYPES[0]);
      setTemplateId(EVENT_TEMPLATES[0].id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create new event">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Event name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Amazing Event"
            required
            autoFocus
          />
        </FormField>
        <FormField label="Event type">
          <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Template" hint="Choose a starting point for your event design">
          <div className="space-y-2">
            {EVENT_TEMPLATES.map((template) => (
              <label
                key={template.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  templateId === template.id
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={template.id}
                  checked={templateId === template.id}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-900">{template.name}</span>
                    {template.id === "rusty" && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
                </div>
              </label>
            ))}
          </div>
        </FormField>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting} disabled={!name.trim()}>
            Create event
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) throw new Error("Not authenticated");
      return user;
    },
  });

  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey: ["events"],
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
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateEventData) => {
      if (!user) throw new Error("Not authenticated");
      const slug = slugify(data.name);
      const { data: result, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: user.id,
          name: data.name,
          draft_name: data.name,
          event_type: data.event_type,
          draft_event_type: data.event_type,
          template_id: data.template_id,
          slug,
          draft_slug: slug,
          is_published: false,
          is_archived: false,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowCreate(false);
      showToast("Event created successfully");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to create event", "error");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (event: UserEvent) => {
      if (!user) throw new Error("Not authenticated");
      const copyName = `${event.draft_name || event.name} (Copy)`;
      const slug = slugify(copyName);
      const { error } = await supabase.from("user_events").insert({
        creator_id: user.id,
        name: copyName,
        draft_name: copyName,
        event_type: event.draft_event_type || event.event_type,
        draft_event_type: event.draft_event_type || event.event_type,
        template_id: event.template_id,
        slug,
        draft_slug: slug,
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
        is_published: false,
        is_archived: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      showToast("Event duplicated");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to duplicate event", "error");
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
      showToast("Event updated");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to update event", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (event: UserEvent) => {
      const { error } = await supabase.from("user_events").delete().eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      showToast("Event deleted");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to delete event", "error");
    },
  });

  const handleDelete = (event: UserEvent) => {
    if (window.confirm(`Delete "${event.draft_name || event.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(event);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">Eventful</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your Events</h1>
            <p className="mt-1 text-sm text-slate-600">Create and manage your event websites</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/3 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <Skeleton className="h-8 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            message={error instanceof Error ? error.message : "Failed to load events"}
            onRetry={() => refetch()}
          />
        ) : !events || events.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={<Calendar className="w-12 h-12" />}
              title="No events yet"
              description="Create your first event website to get started. It only takes a minute."
              action={
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4" />
                  Create your first event
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onDuplicate={(e) => duplicateMutation.mutate(e)}
                onArchive={(e) => archiveMutation.mutate(e)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <CreateEventModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={(data) => createMutation.mutate(data)}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}>
            {toast.type === "error" && <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
