import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { Button } from "../components/ui/Button";
import { Input, Textarea } from "../components/ui/Input";
import {
  Card,
  Badge,
  Modal,
  EmptyState,
  LoadingSpinner,
  ErrorState,
} from "../components/ui";
import { formatDate } from "../lib/utils";

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
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

  const userId = session?.user?.id ?? "";

  const { data: events, isLoading, isError, error } = useQuery({
    queryKey: ["user-events", userId],
    queryFn: async () => {
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
    mutationFn: async (input: { name: string; eventType: string }) => {
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: userId,
          name: input.name,
          draft_name: input.name,
          event_type: input.eventType,
          draft_event_type: input.eventType,
          is_published: false,
          is_archived: false,
          slug: slugify(input.name),
          draft_slug: slugify(input.name),
        })
        .select()
        .single();
      if (error) throw error;
      return data as UserEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-events", userId] });
      setShowCreate(false);
      setNewName("");
      setNewType("Wedding");
    },
  });

  function handleCreate() {
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim(), eventType: newType });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg">
        <ErrorState message={error instanceof Error ? error.message : "Failed to load events"} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="border-b border-dash-border bg-dash-surface">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="flex items-center gap-2 text-lg font-bold text-dash-text">
              <span className="text-dash-primary">My</span>Wedly
            </a>
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

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">Your Websites</h1>
            <p className="text-sm text-dash-muted mt-1">
              Manage your invitation websites
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>Create Website</Button>
        </div>

        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev) => (
              <button
                key={ev.id}
                onClick={() => navigate(`/event/${ev.id}`)}
                className="text-left"
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  {ev.draft_cover_image ? (
                    <div className="mb-4 -m-2 mb-2 rounded overflow-hidden h-32">
                      <img
                        src={ev.draft_cover_image}
                        alt={ev.draft_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 -m-2 mb-2 rounded overflow-hidden h-32 bg-dash-bg flex items-center justify-center">
                      <span className="text-3xl">💌</span>
                    </div>
                  )}
                  <h3 className="font-semibold text-dash-text mb-1">
                    {ev.draft_name || "Untitled"}
                  </h3>
                  <p className="text-xs text-dash-muted mb-3">
                    {formatDate(ev.draft_event_date) || "Date not set"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={ev.is_published ? "success" : "warning"}>
                      {ev.is_published ? "Published" : "Draft"}
                    </Badge>
                    {ev.draft_event_type && (
                      <Badge>{ev.draft_event_type}</Badge>
                    )}
                  </div>
                </Card>
              </button>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              title="No websites yet"
              description="Create your first invitation website to get started."
              icon={<span className="text-4xl">💌</span>}
              action={<Button onClick={() => setShowCreate(true)}>Create Website</Button>}
            />
          </Card>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Website">
        <div className="space-y-4">
          <Input
            label="Website Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Jane & John's Wedding"
            autoFocus
          />
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1.5">
              Event Type
            </label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
            >
              <option value="Wedding">Wedding</option>
              <option value="Birthday">Birthday</option>
              <option value="Anniversary">Anniversary</option>
              <option value="Engagement">Engagement</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {createMutation.isError && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create website"}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
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
