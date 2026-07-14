import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Profile } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui";
import { LoadingSpinner, ErrorState, EmptyState, Modal, Card } from "../components/ui";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { formatDate } from "../lib/utils";

export function DashboardPage() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("wedding");
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser({ id: data.session.user.id, email: data.session.user.email });
      setAuthLoading(false);
    });
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });

  const { data: events, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `event-${Date.now()}`;
      const { error } = await supabase.from("user_events").insert({
        creator_id: user.id,
        draft_name: newName,
        draft_event_type: newType,
        draft_slug: slug,
        theme: null,
        draft_theme: null,
        cover_config: {},
        draft_cover_config: {},
        logo_config: {},
        draft_logo_config: {},
        content: {},
        draft_content: {},
        login_config: {},
        draft_login_config: {},
        sharing_config: {},
        draft_sharing_config: {},
        is_published: false,
        is_archived: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowCreate(false);
      setNewName("");
      setNewType("wedding");
      setCreateError(null);
    },
    onError: (e) => setCreateError(e instanceof Error ? e.message : "Failed to create event"),
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Please sign in</h1>
        <Link to="/auth"><Button>Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-dash-bg">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">
              Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}
            </h1>
            <p className="text-sm text-dash-muted">Manage your event websites</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>Create Event</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : isError ? (
          <ErrorState title="Failed to load events" message={error instanceof Error ? error.message : "Unknown error"} onRetry={() => refetch()} />
        ) : !events || events.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="Create your first event to get started."
            action={<Button onClick={() => setShowCreate(true)}>Create Event</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
                  {event.draft_cover_image && (
                    <img src={event.draft_cover_image} alt="" className="mb-3 h-32 w-full rounded object-cover" />
                  )}
                  <h3 className="font-semibold text-dash-text">{event.draft_name || event.name || "Untitled Event"}</h3>
                  <p className="mt-1 text-sm text-dash-muted">
                    {event.draft_event_date ? formatDate(event.draft_event_date) : "No date set"}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {event.is_published ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Published</span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">Draft</span>
                    )}
                    {event.draft_slug && <span className="text-xs text-dash-muted">/{event.draft_slug}</span>}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Event">
        <form
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
          className="space-y-4"
        >
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
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
            >
              <option value="wedding">Wedding</option>
              <option value="birthday">Birthday</option>
              <option value="anniversary">Anniversary</option>
              <option value="corporate">Corporate</option>
              <option value="other">Other</option>
            </select>
          </div>
          {createError && <p className="text-sm text-dash-danger">{createError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
