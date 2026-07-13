import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Eye,
  Trash2,
  CalendarDays,
  LayoutGrid,
  Loader2,
  CalendarClock,
} from "lucide-react";
import { supabase, type UserEvent, EVENT_TYPES, EVENT_TEMPLATES } from "../lib/supabase";
import { RUSTY_THEME } from "../lib/theme";
import { cn, formatDate } from "../lib/utils";
import { Button } from "../components/ui/Button";
import {
  Card,
  Badge,
  EmptyState,
  FormField,
  Skeleton,
  Toast,
  Modal,
} from "../components/ui";
import { Input, Select } from "../components/ui/Input";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";

const TEMPLATE_LABELS: Record<string, string> = Object.fromEntries(
  EVENT_TEMPLATES.map((t) => [t.id, t.name])
);

const EVENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  EVENT_TYPES.map((t) => [t, t])
);

async function fetchUserEvents(userId: string): Promise<UserEvent[]> {
  const { data, error } = await supabase
    .from("user_events")
    .select("*")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as UserEvent[]) ?? [];
}

interface CreateEventInput {
  creator_id: string;
  name: string;
  event_type: string;
  template_id: string;
  theme?: typeof RUSTY_THEME;
}

async function createEvent(input: CreateEventInput): Promise<UserEvent> {
  const { data, error } = await supabase
    .from("user_events")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as UserEvent;
}

async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from("user_events")
    .delete()
    .eq("id", eventId);
  if (error) throw error;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>(EVENT_TYPES[0]);
  const [newTemplate, setNewTemplate] = useState<string>(EVENT_TEMPLATES[0].id);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Current session
  const { data: session } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    staleTime: 60_000,
  });

  const userId = session?.user?.id ?? null;

  const {
    data: events,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user-events", userId],
    queryFn: () => fetchUserEvents(userId!),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      setModalOpen(false);
      setNewName("");
      setNewType(EVENT_TYPES[0]);
      setNewTemplate(EVENT_TEMPLATES[0].id);
      setToast({ message: "Event created.", type: "success" });
      navigate(`/event/${event.id}/cover`);
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to create event.";
      setToast({ message, type: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      setPendingDeleteId(null);
      setToast({ message: "Event deleted.", type: "success" });
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to delete event.";
      setToast({ message, type: "error" });
    },
  });

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setToast({ message: "Please sign in first.", type: "error" });
      return;
    }
    if (!newName.trim()) {
      setToast({ message: "Event name is required.", type: "error" });
      return;
    }
    const payload: CreateEventInput = {
      creator_id: userId,
      name: newName.trim(),
      event_type: newType,
      template_id: newTemplate,
    };
    if (newTemplate === "rusty") {
      payload.theme = RUSTY_THEME;
    }
    createMutation.mutate(payload);
  };

  const handleDelete = (eventId: string) => {
    deleteMutation.mutate(eventId);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-8 border-b border-onyx/10">
            <div>
              <span className="text-xs uppercase tracking-widest text-onyx/40">
                Your Collection
              </span>
              <h1 className="mt-3 font-heading text-4xl lg:text-5xl text-onyx leading-tight">
                Dashboard
              </h1>
              <p className="mt-2 text-sm text-onyx/50">
                {events && events.length > 0
                  ? `${events.length} ${events.length === 1 ? "event" : "events"} in your collection`
                  : "Compose and curate your celebrations."}
              </p>
            </div>
            <Button
              onClick={() => setModalOpen(true)}
              size="lg"
            >
              <Plus className="w-4 h-4" /> Create New Event
            </Button>
          </div>

          {/* Content */}
          <div className="mt-10">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border border-onyx/10 bg-white">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <EmptyState
                icon={<LayoutGrid className="w-12 h-12" strokeWidth={1.25} />}
                title="Could not load events"
                description="There was a problem fetching your collection. Please try again."
                action={
                  <Button
                    variant="secondary"
                    onClick={() =>
                      queryClient.invalidateQueries({ queryKey: ["user-events"] })
                    }
                  >
                    Retry
                  </Button>
                }
              />
            ) : !events || events.length === 0 ? (
              <EmptyState
                icon={<CalendarClock className="w-12 h-12" strokeWidth={1.25} />}
                title="No events yet"
                description="Your collection is empty. Create your first event to begin composing your story."
                action={
                  <Button onClick={() => setModalOpen(true)}>
                    <Plus className="w-4 h-4" /> Create New Event
                  </Button>
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Card key={event.id} className="flex flex-col group">
                    {/* Cover image or onyx placeholder */}
                    <div className="aspect-[4/3] overflow-hidden bg-onyx relative">
                      {event.cover_image ? (
                        <img
                          src={event.cover_image}
                          alt={event.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-heading text-cream/30 text-5xl tracking-tight">
                            {event.name?.charAt(0)?.toUpperCase() || "•"}
                          </span>
                        </div>
                      )}
                      {event.is_published && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="success">Published</Badge>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge>{EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}</Badge>
                        <Badge variant="info">
                          {TEMPLATE_LABELS[event.template_id] ?? event.template_id}
                        </Badge>
                      </div>
                      <h3 className="font-heading text-2xl text-onyx leading-tight">
                        {event.name}
                      </h3>
                      {event.event_date && (
                        <p className="mt-2 flex items-center gap-2 text-sm text-onyx/50">
                          <CalendarDays className="w-4 h-4" />
                          {formatDate(event.event_date)}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="mt-6 pt-4 border-t border-onyx/10 flex items-center gap-2 mt-auto">
                        <Link to={`/event/${event.id}/cover`} className="flex-1">
                          <Button variant="primary" size="sm" className="w-full">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </Button>
                        </Link>
                        <Link
                          to={event.slug ? `/${event.slug}` : `/${event.id}`}
                          className="flex-1"
                        >
                          <Button variant="secondary" size="sm" className="w-full">
                            <Eye className="w-3.5 h-3.5" /> View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingDeleteId(event.id)}
                          className="px-2.5"
                          aria-label="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />

      {/* Create event modal */}
      <Modal
        open={modalOpen}
        onClose={() => !createMutation.isPending && setModalOpen(false)}
        title="Create New Event"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <FormField label="Event Name" hint="Give your celebration a title.">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Sarah & James"
              autoFocus
              required
            />
          </FormField>

          <FormField label="Event Type">
            <Select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Template"
            hint="Rusty's Template applies a cream & gold luxury aesthetic."
          >
            <Select
              value={newTemplate}
              onChange={(e) => setNewTemplate(e.target.value)}
            >
              {EVENT_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} — {template.description}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Create Event
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!pendingDeleteId}
        onClose={() => !deleteMutation.isPending && setPendingDeleteId(null)}
        title="Delete Event"
      >
        <p className="text-sm text-onyx/60 leading-relaxed">
          Are you sure you want to delete this event? This action cannot be
          undone, and all associated guest data, RSVPs, and messages will be
          permanently removed.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setPendingDeleteId(null)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => pendingDeleteId && handleDelete(pendingDeleteId)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" /> Delete
              </>
            )}
          </Button>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
