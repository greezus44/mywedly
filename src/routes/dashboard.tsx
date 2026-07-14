import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge } from "../components/ui";
import { formatDateShort } from "../lib/utils";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Wedding");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: sessionData } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data;
    },
  });

  const userId = sessionData?.session?.user?.id;

  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ["user-events", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UserEvent[];
    },
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not authenticated");
      const name = newName.trim() || "Untitled Event";
      const slug = slugify(name);
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: userId,
          name,
          draft_name: name,
          event_type: newType,
          draft_event_type: newType,
          draft_slug: slug,
          is_published: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as UserEvent;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["user-events", userId] });
      setCreateOpen(false);
      setNewName("");
      setNewType("Wedding");
      setCreateError(null);
      navigate(`/event/${event.id}`);
    },
    onError: (err: unknown) => {
      setCreateError(err instanceof Error ? err.message : "Failed to create website");
    },
  });

  const handleCreate = () => {
    setCreateError(null);
    createMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner size="lg" label="Loading your websites..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg px-4">
        <ErrorState
          title="Failed to load"
          message="We couldn't load your invitation websites."
          onRetry={() => refetch()}
          className="max-w-md"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="border-b border-dash-border bg-dash-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-dash-text">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-dash-primary text-dash-primary-fg">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.5c0-.9-.4-1.7-1-2.3V8a3 3 0 00-3-3h-1V3h-2v2h-4V3H8v2H7a3 3 0 00-3 3v5.2c-.6.6-1 1.4-1 2.3v4a1 1 0 001 1h1v2h2v-2h10v2h2v-2h1a1 1 0 001-1v-4z" />
              </svg>
            </span>
            MyWedly
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/");
            }}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">Your Websites</h1>
            <p className="mt-1 text-sm text-dash-muted">
              Manage your invitation websites and create new ones.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>Create Website</Button>
        </div>

        {(!events || events.length === 0) && (
          <EmptyState
            title="No websites yet"
            description="Create your first invitation website to get started."
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            }
            action={<Button onClick={() => setCreateOpen(true)}>Create Website</Button>}
          />
        )}

        {events && events.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <Card hover className="h-full cursor-pointer">
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-dash-text">
                      {event.draft_name || event.name || "Untitled"}
                    </h3>
                    {event.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="default">Draft</Badge>
                    )}
                  </div>
                  <p className="text-sm text-dash-muted">{event.draft_event_type || event.event_type}</p>
                  {event.draft_event_date && (
                    <p className="mt-2 text-sm text-dash-muted">
                      {formatDateShort(event.draft_event_date)}
                    </p>
                  )}
                  {event.draft_venue && (
                    <p className="mt-1 truncate text-sm text-dash-muted">{event.draft_venue}</p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Website">
        <div className="space-y-4">
          <Input
            label="Event name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Jane & John's Wedding"
            autoFocus
          />
          <Input
            label="Event type"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="e.g. Wedding, Birthday, Anniversary"
          />
          {createError && (
            <p className="text-sm text-dash-danger">{createError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={createMutation.isPending}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
