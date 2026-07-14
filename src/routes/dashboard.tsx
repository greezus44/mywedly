import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase, type UserEvent, type Json } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { Button } from "../components/ui/Button";
import { Card, Input, Modal, Badge, EmptyState, LoadingSpinner, ErrorState } from "../components/ui";
import { formatDate } from "../lib/utils";

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("wedding");

  const { data: sessionData } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data;
    },
  });

  const userId = sessionData?.session?.user?.id;

  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ["user-events", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const slug = slugify(newName) || `event-${Date.now()}`;
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: userId!,
          name: newName,
          draft_name: newName,
          event_type: newType,
          draft_event_type: newType,
          slug,
          draft_slug: slug,
          cover_config: {} as Json,
          draft_cover_config: {} as Json,
          theme: {} as Json,
          draft_theme: {} as Json,
          logo_config: {} as Json,
          draft_logo_config: {} as Json,
          content: {} as Json,
          draft_content: {} as Json,
          login_config: {} as Json,
          draft_login_config: {} as Json,
          sharing_config: {} as Json,
          draft_sharing_config: {} as Json,
          is_published: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-events", userId] });
      setShowCreate(false);
      setNewName("");
      setNewType("wedding");
      navigate(`/event/${data.id}`);
    },
  });

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <Card className="max-w-md text-center">
          <p className="text-dash-muted">Please sign in to view your dashboard.</p>
          <Link to="/auth">
            <Button className="mt-4">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-dash-text">
            <span className="text-dash-primary">My</span>Wedly
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-dash-muted">
              {sessionData?.session?.user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
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

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">Your Invitation Websites</h1>
            <p className="mt-1 text-sm text-dash-muted">
              Manage and edit your event invitation websites.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>Create Website</Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size={32} />
          </div>
        )}

        {isError && (
          <ErrorState
            message="Failed to load your invitation websites."
            onRetry={() => refetch()}
          />
        )}

        {events && events.length === 0 && (
          <EmptyState
            title="No invitation websites yet"
            description="Create your first invitation website to get started."
            icon={<div className="text-4xl">💌</div>}
            action={<Button onClick={() => setShowCreate(true)}>Create Website</Button>}
          />
        )}

        {events && events.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                  {event.draft_cover_image ? (
                    <div className="mb-4 aspect-video overflow-hidden rounded-md bg-dash-bg">
                      <img
                        src={event.draft_cover_image}
                        alt={event.draft_name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 flex aspect-video items-center justify-center rounded-md bg-dash-bg">
                      <span className="text-3xl">💌</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-dash-text group-hover:text-dash-primary">
                        {event.draft_name}
                      </h3>
                      {event.draft_event_date && (
                        <p className="mt-1 text-sm text-dash-muted">
                          {formatDate(event.draft_event_date)}
                        </p>
                      )}
                    </div>
                    {event.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                  </div>
                  {event.draft_venue && (
                    <p className="mt-2 text-sm text-dash-muted">📍 {event.draft_venue}</p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Invitation Website">
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Jane & John's Wedding"
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Event Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
            >
              <option value="wedding">Wedding</option>
              <option value="birthday">Birthday</option>
              <option value="engagement">Engagement</option>
              <option value="anniversary">Anniversary</option>
              <option value="other">Other</option>
            </select>
          </div>
          {newName && (
            <div className="rounded-md bg-dash-bg px-3 py-2 text-sm text-dash-muted">
              URL: /e/{slugify(newName) || "event"}
            </div>
          )}
          {createMutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {(createMutation.error as Error)?.message ?? "Failed to create website"}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
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
