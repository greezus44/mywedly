import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { formatDateShort, cn } from "../lib/utils";
import { Button } from "../components/ui/Button";
import {
  Card,
  Modal,
  Input,
  Select,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../components/ui";

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Baby Shower",
  "Engagement",
  "Anniversary",
  "Corporate Event",
  "Other",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Wedding");
  const [newDate, setNewDate] = useState("");

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
  });

  const userId = session?.user?.id;

  const {
    data: events,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["user_events", userId],
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
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (!uid) throw new Error("Not authenticated");

      const slug = slugify(newName || "my-event");

      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: uid,
          name: newName,
          event_type: newType,
          event_date: newDate || null,
          draft_name: newName,
          draft_event_type: newType,
          draft_event_date: newDate || null,
          slug,
          draft_slug: slug,
          is_published: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as UserEvent;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["user_events"] });
      setShowCreate(false);
      setNewName("");
      setNewType("Wedding");
      setNewDate("");
      navigate(`/event/${event.id}`);
    },
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg p-4">
        <ErrorState
          description={error instanceof Error ? error.message : "Failed to load events"}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">Your Events</h1>
            <p className="mt-1 text-sm text-dash-muted">
              Manage your invitation websites
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>Create Website</Button>
        </div>

        {events && events.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="Create your first invitation website to get started."
            icon={<span className="text-4xl">🎉</span>}
            action={
              <Button onClick={() => setShowCreate(true)}>Create Website</Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events?.map((event) => (
              <button
                key={event.id}
                onClick={() => navigate(`/event/${event.id}`)}
                className="text-left"
              >
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  {event.cover_image ? (
                    <div className="h-32 overflow-hidden bg-dash-bg">
                      <img
                        src={event.cover_image}
                        alt={event.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-gradient-to-br from-dash-primary/20 to-dash-accent/20">
                      <span className="text-3xl">🎉</span>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-dash-text">
                        {event.name}
                      </h3>
                      {event.is_published ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant="warning">Draft</Badge>
                      )}
                    </div>
                    <p className="text-sm text-dash-muted">
                      {event.event_type}
                    </p>
                    {event.event_date && (
                      <p className="mt-1 text-sm text-dash-muted">
                        {formatDateShort(event.event_date)}
                      </p>
                    )}
                  </div>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Website"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Event name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Sarah & John's Wedding"
            autoFocus
          />
          <Select
            label="Event type"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <Input
            label="Event date (optional)"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          {createMutation.isError && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create event"}
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
