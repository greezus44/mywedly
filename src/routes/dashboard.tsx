import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Modal, Card, EmptyState, LoadingSpinner, ErrorState, Badge } from "../components/ui";
import { formatDate } from "../lib/utils";

const EVENT_TYPES = ["Wedding", "Birthday", "Engagement", "Anniversary", "Baby Shower", "Other"];

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
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ["user-events", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", session!.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: session!.user.id,
          name: newName,
          event_type: newType,
          event_date: newDate || null,
          draft_name: newName,
          draft_event_type: newType,
          draft_event_date: newDate || null,
          slug: slugify(newName),
          draft_slug: slugify(newName),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      setShowCreate(false);
      setNewName("");
      setNewDate("");
      navigate(`/event/${data.id}`);
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">My Websites</h1>
          <p className="mt-1 text-sm text-dash-muted">Manage your invitation websites.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ Create Website</Button>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !events || events.length === 0 ? (
          <EmptyState
            title="No websites yet"
            description="Create your first invitation website to get started."
            action={<Button onClick={() => setShowCreate(true)}>+ Create Website</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  <div
                    className="h-32 bg-gradient-to-br from-dash-primary/20 to-dash-primary/5 bg-cover bg-center"
                    style={
                      event.cover_image
                        ? { backgroundImage: `url(${event.cover_image})` }
                        : undefined
                    }
                  />
                  <div className="p-4">
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
                    {event.draft_event_date && (
                      <p className="mt-1 text-xs text-dash-muted">
                        {formatDate(event.draft_event_date)}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Website"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
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
            label="Website Name"
            placeholder="e.g. Sarah & John's Wedding"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Select label="Event Type" value={newType} onChange={(e) => setNewType(e.target.value)}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            label="Event Date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          {createMutation.isError && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create website"}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
