import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { supabase, EVENT_TYPES, EVENT_TEMPLATES, type UserEvent } from "../lib/supabase";
import { RUSTY_THEME } from "../lib/theme";
import { formatDateShort, getEventStatus } from "../lib/utils";
import {
  Button,
  Card,
  Badge,
  Modal,
  FormField,
  Input,
  Select,
  EmptyState,
  ErrorState,
  LoadingSpinner,
  Toast,
} from "../components/ui";

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form state
  const [newName, setNewName] = useState("");
  const [newEventType, setNewEventType] = useState<string>(EVENT_TYPES[0]);
  const [newTemplateId, setNewTemplateId] = useState<string>("default");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id });
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const { data: events, isLoading, error, refetch } = useQuery<UserEvent[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as UserEvent[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const template = EVENT_TEMPLATES.find((t) => t.id === newTemplateId);
      const useRusty = newTemplateId === "rusty";

      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: userData.user.id,
          name: newName,
          event_type: newEventType,
          template_id: newTemplateId,
          draft_name: newName,
          draft_event_type: newEventType,
          draft_theme: useRusty ? RUSTY_THEME : null,
          is_published: false,
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
      setNewEventType(EVENT_TYPES[0]);
      setNewTemplateId("default");
      setToast({ message: "Event created successfully", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
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
      setToast({ message: "Event deleted", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const handleCreate = () => {
    if (!newName.trim()) {
      setToast({ message: "Please enter an event name", type: "error" });
      return;
    }
    createMutation.mutate();
  };

  const handleDelete = (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this event? This cannot be undone.")) {
      deleteMutation.mutate(eventId);
    }
  };

  const statusColors: Record<string, "success" | "info" | "warning"> = {
    upcoming: "info",
    ongoing: "success",
    past: "warning",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/">
            <span
              className="text-xl font-semibold text-gray-900"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              MyWedly
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {user ? "My Events" : ""}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/auth");
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Events</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage your event websites
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load events"
            message={error instanceof Error ? error.message : "Please try again"}
            onRetry={() => refetch()}
          />
        ) : !events || events.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Calendar className="h-12 w-12" />}
              title="No events yet"
              description="Create your first event website to get started."
              action={
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4" />
                  Create Event
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const status = getEventStatus(event.draft_event_date || event.event_date);
              return (
                <Card
                  key={event.id}
                  className="flex flex-col overflow-hidden transition-shadow hover:shadow-md"
                >
                  <div className="flex-1 p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {event.draft_name || event.name || "Untitled Event"}
                      </h3>
                      <Badge variant={event.is_published ? "success" : "default"}>
                        {event.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>

                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge variant={statusColors[status] || "default"}>
                        {status}
                      </Badge>
                      {event.draft_event_type && (
                        <Badge>{event.draft_event_type}</Badge>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 text-sm text-gray-500">
                      {event.draft_event_date || event.event_date ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDateShort(event.draft_event_date || event.event_date)}
                        </span>
                      ) : null}
                      {event.draft_venue || event.venue ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.draft_venue || event.venue}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3">
                    <Link to={`/event/${event.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full">
                        Edit
                      </Button>
                    </Link>
                    {event.slug && event.is_published && (
                      <a
                        href={`/e/${event.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Event"
      >
        <div className="flex flex-col gap-4">
          <FormField label="Event Name">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Sarah & John's Wedding"
              autoFocus
            />
          </FormField>

          <FormField label="Event Type">
            <Select
              value={newEventType}
              onChange={(e) => setNewEventType(e.target.value)}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Template" hint="Choose a starting point for your design">
            <Select
              value={newTemplateId}
              onChange={(e) => setNewTemplateId(e.target.value)}
            >
              {EVENT_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.description}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !newName.trim()}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
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
