import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Loader2,
  LayoutGrid,
} from "lucide-react";
import { supabase, type UserEvent, EVENT_TYPES, EVENT_TEMPLATES } from "../lib/supabase";
import { RUSTY_THEME } from "../lib/theme";
import { formatDateShort, getEventStatus } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import {
  Card,
  Badge,
  EmptyState,
  Skeleton,
  ErrorState,
  Modal,
  FormField,
  Toast,
  type ToastType,
} from "../components/ui";
import { SiteHeader } from "../components/site/SiteHeader";

async function fetchEvents(): Promise<UserEvent[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_events")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserEvent[];
}

async function createEvent(input: {
  name: string;
  event_type: string;
  template_id: string;
  creator_id: string;
}): Promise<UserEvent> {
  const isRusty = input.template_id === "rusty";
  const { data, error } = await supabase
    .from("user_events")
    .insert({
      name: input.name,
      event_type: input.event_type,
      template_id: input.template_id,
      creator_id: input.creator_id,
      draft_name: input.name,
      draft_event_type: input.event_type,
      draft_theme: isRusty ? RUSTY_THEME : null,
      draft_slug: null,
      is_published: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as UserEvent;
}

async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("user_events").delete().eq("id", id);
  if (error) throw error;
}

const STATUS_BADGE: Record<string, { variant: "success" | "info" | "warning" | "default"; label: string }> = {
  upcoming: { variant: "info", label: "Upcoming" },
  today: { variant: "success", label: "Today" },
  past: { variant: "default", label: "Past" },
  "no-date": { variant: "warning", label: "No date" },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>(EVENT_TYPES[0]);
  const [newTemplate, setNewTemplate] = useState(EVENT_TEMPLATES[0].id);

  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setToast({ message: "Event created!", type: "success" });
      setShowCreate(false);
      setNewName("");
      setNewType(EVENT_TYPES[0]);
      setNewTemplate(EVENT_TEMPLATES[0].id);
      navigate(`/event/${event.id}`);
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setToast({ message: "Event deleted", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  // We need the user id for creation — fetch it once.
  const { data: userId } = useQuery({
    queryKey: ["current-user-id"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user?.id ?? null;
    },
  });

  const handleCreateWithUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !userId) return;
    createMutation.mutate({
      name: newName.trim(),
      event_type: newType,
      template_id: newTemplate,
      creator_id: userId,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader
        navLinks={[
          { label: "Features", to: "/#features" },
          { label: "Pricing", to: "/#pricing" },
        ]}
      >
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </SiteHeader>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-gray-900">
            Your Events
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Create and manage your event websites.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            message={error instanceof Error ? error.message : "Failed to load events"}
            onRetry={() => refetch()}
          />
        ) : !events || events.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid className="h-12 w-12" />}
            title="No events yet"
            description="Create your first event website to get started."
            action={
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> Create Event
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const status = getEventStatus(
                event.draft_event_date ?? event.event_date,
              );
              const badge = STATUS_BADGE[status];
              return (
                <Card key={event.id} className="group flex flex-col p-5">
                  <div className="flex items-start justify-between">
                    <Link to={`/event/${event.id}`} className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-gray-700">
                        {event.draft_name ?? event.name}
                      </h3>
                    </Link>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>

                  <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                    <p className="capitalize">{event.draft_event_type ?? event.event_type}</p>
                    {(event.draft_event_date ?? event.event_date) && (
                      <p className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatDateShort(event.draft_event_date ?? event.event_date)}
                      </p>
                    )}
                    {(event.draft_venue ?? event.venue) && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {event.draft_venue ?? event.venue}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <Link to={`/event/${event.id}`}>
                      <Button size="sm" variant="secondary">
                        Edit
                      </Button>
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm("Delete this event? This cannot be undone.")) {
                          deleteMutation.mutate(event.id);
                        }
                      }}
                      className="text-gray-400 transition-colors hover:text-red-600"
                      aria-label="Delete event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {event.is_published && (
                    <div className="mt-2">
                      <Badge variant="success">Published</Badge>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)}>
        <div className="p-6">
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Create New Event
          </h2>
          <form onSubmit={handleCreateWithUser} className="mt-4 space-y-4">
            <FormField label="Event name">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Sarah & John's Wedding"
                required
                autoFocus
              />
            </FormField>
            <FormField label="Event type">
              <Select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Template">
              <Select
                value={newTemplate}
                onChange={(e) => setNewTemplate(e.target.value)}
              >
                {EVENT_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.description}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </form>
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
