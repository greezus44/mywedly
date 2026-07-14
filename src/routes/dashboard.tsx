import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify, isValidSlug } from "../lib/theme";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Input";
import {
  Card,
  Badge,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from "../components/ui";
import { formatDate } from "../lib/utils";

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Anniversary",
  "Engagement",
  "Corporate",
  "Other",
];

async function fetchEvents(): Promise<UserEvent[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_events")
    .select("*")
    .eq("creator_id", userData.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserEvent[];
}

async function createEvent(input: {
  name: string;
  event_type: string;
  draft_slug: string;
}): Promise<UserEvent> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_events")
    .insert({
      creator_id: userData.user.id,
      name: input.name,
      draft_name: input.name,
      event_type: input.event_type,
      draft_event_type: input.event_type,
      draft_slug: input.draft_slug,
      is_published: false,
      is_archived: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as UserEvent;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Wedding");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: events, isLoading, isError, error } = useQuery({
    queryKey: ["user-events"],
    queryFn: fetchEvents,
  });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      setShowCreate(false);
      setNewName("");
      setCreateError(null);
      navigate(`/event/${event.id}`);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!newName.trim()) {
      setCreateError("Please enter a name.");
      return;
    }
    const draftSlug = slugify(newName);
    if (!isValidSlug(draftSlug)) {
      setCreateError("Could not generate a valid URL slug from this name.");
      return;
    }
    createMutation.mutate({ name: newName.trim(), event_type: newType, draft_slug: draftSlug });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg px-4">
        <ErrorState
          title="Failed to load your websites"
          description={error instanceof Error ? error.message : "Please try again."}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["user-events"] })}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      <header className="border-b border-dash-border bg-dash-surface">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-dash-primary">MyWedly</Link>
          <Button onClick={() => setShowCreate(true)}>Create Website</Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-dash-text mb-6">Your Websites</h1>

        {events && events.length === 0 ? (
          <EmptyState
            title="No websites yet"
            description="Create your first event website to get started."
            icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
            action={<Button onClick={() => setShowCreate(true)}>Create Website</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events?.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-dash-text">
                      {event.draft_name || event.name || "Untitled"}
                    </h3>
                    {event.is_published ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">Published</Badge>
                    ) : (
                      <Badge>Draft</Badge>
                    )}
                  </div>
                  <p className="text-sm text-dash-muted mb-2">{event.draft_event_type || event.event_type}</p>
                  {event.draft_event_date && (
                    <p className="text-sm text-dash-muted">{formatDate(event.draft_event_date)}</p>
                  )}
                  {event.draft_slug && (
                    <p className="text-xs text-dash-muted mt-3 font-mono">/e/{event.draft_slug}</p>
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
            label="Website name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Jane & John's Wedding"
            autoFocus
          />
          <Select label="Event type" value={newType} onChange={(e) => setNewType(e.target.value)}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          {newName && (
            <div className="text-sm text-dash-muted">
              URL: <span className="font-mono">/e/{slugify(newName) || "..."}</span>
            </div>
          )}
          {createError && (
            <p className="text-sm text-dash-danger">{createError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
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
