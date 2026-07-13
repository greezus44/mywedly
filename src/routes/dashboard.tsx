import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, Trash2, Users, ExternalLink, Loader2 } from "lucide-react";
import { supabase, type UserEvent, EVENT_TYPES, EVENT_TEMPLATES } from "../lib/supabase";
import { RUSTY_THEME } from "../lib/theme";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Card, Badge, EmptyState, FormField, Modal, useToast } from "../components/ui";
import { formatDate, getEventStatus } from "../lib/utils";

const statusVariants: Record<string, "success" | "warning" | "default" | "info"> = {
  upcoming: "info",
  ongoing: "success",
  completed: "default",
  unscheduled: "warning",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>(EVENT_TYPES[0]);
  const [newTemplate, setNewTemplate] = useState<string>(EVENT_TEMPLATES[0].id);

  const { data: events, isLoading, error } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", userData.user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const slug = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const isRusty = newTemplate === "rusty";
      const insert = {
        creator_id: userData.user!.id,
        name: newName,
        event_type: newType,
        template_id: newTemplate,
        slug,
        draft_slug: slug,
        draft_name: newName,
        draft_event_type: newType,
        draft_theme: isRusty ? RUSTY_THEME : null,
        draft_cover_config: isRusty
          ? { bgColor: "#F5ECD7", textColor: "#3D3528", buttonColor: "#B8962E", buttonText: "Enter", customText: "Together with their families", showDate: true, showCountdown: false }
          : null,
        draft_login_config: isRusty
          ? { bgColor: "#FAF3E0", textColor: "#3D3528", buttonColor: "#B8962E", buttonText: "Continue", heading: "Welcome", subheading: "Please enter your name to continue", inputPlaceholder: "Your full name" }
          : null,
      };
      const { data, error } = await supabase.from("user_events").insert(insert).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast("Event created", "success");
      setCreateOpen(false);
      setNewName("");
      setNewType(EVENT_TYPES[0]);
      setNewTemplate(EVENT_TEMPLATES[0].id);
      navigate(`/event/${event.id}/cover`);
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast("Event deleted", "success");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-lg font-semibold text-gray-900">
            Eventify
          </Link>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New event
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Your events</h1>
        <p className="mt-1 text-sm text-gray-500">Create and manage your event invitations.</p>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <Card className="p-6">
            <p className="text-sm text-red-600">Failed to load events: {(error as Error).message}</p>
          </Card>
        ) : !events || events.length === 0 ? (
          <Card className="mt-6">
            <EmptyState
              icon={Calendar}
              title="No events yet"
              description="Create your first event to get started."
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create event
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const status = getEventStatus(event.draft_event_date ?? event.event_date);
              return (
                <Card key={event.id} className="flex flex-col p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        to={`/event/${event.id}/cover`}
                        className="font-semibold text-gray-900 hover:underline"
                      >
                        {event.draft_name || event.name || "Untitled event"}
                      </Link>
                      <p className="mt-0.5 text-xs text-gray-500">{event.draft_event_type || event.event_type}</p>
                    </div>
                    <Badge variant={event.is_published ? "success" : "warning"}>
                      {event.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-col gap-1 text-sm text-gray-600">
                    {event.draft_event_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(event.draft_event_date)}
                      </div>
                    )}
                    {event.draft_venue && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        {event.draft_venue}
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <Badge variant={statusVariants[status]}>{status}</Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                    <Link to={`/event/${event.id}/cover`} className="flex-1">
                      <Button size="sm" variant="secondary" className="w-full">
                        Edit
                      </Button>
                    </Link>
                    {event.slug && (
                      <a href={`/e/${event.slug}`} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Delete this event? This cannot be undone.")) {
                          deleteMutation.mutate(event.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create new event">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <FormField label="Event name" required>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="My amazing event"
              required
            />
          </FormField>
          <FormField label="Event type" required>
            <Select value={newType} onChange={(e) => setNewType(e.target.value)}>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Template">
            <Select value={newTemplate} onChange={(e) => setNewTemplate(e.target.value)}>
              {EVENT_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.description}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
