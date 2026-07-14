import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui";
import { LoadingSpinner, ErrorState, EmptyState, Modal } from "../components/ui";
import { SiteHeader } from "../components/site/SiteHeader";
import { DEFAULT_THEME } from "../lib/theme";
import { slugify } from "../lib/utils";

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<{ user: { id: string } } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session as { user: { id: string } } | null);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s as { user: { id: string } } | null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: events, isLoading, isError, error } = useQuery({
    queryKey: ["events", session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("creator_id", session!.user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
    enabled: !!session?.user.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("Not authenticated");
      const slug = newSlug || slugify(newName);
      const { data, error } = await supabase.from("user_events").insert({
        creator_id: session.user.id,
        name: newName,
        draft_name: newName,
        slug,
        draft_slug: slug,
        theme: DEFAULT_THEME as unknown as Json,
        draft_theme: DEFAULT_THEME as unknown as Json,
        is_published: false,
        is_archived: false,
      }).select("*").single();
      if (error) throw error;
      return data as UserEvent;
    },
    onSuccess: (ev) => {
      queryClient.invalidateQueries({ queryKey: ["events", session?.user.id] });
      setShowCreate(false);
      setNewName("");
      setNewSlug("");
      navigate(`/event/${ev.id}`);
    },
  });

  const handleCreate = async () => {
    if (!newName.trim()) { setCreateError("Event name is required"); return; }
    setCreating(true);
    setCreateError(null);
    try { await createMutation.mutateAsync(); }
    catch (e) { setCreateError(e instanceof Error ? e.message : "Failed to create event"); }
    finally { setCreating(false); }
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner /></div>;
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Please sign in</h1>
        <Link to="/auth"><Button>Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dash-text">Your Events</h1>
          <Button onClick={() => setShowCreate(true)}>Create Event</Button>
        </div>
        {isLoading ? <div className="flex justify-center py-12"><LoadingSpinner /></div>
        : isError ? <ErrorState title="Failed to load events" message={error instanceof Error ? error.message : "Unknown error"} />
        : !events || events.length === 0 ? (
          <EmptyState title="No events yet" description="Create your first wedding event to get started." action={<Button onClick={() => setShowCreate(true)}>Create Event</Button>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <Link key={ev.id} to={`/event/${ev.id}`} className="rounded-lg border border-dash-border bg-dash-surface p-4 transition-shadow hover:shadow-md">
                <h3 className="mb-1 font-semibold text-dash-text">{ev.draft_name || ev.name || "Untitled Event"}</h3>
                <p className="text-sm text-dash-muted">{ev.draft_event_date || ev.event_date || "No date set"}</p>
                <p className="mt-2 text-xs text-dash-muted">{ev.is_published ? "Published" : "Draft"}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Event">
        <div className="space-y-4">
          <Input label="Event Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. John & Jane's Wedding" autoFocus />
          <Input label="Slug (optional)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="auto-generated from name" />
          {createError && <p className="text-sm text-dash-danger">{createError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
