import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { Button } from "../components/ui/Button";
import {
  Input,
  Card,
  Badge,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from "../components/ui";
import { formatDate } from "../lib/utils";

async function fetchUserEvents(): Promise<UserEvent[]> {
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

async function createEvent(name: string): Promise<UserEvent> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const slug = slugify(name) || `event-${Date.now()}`;

  const { data, error } = await supabase
    .from("user_events")
    .insert({
      name,
      draft_name: name,
      creator_id: user.id,
      draft_slug: slug,
      slug,
    })
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Failed to create event");
  return data as UserEvent;
}

async function signOut() {
  await supabase.auth.signOut();
}

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: events, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["user-events"],
    queryFn: fetchUserEvents,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createEvent(name),
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      setShowCreate(false);
      setNewName("");
      setCreateError(null);
      navigate(`/event/${newEvent.id}`);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      navigate("/");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate(newName.trim());
  };

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="border-b border-dash-border bg-dash-surface">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <span className="text-xl font-bold text-dash-text">
              My<span className="text-dash-primary">Wedly</span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOutMutation.mutate()}
            loading={signOutMutation.isPending}
          >
            Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">
              Your Invitation Websites
            </h1>
            <p className="mt-1 text-sm text-dash-muted">
              Manage and edit your invitation websites
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>Create Website</Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        )}

        {isError && (
          <ErrorState
            title="Failed to load websites"
            description={error instanceof Error ? error.message : undefined}
            onRetry={() => refetch()}
          />
        )}

        {events && events.length === 0 && (
          <EmptyState
            title="No websites yet"
            description="Create your first invitation website to get started."
            action={<Button onClick={() => setShowCreate(true)}>Create Website</Button>}
          />
        )}

        {events && events.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="aspect-video bg-dash-bg relative overflow-hidden">
                    {event.cover_image ? (
                      <img
                        src={event.cover_image}
                        alt={event.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-3xl font-bold text-dash-muted/40">
                          {event.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {event.is_published && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="success">Published</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-dash-text truncate">
                      {event.name}
                    </h3>
                    {event.event_date && (
                      <p className="mt-1 text-sm text-dash-muted">
                        {formatDate(event.event_date)}
                      </p>
                    )}
                    {event.venue && (
                      <p className="mt-1 text-sm text-dash-muted truncate">
                        {event.venue}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setCreateError(null);
        }}
        title="Create New Website"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Website name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Sarah & John's Wedding"
            required
            autoFocus
          />
          {createError && (
            <p className="text-sm text-dash-danger">{createError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreate(false);
                setCreateError(null);
              }}
            >
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
