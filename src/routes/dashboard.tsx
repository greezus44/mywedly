import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { formatDate, cn } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input, Modal, LoadingSpinner, ErrorState, EmptyState, Badge } from "../components/ui";

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Wedding");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
  });

  const userId = session?.user?.id;

  const {
    data: events,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user-events", userId],
    queryFn: async () => {
      if (!userId) return [];
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
    mutationFn: async () => {
      if (!userId) throw new Error("Not authenticated");
      if (!newName.trim()) throw new Error("Name is required");
      const slug = slugify(newName);
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: userId,
          name: newName.trim(),
          event_type: newType,
          draft_name: newName.trim(),
          draft_event_type: newType,
          draft_slug: slug,
          slug,
          is_published: false,
          is_archived: false,
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
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["user-events", userId] });
      setShowCreate(false);
      setNewName("");
      setNewType("Wedding");
      setCreateError(null);
      navigate(`/event/${event.id}`);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="text-center">
          <p className="text-dash-muted">Please sign in to view your dashboard.</p>
          <Link to="/auth" className="mt-4 inline-block">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="border-b border-dash-border bg-dash-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-dash-primary">
            MyWedly
          </Link>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => {
                setCreateError(null);
                setShowCreate(true);
              }}
            >
              + Create Website
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/");
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-dash-text">Your Invitation Websites</h1>
        <p className="mt-1 text-sm text-dash-muted">
          Manage and customize your event websites.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        ) : isError ? (
          <ErrorState message={error?.message} onRetry={() => refetch()} />
        ) : !events || events.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No websites yet"
              description="Create your first invitation website to get started."
              icon={<span className="text-4xl">💌</span>}
              action={
                <Button
                  onClick={() => {
                    setCreateError(null);
                    setShowCreate(true);
                  }}
                >
                  + Create Website
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                className="group overflow-hidden rounded-lg border border-dash-border bg-dash-surface shadow-sm transition-all hover:shadow-md"
              >
                <div
                  className={cn(
                    "flex h-40 items-center justify-center bg-gradient-to-br from-dash-primary/10 to-dash-primary/5"
                  )}
                >
                  {event.cover_image ? (
                    <img
                      src={event.cover_image}
                      alt={event.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">💌</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate text-lg font-semibold text-dash-text group-hover:text-dash-primary">
                      {event.name}
                    </h3>
                    {event.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-dash-muted">
                    {event.event_type}
                    {event.event_date ? ` • ${formatDate(event.event_date)}` : ""}
                  </p>
                  {event.slug && (
                    <p className="mt-2 truncate text-xs text-dash-muted">/e/{event.slug}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Website"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              loading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Event Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Sarah & John's Wedding"
            autoFocus
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-dash-text">Event Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
            >
              <option>Wedding</option>
              <option>Birthday</option>
              <option>Anniversary</option>
              <option>Engagement</option>
              <option>Corporate</option>
              <option>Other</option>
            </select>
          </div>
          {newName && (
            <p className="text-xs text-dash-muted">
              URL slug: <span className="font-mono">/e/{slugify(newName)}</span>
            </p>
          )}
          {createError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-dash-danger">{createError}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
