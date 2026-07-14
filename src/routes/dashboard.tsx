import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { LoadingSpinner, Modal, Input, Button, Card, Badge, EmptyState } from "../components/ui";
import { formatDateShort, truncate } from "../lib/utils";

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Load auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["user-events", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UserEvent[];
    },
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: userId,
          name: name.trim(),
          draft_name: name.trim(),
          cover_config: {},
          theme: {},
          logo_config: {},
          content: {},
          login_config: {},
          sharing_config: {},
          is_published: false,
          is_archived: false,
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
      navigate(`/event/${event.id}`);
    },
    onError: (err) => {
      setCreateError(err instanceof Error ? err.message : "Failed to create event");
    },
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/auth");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreateError(null);
    createMutation.mutate(newName);
  }

  // Loading auth state
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner />
      </div>
    );
  }

  // Not signed in
  if (!userId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Please sign in</h1>
        <p className="text-dash-muted">You need to be signed in to access your dashboard.</p>
        <Button onClick={() => navigate("/auth")}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-dash-border bg-dash-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-dash-primary" style={{ fontFamily: "Georgia, serif" }}>
            MyWedly
          </span>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreate(true)}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New event
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold text-dash-text mb-8">My Events</h1>

        {eventsLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : !events || events.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="Create your first wedding website to get started."
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            }
            action={
              <Button onClick={() => setShowCreate(true)}>Create your first event</Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => navigate(`/event/${event.id}`)}
                className="group text-left"
              >
                <Card className="hover:border-dash-primary/50 hover:shadow-md transition-all h-full">
                  {event.cover_image && (
                    <div className="mb-3 overflow-hidden rounded-md">
                      <img
                        src={event.cover_image}
                        alt={event.name}
                        className="h-32 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-dash-text group-hover:text-dash-primary transition-colors">
                      {truncate(event.name, 40)}
                    </h2>
                    <Badge variant={event.is_published ? "success" : "default"}>
                      {event.is_published ? "Live" : "Draft"}
                    </Badge>
                  </div>
                  {event.event_date && (
                    <p className="mt-1 text-sm text-dash-muted">{formatDateShort(event.event_date)}</p>
                  )}
                  {event.venue && (
                    <p className="text-xs text-dash-muted mt-0.5 truncate">{event.venue}</p>
                  )}
                </Card>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setNewName(""); setCreateError(null); }} title="Create new event">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Event name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Sarah & James's Wedding"
            autoFocus
          />
          {createError && <p className="text-sm text-red-500">{createError}</p>}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={() => { setShowCreate(false); setNewName(""); }}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending} disabled={!newName.trim()}>
              Create event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
