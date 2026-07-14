import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { formatDate } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Modal, LoadingSpinner, ErrorState, EmptyState, Card } from "../components/ui";

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Engagement",
  "Anniversary",
  "Corporate Event",
  "Other",
];

export default function Dashboard(): React.ReactElement {
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

  const { data: events, isLoading, error } = useQuery({
    queryKey: ["user-events", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", session!.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const userId = session!.user.id;
      const slug = slugify(newName) || `event-${Date.now()}`;
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: userId,
          name: newName,
          event_type: newType,
          slug,
          draft_slug: slug,
          draft_name: newName,
          draft_event_type: newType,
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
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
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

  async function handleSignOut(): Promise<void> {
    await supabase.auth.signOut();
    navigate("/auth");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <ErrorState message={error.message} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-dash-text">
              My<span className="text-dash-primary">Wedly</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-dash-muted">{session?.user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">Your Websites</h1>
            <p className="mt-1 text-sm text-dash-muted">
              Manage your invitation websites
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Website
          </Button>
        </div>

        {events && events.length === 0 ? (
          <Card className="mt-8">
            <EmptyState
              icon={
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              title="No websites yet"
              description="Create your first invitation website to get started."
              action={<Button onClick={() => setShowCreate(true)}>Create Website</Button>}
            />
          </Card>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events?.map((event) => (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                className="group rounded-lg border border-dash-border bg-dash-surface p-5 shadow-sm transition-all hover:shadow-md hover:border-dash-primary/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-dash-text group-hover:text-dash-primary transition-colors">
                      {event.name}
                    </h3>
                    <p className="mt-1 text-xs text-dash-muted">{event.event_type}</p>
                  </div>
                  {event.is_published ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-dash-border bg-dash-bg px-2 py-0.5 text-xs font-medium text-dash-muted">
                      Draft
                    </span>
                  )}
                </div>
                {event.event_date && (
                  <p className="mt-3 text-sm text-dash-muted">{formatDate(event.event_date)}</p>
                )}
                {event.venue && (
                  <p className="mt-1 text-sm text-dash-muted">{event.venue}</p>
                )}
                <div className="mt-4 flex items-center gap-2 text-xs text-dash-muted">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="truncate">/e/{event.slug || event.draft_slug || "..."}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Website">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Website name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Sarah & John's Wedding"
            required
            autoFocus
          />
          <Select label="Event type" value={newType} onChange={(e) => setNewType(e.target.value)}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          {newName && (
            <div className="rounded-md bg-dash-bg px-3 py-2">
              <p className="text-xs text-dash-muted">Your URL will be:</p>
              <p className="text-sm font-medium text-dash-text">
                /e/{slugify(newName) || "event"}
              </p>
            </div>
          )}
          {createError && (
            <div className="rounded-md border border-dash-danger/20 bg-dash-danger/5 px-4 py-3">
              <p className="text-sm text-dash-danger">{createError}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending} disabled={createMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
