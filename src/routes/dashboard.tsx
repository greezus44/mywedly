import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../lib/supabase";
import { slugify, isValidSlug } from "../lib/theme";
import { formatDateShort } from "../lib/utils";
import {
  Card,
  Badge,
  Modal,
  Input,
  EmptyState,
  LoadingSpinner,
  ErrorState,
} from "../components/ui";
import { Button } from "../components/ui/Button";

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
  });

  const userId = session?.user?.id ?? "";

  const { data: events, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["user-events", userId],
    enabled: !!userId,
    queryFn: async () => {
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
    mutationFn: async (input: { name: string; slug: string }) => {
      const slug = input.slug || slugify(input.name);
      if (!isValidSlug(slug)) throw new Error("Invalid URL slug");
      const { data, error: createError } = await supabase
        .from("user_events")
        .insert({
          creator_id: userId,
          name: input.name,
          draft_name: input.name,
          slug,
          draft_slug: slug,
          is_published: false,
        })
        .select()
        .single();
      if (createError) throw createError;
      return data as UserEvent;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["user-events", userId] });
      setShowCreate(false);
      setNewName("");
      setNewSlug("");
      setCreateError(null);
      navigate(`/event/${event.id}`);
    },
    onError: (err: Error) => setCreateError(err.message),
  });

  const handleNameChange = (name: string) => {
    setNewName(name);
    if (!newSlug) setNewSlug(slugify(name));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!newName.trim()) {
      setCreateError("Name is required");
      return;
    }
    createMutation.mutate({ name: newName.trim(), slug: newSlug.trim() });
  };

  return (
    <div className="min-h-screen bg-dash-bg">
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-bold text-dash-primary">
            MyWedly
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreate(true)}
            >
              + Create Website
            </Button>
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dash-text">My Websites</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Manage your invitation websites and their settings.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        ) : isError ? (
          <ErrorState message={error instanceof Error ? error.message : "Failed to load"} onRetry={() => refetch()} />
        ) : !events || events.length === 0 ? (
          <EmptyState
            title="No websites yet"
            description="Create your first invitation website to get started."
            icon={<span className="text-4xl">💌</span>}
            action={
              <Button onClick={() => setShowCreate(true)}>Create Website</Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <Card hover className="h-full">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-dash-text">
                      {event.draft_name || event.name}
                    </h3>
                    {event.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="default">Draft</Badge>
                    )}
                  </div>
                  {event.draft_event_date && (
                    <p className="text-sm text-dash-muted">
                      {formatDateShort(event.draft_event_date)}
                    </p>
                  )}
                  {event.draft_venue && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {event.draft_venue}
                    </p>
                  )}
                  {event.slug && (
                    <p className="mt-3 truncate text-xs text-dash-muted">
                      /e/{event.slug}
                    </p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Website">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Event Name"
            type="text"
            value={newName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="John & Jane's Wedding"
            required
          />
          <Input
            label="URL Slug"
            type="text"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            placeholder="john-and-jane"
          />
          {newSlug && (
            <p className="text-xs text-dash-muted">
              Preview: {window.location.origin}/e/{newSlug}
            </p>
          )}
          {createError && (
            <p className="rounded-md bg-dash-danger/10 px-3 py-2 text-sm text-dash-danger">
              {createError}
            </p>
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
