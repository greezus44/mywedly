import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui";
import { LoadingSpinner, ErrorState, EmptyState, Modal } from "../components/ui";
import { SiteHeader } from "../components/site/SiteHeader";
import { slugify, isValidSlug } from "../lib/theme";

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [eventType, setEventType] = useState("wedding");
  const [formError, setFormError] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const { data: session } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  if (sessionLoading && session !== undefined) {
    setSessionLoading(false);
    if (session?.user) setUserId(session.user.id);
  }

  const { data: events, isLoading, isError, error } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session?.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", sess.session.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
    enabled: !!session?.user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session?.user) throw new Error("Not authenticated");
      const finalSlug = slug.trim() || slugify(name);
      if (!isValidSlug(finalSlug)) throw new Error("Invalid slug");
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: sess.session.user.id,
          draft_name: name.trim(),
          draft_slug: finalSlug,
          draft_event_type: eventType,
          is_published: false,
          is_archived: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as UserEvent;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowCreate(false);
      setName(""); setSlug(""); setEventType("wedding"); setFormError(null);
      navigate(`/event/${event.id}`);
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Failed to create event"),
  });

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setFormError("Event name is required"); return; }
    setFormError(null);
    createMutation.mutate();
  };

  if (isLoading || sessionLoading) return <div className="flex min-h-screen items-center justify-center bg-dash-bg"><LoadingSpinner /></div>;
  if (isError) return <div className="flex min-h-screen items-center justify-center bg-dash-bg px-4"><ErrorState title="Failed to load events" message={error instanceof Error ? error.message : "Unknown error"} /></div>;

  return (
    <div className="min-h-screen bg-dash-bg">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dash-text">Your Events</h1>
          <Button onClick={() => setShowCreate(true)}>Create Event</Button>
        </div>
        {!events || events.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="Create your first event to get started."
            action={<Button onClick={() => setShowCreate(true)}>Create Event</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                className="block rounded-lg border border-dash-border bg-dash-surface p-4 transition-shadow hover:shadow-md"
              >
                <h3 className="font-semibold text-dash-text">{event.draft_name || event.name || "Untitled Event"}</h3>
                <p className="mt-1 text-sm text-dash-muted">{event.draft_event_type || event.event_type || "—"}</p>
                {event.draft_event_date && <p className="mt-1 text-sm text-dash-muted">{event.draft_event_date}</p>}
                <div className="mt-3">
                  {event.is_published
                    ? <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Published</span>
                    : <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Draft</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setFormError(null); }} title="Create Event">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Event Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John & Jane's Wedding" required autoFocus />
          <Input label="Slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Auto-generated from name" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Event Type</label>
            <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none">
              <option value="wedding">Wedding</option>
              <option value="engagement">Engagement</option>
              <option value="reception">Reception</option>
              <option value="other">Other</option>
            </select>
          </div>
          {formError && <p className="text-sm text-dash-danger">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); setFormError(null); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
