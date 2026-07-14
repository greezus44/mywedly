import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { formatDate } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, Modal, LoadingSpinner, ErrorState, EmptyState } from "../components/ui";

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: session } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const userId = session?.user?.id;

  const { data: events, isLoading, isError, error } = useQuery({
    queryKey: ["user-events", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: userId!,
          name,
          draft_name: name,
          draft_slug: slugify(name),
          is_published: false,
          is_archived: false,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["user-events", userId] });
      setShowCreate(false);
      setNewName("");
      setCreateError(null);
      navigate(`/event/${event.id}`);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!newName.trim()) {
      setCreateError("Please enter a name");
      return;
    }
    createMutation.mutate(newName.trim());
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <ErrorState message={error instanceof Error ? error.message : "Failed to load events"} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      <header className="border-b border-dash-border bg-dash-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-dash-primary">
            MyWedly
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-dash-muted">{session?.user?.email}</span>
            <Button variant="secondary" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">My Invitation Websites</h1>
            <p className="mt-1 text-sm text-dash-muted">Manage and edit your invitation websites</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>Create Website</Button>
        </div>

        {events && events.length === 0 ? (
          <EmptyState
            title="No invitation websites yet"
            description="Create your first invitation website to get started."
            action={<Button onClick={() => setShowCreate(true)}>Create Website</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events?.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <div className="mb-3 h-32 overflow-hidden rounded-md bg-dash-bg">
                    {event.cover_image ? (
                      <img
                        src={event.cover_image}
                        alt={event.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-dash-muted">
                        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.25a3 3 0 014.09 0l5.25 5.25M14.25 12l1.5-1.5a3 3 0 014.09 0L21.75 15.75M3 18.75h18a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v9.75A2.25 2.25 0 003 18.75z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-dash-text">
                    {event.draft_name || event.name}
                  </h3>
                  {event.draft_event_date && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {formatDate(event.draft_event_date)}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    {event.is_published ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        Draft
                      </span>
                    )}
                    {event.draft_slug && (
                      <span className="text-xs text-dash-muted">/{event.draft_slug}</span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Invitation Website">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Website Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Sarah & John's Wedding"
            autoFocus
          />
          {createError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-dash-danger">{createError}</p>
          )}
          <div className="flex justify-end gap-2">
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
