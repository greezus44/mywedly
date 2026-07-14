import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui";
import { Card, Badge, EmptyState, LoadingSpinner, ErrorState, Modal } from "../components/ui";
import { formatDate } from "../lib/utils";

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Wedding");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const { data: events, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["events", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: userId,
          name,
          draft_name: name,
          event_type: newType,
          draft_event_type: newType,
          cover_config: {} as Json,
          theme: {} as Json,
          logo_config: {} as Json,
          content: {} as Json,
          login_config: {} as Json,
          sharing_config: {} as Json,
        })
        .select()
        .single();
      if (error) throw error;
      return data as UserEvent;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["events", userId] });
      setShowCreate(false);
      setNewName("");
      navigate(`/event/${event.id}`);
    },
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate(newName.trim());
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      <header className="border-b border-dash-border bg-dash-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-dash-primary">
            MyWedly
          </Link>
          <Button onClick={() => setShowCreate(true)}>New Event</Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-dash-text">Your Events</h1>
        <p className="mt-1 text-sm text-dash-muted">
          Manage your invitation websites and track RSVPs.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : isError ? (
          <ErrorState message={error?.message ?? "Failed to load events"} onRetry={refetch} />
        ) : !events || events.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="Create your first invitation website to get started."
            icon={<span className="text-4xl">🎉</span>}
            action={<Button onClick={() => setShowCreate(true)}>Create Event</Button>}
            className="mt-8"
          />
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <Link to={`/event/${event.id}`} className="block">
                  {event.cover_image ? (
                    <div
                      className="h-32 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${event.cover_image})` }}
                    />
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center bg-dash-bg text-3xl">
                      🎊
                    </div>
                  )}
                </Link>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate text-base font-semibold text-dash-text">
                      {event.draft_name || event.name}
                    </h3>
                    {event.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-dash-muted">
                    {event.draft_event_type || event.event_type}
                  </p>
                  {event.draft_event_date && (
                    <p className="mt-2 text-xs text-dash-muted">
                      {formatDate(event.draft_event_date)}
                    </p>
                  )}
                  <Link to={`/event/${event.id}`}>
                    <Button variant="secondary" size="sm" className="mt-3 w-full">
                      Edit
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Event">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Event Name"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Our Wedding"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Event Type
            </label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
            >
              <option value="Wedding">Wedding</option>
              <option value="Engagement">Engagement</option>
              <option value="Reception">Reception</option>
              <option value="Mehndi">Mehndi</option>
              <option value="Sangeet">Sangeet</option>
              <option value="Haldi">Haldi</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {createMutation.isError && (
            <p className="text-sm text-dash-danger">
              {createMutation.error?.message ?? "Failed to create event"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DashboardPage;
