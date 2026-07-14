import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { cn, formatDateShort } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Modal,
  Badge,
} from "../components/ui";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Wedding");

  const { data: events, isLoading, isError } = useQuery({
    queryKey: ["user-events"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const slug = slugify(newName) || "my-event";
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: user.id,
          name: newName,
          draft_name: newName,
          event_type: newType,
          draft_event_type: newType,
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
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      setShowCreate(false);
      setNewName("");
      setNewType("Wedding");
      navigate(`/event/${event.id}`);
    },
  });

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <ErrorState
          title="Failed to load your websites"
          description="Please try again or sign in."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Your Websites
            </h1>
            <p className="mt-1 text-sm text-muted">
              Manage and edit your invitation websites.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>Create Website</Button>
        </div>

        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => navigate(`/event/${event.id}`)}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-lg border border-border bg-surface text-left shadow-sm transition-all hover:shadow-md"
                )}
              >
                <div className="relative h-40 overflow-hidden bg-surface-alt">
                  {event.cover_image ? (
                    <img
                      src={event.cover_image}
                      alt={event.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted">
                      <span className="text-3xl">🎉</span>
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    {event.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-4">
                  <h3 className="font-semibold text-foreground">
                    {event.name}
                  </h3>
                  <p className="text-xs text-muted">{event.event_type}</p>
                  {event.event_date && (
                    <p className="text-xs text-muted">
                      {formatDateShort(event.event_date)}
                    </p>
                  )}
                  {event.venue && (
                    <p className="text-xs text-muted">{event.venue}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No websites yet"
            description="Create your first invitation website to get started."
            action={<Button onClick={() => setShowCreate(true)}>Create Website</Button>}
          />
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Website"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Website name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. John & Jane's Wedding"
            required
            autoFocus
          />
          <Input
            label="Event type"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="e.g. Wedding, Birthday, Anniversary"
          />
          {createMutation.isError && (
            <p className="text-sm text-danger">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create website"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreate(false)}
            >
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
