import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { slugify, isValidSlug } from "../lib/theme";
import { Button } from "../components/ui/Button";
import { Input, Textarea } from "../components/ui";
import {
  Card,
  Badge,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from "../components/ui";
import { formatDateShort } from "../lib/utils";

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const userId = session?.user?.id;

  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ["user-events", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not authenticated");
      const slug = slugify(newTitle);
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          owner_id: userId,
          title: newTitle,
          slug,
          draft_title: newTitle,
          description: newDescription,
          draft_description: newDescription,
          status: "draft",
          cover_config: {},
          theme: {},
          content: {},
          login_config: {},
          sharing_config: {},
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-events", userId] });
      setCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
      setSlugError(null);
    },
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    const slug = slugify(newTitle);
    if (!isValidSlug(slug)) {
      setSlugError("Please enter a valid title (at least 2 characters)");
      return;
    }
    setSlugError(null);
    createMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="border-b border-dash-border bg-dash-surface">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-dash-primary">
            MyWedly
          </Link>
          <div className="flex items-center gap-3">
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

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">Your Websites</h1>
            <p className="mt-1 text-sm text-dash-muted">
              Manage your invitation websites and create new ones.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>Create Website</Button>
        </div>

        {createMutation.isError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Error creating website: {createMutation.error?.message}
          </div>
        )}
        {createMutation.isSuccess && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Website created successfully!
          </div>
        )}

        {events && events.length === 0 ? (
          <EmptyState
            title="No websites yet"
            description="Create your first invitation website to get started."
            icon={<span className="text-5xl">💌</span>}
            action={<Button onClick={() => setCreateOpen(true)}>Create Website</Button>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events?.map((event) => (
              <Card key={event.id} hover className="cursor-pointer" onClick={() => navigate(`/event/${event.id}`)}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-dash-text">
                    {event.draft_title || event.title || "Untitled"}
                  </h3>
                  <Badge variant={event.status === "published" ? "success" : "default"}>
                    {event.status}
                  </Badge>
                </div>
                <p className="text-sm text-dash-muted line-clamp-2">
                  {event.draft_description || event.description || "No description"}
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-dash-muted">
                  <span>📅 {formatDateShort(event.draft_event_date || event.event_date)}</span>
                  <span>🔗 /e/{event.slug}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Website">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="My Wedding Day"
            required
            autoFocus
          />
          <Textarea
            label="Description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="A brief description of your event..."
            rows={3}
          />
          {slugError && <p className="text-xs text-dash-danger">{slugError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
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
