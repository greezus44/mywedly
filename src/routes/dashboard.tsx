import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { formatDate } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Card,
  Badge,
  Modal,
  LoadingSpinner,
  EmptyState,
  ErrorState,
} from "../components/ui";

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: session } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
  });

  const { data: events, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["user-events", session?.user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", session!.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
    enabled: !!session?.user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const slug = slugify(name) || `event-${Date.now()}`;
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          name,
          draft_name: name,
          creator_id: session!.user.id,
          draft_slug: slug,
        })
        .select()
        .single();
      if (error) throw error;
      return data as UserEvent;
    },
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ["user-events", session?.user?.id] });
      setCreateOpen(false);
      setNewName("");
      setCreateError(null);
      navigate(`/event/${newEvent.id}`);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  const handleCreate = () => {
    if (!newName.trim()) {
      setCreateError("Please enter a name for your website");
      return;
    }
    setCreateError(null);
    createMutation.mutate(newName.trim());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg px-4">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load websites"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="border-b border-dash-border bg-dash-surface">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-dash-primary">MyWedly</span>
          </Link>
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
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">Your Websites</h1>
            <p className="mt-1 text-sm text-dash-muted">
              Manage and edit your invitation websites.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>Create Website</Button>
        </div>

        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-dash-text">
                      {event.draft_name || event.name}
                    </h3>
                    {event.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                  </div>
                  {event.draft_event_date && (
                    <p className="text-sm text-dash-muted mb-2">
                      📅 {formatDate(event.draft_event_date)}
                    </p>
                  )}
                  {event.draft_venue && (
                    <p className="text-sm text-dash-muted mb-2">
                      📍 {event.draft_venue}
                    </p>
                  )}
                  {event.draft_slug && (
                    <p className="text-xs text-dash-muted mt-3 font-mono">
                      /{event.draft_slug}
                    </p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No websites yet"
            description="Create your first invitation website to get started."
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            }
            action={<Button onClick={() => setCreateOpen(true)}>Create Website</Button>}
          />
        )}
      </main>

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setNewName("");
          setCreateError(null);
        }}
        title="Create New Website"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCreateOpen(false);
                setNewName("");
                setCreateError(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={createMutation.isPending}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Website Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., Sarah & John's Wedding"
            autoFocus
          />
          {newName.trim() && (
            <p className="text-sm text-dash-muted">
              URL: /{slugify(newName) || "event"}
            </p>
          )}
          {createError && (
            <p className="text-sm text-dash-danger">{createError}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
