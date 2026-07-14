import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { formatDate } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import {
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../components/ui";

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

async function createEvent(input: {
  name: string;
  event_type: string;
  creator_id: string;
  slug: string;
}): Promise<UserEvent> {
  const { data, error } = await supabase
    .from("user_events")
    .insert({
      name: input.name,
      event_type: input.event_type,
      creator_id: input.creator_id,
      draft_name: input.name,
      draft_event_type: input.event_type,
      draft_slug: input.slug,
      slug: input.slug,
      is_published: false,
      cover_config: {},
      login_config: {},
      theme: {},
      logo_config: {},
      content: {},
      sharing_config: {},
    })
    .select()
    .single();

  if (error) throw error;
  return data as UserEvent;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Wedding");

  const { data: events, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["user_events"],
    queryFn: fetchUserEvents,
  });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events"] });
      setShowCreate(false);
      setNewName("");
      setNewType("Wedding");
    },
  });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const slug = slugify(newName) || `event-${Date.now()}`;
    createMutation.mutate({
      name: newName,
      event_type: newType,
      creator_id: user.id,
      slug,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg p-4">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load events"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-dash-text">
              My<span className="text-dash-primary">Wedly</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/");
              }}
            >
              Sign out
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              + Create Website
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dash-text">Your Websites</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Manage your invitation websites and create new ones.
          </p>
        </div>

        {events && events.length === 0 ? (
          <EmptyState
            title="No websites yet"
            description="Create your first invitation website to get started."
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            action={
              <Button onClick={() => setShowCreate(true)}>Create Website</Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events?.map((event) => (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                className="group overflow-hidden rounded-xl border border-dash-border bg-dash-surface shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative aspect-video overflow-hidden bg-dash-bg">
                  {event.cover_image ? (
                    <img
                      src={event.cover_image}
                      alt={event.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-dash-primary/10 to-dash-primary/5">
                      <span className="text-3xl font-bold text-dash-primary/30">
                        {event.event_type?.charAt(0) ?? "W"}
                      </span>
                    </div>
                  )}
                  {event.is_published ? (
                    <div className="absolute right-2 top-2">
                      <Badge variant="success">Published</Badge>
                    </div>
                  ) : (
                    <div className="absolute right-2 top-2">
                      <Badge variant="warning">Draft</Badge>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-dash-text group-hover:text-dash-primary">
                    {event.name}
                  </h3>
                  <p className="mt-1 text-sm text-dash-muted">
                    {event.event_type}
                  </p>
                  {event.event_date && (
                    <p className="mt-2 text-xs text-dash-muted">
                      {formatDate(event.event_date)}
                    </p>
                  )}
                  {event.slug && (
                    <p className="mt-1 truncate text-xs text-dash-muted">
                      /e/{event.slug}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Website">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Website Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Sarah & John's Wedding"
            required
            autoFocus
          />
          <Select
            label="Event Type"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
          >
            <option value="Wedding">Wedding</option>
            <option value="Birthday">Birthday</option>
            <option value="Anniversary">Anniversary</option>
            <option value="Engagement">Engagement</option>
            <option value="Baby Shower">Baby Shower</option>
            <option value="Other">Other</option>
          </Select>
          <div className="rounded-lg bg-dash-bg p-3 text-xs text-dash-muted">
            Website URL: /e/{slugify(newName) || "your-event"}
          </div>
          {createMutation.isError && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create website"}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreate(false)}
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
