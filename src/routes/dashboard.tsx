import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { LoadingSpinner, Card, Badge, EmptyState, ErrorState } from "../components/ui";
import { formatDate } from "../lib/utils";

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/login");
        return;
      }
      setUserId(data.session.user.id);
      setAuthLoading(false);
    });
  }, [navigate]);

  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ["events", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("events")
        .insert({ creator_id: userId, name, draft_name: name })
        .select()
        .maybeSingle();
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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Your Events</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Manage and edit your invitation websites.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Create Event</Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {isError && (
        <ErrorState
          message="Failed to load events."
          onRetry={() => refetch()}
        />
      )}

      {events && events.length === 0 && !isLoading && (
        <EmptyState
          title="No events yet"
          description="Create your first event to get started."
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          }
          action={<Button onClick={() => setShowCreate(true)}>Create Event</Button>}
        />
      )}

      {events && events.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card
              key={event.id}
              hover
              className="cursor-pointer"
              onClick={() => navigate(`/event/${event.id}`)}
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-lg font-semibold text-dash-text">
                  {event.draft_name || event.name}
                </h3>
                {event.is_published ? (
                  <Badge variant="success">Published</Badge>
                ) : (
                  <Badge variant="warning">Draft</Badge>
                )}
              </div>
              {event.draft_event_date && (
                <p className="text-sm text-dash-muted">{formatDate(event.draft_event_date)}</p>
              )}
              {event.draft_venue && (
                <p className="text-sm text-dash-muted">{event.draft_venue}</p>
              )}
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/event/${event.id}`);
                  }}
                >
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-dash-border bg-dash-surface p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-dash-text">Create New Event</h2>
            <Input
              label="Event name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Sarah & John's Wedding"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                loading={createMutation.isPending}
                disabled={!newName.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate(newName.trim())}
              >
                Create
              </Button>
            </div>
            {createMutation.isError && (
              <p className="mt-2 text-sm text-dash-danger">
                {createMutation.error instanceof Error
                  ? createMutation.error.message
                  : "Failed to create event."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
