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
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUserId(session?.user?.id ?? null);
      setAuthLoading(false);
    });
    return () => { mounted = false; };
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

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate(newName.trim());
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Please sign in</h1>
        <p className="text-dash-muted">You need to be signed in to view your dashboard.</p>
        <Link to="/auth">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">My Events</h1>
          <p className="mt-1 text-sm text-dash-muted">Manage your invitation websites</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Create Event</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load events"
          message={error instanceof Error ? error.message : "An unexpected error occurred. Please try again."}
          onRetry={() => refetch()}
        />
      ) : !events || events.length === 0 ? (
        <EmptyState
          title="No events yet"
          message="Create your first invitation website to get started."
          action={
            <Button onClick={() => setShowCreate(true)}>Create Event</Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="group cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/event/${event.id}`)}>
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-dash-text">{event.name || event.draft_name || "Untitled Event"}</h3>
                  <p className="mt-0.5 text-sm text-dash-muted">{event.event_type || event.draft_event_type || "Other"}</p>
                </div>
                {event.is_published ? (
                  <Badge variant="success">Published</Badge>
                ) : (
                  <Badge variant="default">Draft</Badge>
                )}
              </div>
              {event.event_date && (
                <p className="text-sm text-dash-muted">{formatDate(event.event_date)}</p>
              )}
              {event.venue && (
                <p className="text-sm text-dash-muted">{event.venue}</p>
              )}
              {event.slug && event.is_published && (
                <p className="mt-2 text-xs text-dash-primary">/{event.slug}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Event">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Event Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. John & Jane's Wedding"
            required
            autoFocus
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Event Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:border-dash-primary focus:outline-none"
            >
              <option value="Wedding">Wedding</option>
              <option value="Birthday">Birthday</option>
              <option value="Corporate">Corporate</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {createMutation.isError && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error ? createMutation.error.message : "Failed to create event"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
