import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, Badge, EmptyState, LoadingSpinner, ErrorState, Modal } from "../components/ui";
import { formatDate } from "../lib/utils";

export function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const userId = session?.user?.id;

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
      return data as UserEvent[];
    },
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: userId,
          name,
          draft_name: name,
          slug: slugify(name),
          draft_slug: slugify(name),
        })
        .select()
        .single();
      if (error) throw error;
      return data as UserEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      setShowCreate(false);
      setNewName("");
    },
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate(newName.trim());
  };

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="text-center">
          <p className="text-dash-muted">Please sign in to view your dashboard.</p>
          <Link to="/auth" className="mt-4 inline-block">
            <Button>Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      <header className="border-b border-dash-border bg-dash-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold text-dash-primary">
            MyWedly
          </Link>
          <div className="flex items-center gap-3">
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
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">Your Websites</h1>
            <p className="mt-1 text-sm text-dash-muted">
              Manage your invitation websites
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>Create Website</Button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {isError && (
          <ErrorState
            message="Failed to load your websites."
            onRetry={() => refetch()}
          />
        )}

        {events && events.length === 0 && !isLoading && (
          <EmptyState
            title="No websites yet"
            description="Create your first invitation website to get started."
            action={<Button onClick={() => setShowCreate(true)}>Create Website</Button>}
          />
        )}

        {events && events.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  {event.draft_cover_image && (
                    <div className="mb-4 -m-1 mb-2 h-32 overflow-hidden rounded-md">
                      <img
                        src={event.draft_cover_image}
                        alt={event.draft_name || event.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-dash-text">
                      {event.draft_name || event.name}
                    </h3>
                    {event.is_published ? (
                      <Badge color="success">Published</Badge>
                    ) : (
                      <Badge color="warning">Draft</Badge>
                    )}
                  </div>
                  {event.draft_event_date && (
                    <p className="mt-2 text-sm text-dash-muted">
                      {formatDate(event.draft_event_date)}
                    </p>
                  )}
                  {event.draft_venue && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {event.draft_venue}
                    </p>
                  )}
                  {event.draft_slug && (
                    <p className="mt-3 text-xs text-dash-muted">
                      /{event.draft_slug}
                    </p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Website">
        <div className="space-y-4">
          <Input
            label="Website name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Sarah & John's Wedding"
            autoFocus
          />
          {createMutation.isError && (
            <p className="text-sm text-red-600">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create website"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={!newName.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
