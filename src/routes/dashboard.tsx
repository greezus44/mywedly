import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { formatDate } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import {
  Card,
  Modal,
  Badge,
  EmptyState,
  LoadingSpinner,
  ErrorState,
} from "../components/ui";

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Anniversary",
  "Engagement",
  "Bridal Shower",
  "Baby Shower",
  "Corporate Event",
  "Other",
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Wedding");
  const [newDate, setNewDate] = useState("");

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  });

  const { data: events, isLoading, isError, error } = useQuery({
    queryKey: ["user-events", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const slug = slugify(newName);
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: user!.id,
          name: newName,
          event_type: newType,
          event_date: newDate || null,
          slug,
          draft_slug: slug,
          draft_name: newName,
          draft_event_type: newType,
          draft_event_date: newDate || null,
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
      setNewDate("");
      navigate(`/event/${event.id}`);
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ErrorState message={error?.message} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="border-b border-dash-border bg-dash-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-dash-primary text-dash-primary-fg">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v6m3 0v6m3-6v6m3-6v6M3 21h18M3 10h18M3 7l9-4 9 4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-dash-text">MyWedly</span>
          </Link>
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
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">Your Websites</h1>
            <p className="mt-1 text-sm text-dash-muted">
              Manage your event invitation websites.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>Create Website</Button>
        </div>

        {events && events.length === 0 ? (
          <EmptyState
            title="No websites yet"
            description="Create your first event invitation website to get started."
            action={<Button onClick={() => setShowCreate(true)}>Create Website</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events?.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  <div className="aspect-video bg-dash-bg">
                    {event.cover_image ? (
                      <img
                        src={event.cover_image}
                        alt={event.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-dash-muted">
                        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-dash-text">{event.name}</h3>
                      {event.is_published ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant="warning">Draft</Badge>
                      )}
                    </div>
                    <p className="text-sm text-dash-muted">{event.event_type}</p>
                    {event.event_date && (
                      <p className="mt-1 text-sm text-dash-muted">
                        {formatDate(event.event_date)}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Website">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Event Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Sarah & John's Wedding"
            required
            autoFocus
          />
          <Select label="Event Type" value={newType} onChange={(e) => setNewType(e.target.value)}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <Input
            label="Event Date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          {createMutation.isError && (
            <p className="text-sm text-red-600">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create website."}
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
