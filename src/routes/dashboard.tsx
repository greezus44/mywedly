import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { formatDate, cn } from "../lib/utils";
import { Button } from "../components/ui/Button";
import {
  Input,
  Select,
  Card,
  Badge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Modal,
} from "../components/ui";

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Anniversary",
  "Engagement",
  "Bridal Shower",
  "Baby Shower",
  "Other",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Wedding");

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
  });

  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey: ["user-events"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
    enabled: !!session,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
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
          draft_slug: slug,
          slug,
          cover_config: {},
          login_config: {},
          theme: {},
          logo_config: {},
          content: {},
          sharing_config: {},
          is_published: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as UserEvent;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      setCreateOpen(false);
      setNewName("");
      setNewType("Wedding");
      navigate(`/event/${event.id}`);
    },
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg p-4">
        <ErrorState
          title="Failed to load your websites"
          message={error.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-dash-primary text-dash-primary-fg">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.5c-1.874 0-3.625.554-5 1.5m-9-1.5c1.874 0 3.625.554 5 1.5m4-1.5c-1.874 0-3.625.554-5 1.5m0 0V12m0 5.5v3.5m0-9V4m0 0C9.5 4 8 5.5 8 7.5S9.5 11 11 11s3-1.5 3-3.5S12.5 4 11 4z" />
              </svg>
            </span>
            <span className="text-lg font-bold text-dash-text">
              My<span className="text-dash-primary">Wedly</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">Your Websites</h1>
            <p className="mt-1 text-sm text-dash-muted">
              Manage and edit your invitation websites
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Website
          </Button>
        </div>

        {events && events.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="No websites yet"
              description="Create your first invitation website to get started."
              icon={
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  Create Website
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events?.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <Card className="group cursor-pointer p-0 transition-shadow hover:shadow-md">
                  {/* Cover */}
                  <div className="relative h-40 overflow-hidden rounded-t-lg bg-dash-bg">
                    {event.cover_image ? (
                      <img
                        src={event.cover_image}
                        alt={event.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-dash-primary/20 to-dash-primary/5">
                        <span className="text-3xl font-bold text-dash-primary/40">
                          {event.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {event.is_published ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant="warning">Draft</Badge>
                      )}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-dash-text">{event.name}</h3>
                    <p className="mt-1 text-sm text-dash-muted">
                      {event.event_type}
                    </p>
                    {event.event_date && (
                      <p className="mt-1 text-xs text-dash-muted">
                        {formatDate(event.event_date)}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Website"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={!newName.trim()}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Website name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. John & Jane's Wedding"
          />
          <Select
            label="Event type"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          {newName.trim() && (
            <div className="rounded-lg bg-dash-bg px-3 py-2 text-sm text-dash-muted">
              URL: /e/{slugify(newName) || "event"}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
