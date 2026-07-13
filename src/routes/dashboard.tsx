import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify } from "../lib/theme";
import { Button } from "../components/ui/Button";
import { Input, Select, Modal, LoadingSpinner, ErrorState, EmptyState, Card, Badge } from "../components/ui";
import { formatDate } from "../lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("wedding");
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) { navigate("/auth", { replace: true }); return; }
      setUserId(session.user.id);
      setAuthChecking(false);
    })();
    return () => { mounted = false; };
  }, [navigate]);

  const { data: events, isLoading, error } = useQuery({
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
          template_id: "blank",
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user_events", userId] });
      setCreateOpen(false);
      setNewName("");
      setNewType("wedding");
      setCreateError(null);
      navigate(`/event/${data.id}`);
    },
    onError: (err) => {
      setCreateError(err instanceof Error ? err.message : "Failed to create website.");
    },
  });

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">Your Websites</h1>
            <p className="mt-1 text-sm text-dash-muted">Manage your invitation websites.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>Create Website</Button>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : error ? (
            <ErrorState message="Failed to load your websites." />
          ) : !events || events.length === 0 ? (
            <EmptyState
              title="No websites yet"
              description="Create your first invitation website to get started."
              action={<Button onClick={() => setCreateOpen(true)}>Create Website</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Link key={event.id} to={`/event/${event.id}`}>
                  <Card className="cursor-pointer transition-shadow hover:shadow-md">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-dash-text">{event.draft_name || event.name}</h3>
                      {event.is_published ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant="warning">Draft</Badge>
                      )}
                    </div>
                    <p className="text-sm text-dash-muted">{event.draft_event_type || event.event_type}</p>
                    {event.draft_event_date && (
                      <p className="mt-2 text-xs text-dash-muted">{formatDate(event.draft_event_date)}</p>
                    )}
                    {event.draft_venue && (
                      <p className="mt-1 text-xs text-dash-muted">{event.draft_venue}</p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setCreateError(null); }} title="Create Website">
        <div className="space-y-4">
          <Input
            label="Website name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Sarah & John's Wedding"
            autoFocus
          />
          <Select label="Event type" value={newType} onChange={(e) => setNewType(e.target.value)}>
            <option value="wedding">Wedding</option>
            <option value="birthday">Birthday</option>
            <option value="corporate">Corporate</option>
            <option value="other">Other</option>
          </Select>
          {createError && (
            <div className="rounded-md border border-dash-danger/30 bg-red-50 px-4 py-3 text-sm text-dash-danger">
              {createError}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setCreateOpen(false); setCreateError(null); }}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()} disabled={!newName.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
