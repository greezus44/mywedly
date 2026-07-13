import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { formatDate } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input, Modal, Card, Badge, EmptyState, ErrorState, LoadingSpinner } from "../components/ui";

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("wedding");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ["user_events"],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not authenticated");
      const slug = slugify(newName) || `event-${Date.now()}`;
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: userId,
          name: newName,
          event_type: newType,
          draft_name: newName,
          draft_event_type: newType,
          slug,
          draft_slug: slug,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user_events"] });
      setCreateOpen(false);
      setNewName("");
      setNewType("wedding");
      setCreateError(null);
      if (data) navigate(`/event/${data.id}`);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!newName.trim()) {
      setCreateError("Please enter a name");
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-dash-bg">
      <header className="border-b border-dash-border bg-dash-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-dash-primary text-dash-primary-fg font-bold">
              M
            </span>
            <span className="text-lg font-bold text-dash-text">MyWedly</span>
          </Link>
          <Button
            variant="ghost"
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">Your Websites</h1>
            <p className="text-sm text-dash-muted">Manage your event invitation websites</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>Create Website</Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {isError && (
          <ErrorState
            message="Failed to load your websites."
            onRetry={() => refetch()}
          />
        )}
        {events && events.length === 0 && (
          <EmptyState
            title="No websites yet"
            description="Create your first event invitation website to get started."
            icon={<span className="text-4xl">💌</span>}
            action={<Button onClick={() => setCreateOpen(true)}>Create Website</Button>}
          />
        )}
        {events && events.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
                  {event.draft_cover_image || event.cover_image ? (
                    <div className="mb-4 -m-2 mb-2 h-32 overflow-hidden rounded-lg">
                      <img
                        src={event.draft_cover_image || event.cover_image || ""}
                        alt={event.draft_name || event.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-dash-bg">
                      <span className="text-3xl">💌</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-dash-text">
                      {event.draft_name || event.name}
                    </h3>
                    {event.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-dash-muted">
                    {event.draft_event_type || event.event_type}
                  </p>
                  {event.draft_event_date || event.event_date ? (
                    <p className="mt-1 text-sm text-dash-muted">
                      {formatDate(event.draft_event_date || event.event_date)}
                    </p>
                  ) : null}
                  {event.draft_venue || event.venue ? (
                    <p className="mt-1 text-sm text-dash-muted">
                      {event.draft_venue || event.venue}
                    </p>
                  ) : null}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Website">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Event name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Sarah & John's Wedding"
            autoFocus
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-dash-text">Event type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
            >
              <option value="wedding">Wedding</option>
              <option value="birthday">Birthday</option>
              <option value="corporate">Corporate</option>
              <option value="other">Other</option>
            </select>
          </div>
          {createError && (
            <p className="text-sm text-dash-danger">{createError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
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
