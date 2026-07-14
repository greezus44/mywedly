import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input, Textarea, Select } from "../components/ui/Input";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../components/ui";
import { formatDate, cn } from "../lib/utils";
import { slugify, isValidSlug } from "../lib/theme";

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

async function createEvent(
  payload: {
    name: string;
    event_type: string;
    draft_slug: string;
  },
): Promise<UserEvent> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const slug = slugify(payload.draft_slug || payload.name);
  const { data, error } = await supabase
    .from("user_events")
    .insert({
      creator_id: user.id,
      name: payload.name,
      draft_name: payload.name,
      event_type: payload.event_type,
      draft_event_type: payload.event_type,
      draft_slug: slug,
      is_published: false,
      is_archived: false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as UserEvent;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Wedding");
  const [newSlug, setNewSlug] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: events, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["user-events"],
    queryFn: fetchUserEvents,
  });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      setShowCreate(false);
      setNewName("");
      setNewSlug("");
      setCreateError(null);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!newName.trim()) {
      setCreateError("Please enter a name");
      return;
    }
    const slug = slugify(newSlug || newName);
    if (!isValidSlug(slug)) {
      setCreateError("Please enter a valid slug (letters, numbers, hyphens)");
      return;
    }
    createMutation.mutate({
      name: newName.trim(),
      event_type: newType,
      draft_slug: slug,
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-dash-primary">MyWedly</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">Your Websites</h1>
            <p className="mt-1 text-sm text-dash-muted">
              Manage and edit your invitation websites
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>Create Website</Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : "Failed to load"}
            onRetry={() => refetch()}
          />
        ) : !events || events.length === 0 ? (
          <EmptyState
            icon={<span className="text-4xl">💌</span>}
            title="No websites yet"
            description="Create your first invitation website to get started."
            action={<Button onClick={() => setShowCreate(true)}>Create Website</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Website">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Website name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Jane & John's Wedding"
            required
          />
          <Select
            label="Event type"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
          >
            <option value="Wedding">Wedding</option>
            <option value="Birthday">Birthday</option>
            <option value="Anniversary">Anniversary</option>
            <option value="Engagement">Engagement</option>
            <option value="Other">Other</option>
          </Select>
          <div>
            <Input
              label="Website URL (slug)"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder={newName ? slugify(newName) : "my-website"}
            />
            <p className="mt-1 text-sm text-dash-muted">Letters, numbers, and hyphens only</p>
          </div>
          {createError && (
            <p className="text-sm text-dash-danger">{createError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
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

function EventCard({ event }: { event: UserEvent }) {
  const displayName = event.draft_name || event.name;
  const eventType = event.draft_event_type || event.event_type || "Event";
  const slug = event.draft_slug || event.slug;

  return (
    <Link to={`/event/${event.id}`} className="block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-dash-text">{displayName}</h3>
            <p className="mt-1 text-sm text-dash-muted">{eventType}</p>
          </div>
          {event.is_published ? (
            <Badge color="success">Published</Badge>
          ) : (
            <Badge color="warning">Draft</Badge>
          )}
        </div>

        {event.cover_image && (
          <div className="mb-4 overflow-hidden rounded-lg">
            <img
              src={event.cover_image}
              alt={displayName}
              className="h-32 w-full object-cover"
            />
          </div>
        )}

        <div className="space-y-1 text-sm text-dash-muted">
          {event.draft_event_date && (
            <p>📅 {formatDate(event.draft_event_date)}</p>
          )}
          {event.draft_venue && <p>📍 {event.draft_venue}</p>}
          {slug && <p>🔗 /e/{slug}</p>}
        </div>
      </Card>
    </Link>
  );
}
