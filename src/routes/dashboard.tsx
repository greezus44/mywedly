import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { slugify } from "../lib/utils";

export function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);

  const userQuery = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["user_events", userQuery.data?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("creator_id", userQuery.data!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
    enabled: !!userQuery.data?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const user = userQuery.data;
      if (!user) throw new Error("Not signed in");
      const name = "Untitled Event";
      const slug = slugify(name);
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: user.id,
          name,
          draft_name: name,
          slug,
          draft_slug: slug,
          template_id: "default",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onMutate: () => setCreating(true),
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["user_events", userQuery.data?.id] });
      navigate(`/event/${id}`);
    },
    onSettled: () => setCreating(false),
  });

  if (userQuery.isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  }
  if (!userQuery.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">Please sign in to view your dashboard.</p>
        <Link to="/auth"><Button>Sign in</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-800">MyWedly</h1>
        <Button onClick={() => createMutation.mutate()} disabled={creating}>
          {creating ? "Creating…" : "Create New Event"}
        </Button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Events</h2>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading events…</p>
        ) : events && events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                className="block p-5 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow"
              >
                {event.draft_cover_image || event.cover_image ? (
                  <img
                    src={event.draft_cover_image ?? event.cover_image ?? ""}
                    alt={event.draft_name ?? event.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400 text-sm">
                    No cover image
                  </div>
                )}
                <h3 className="font-medium text-gray-800">{event.draft_name ?? event.name}</h3>
                <p className="text-sm text-gray-500">
                  {event.draft_event_type ?? event.event_type ?? "Event"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {event.is_published ? "Published" : "Draft"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500 mb-4">You don't have any events yet.</p>
            <Button onClick={() => createMutation.mutate()} disabled={creating}>
              {creating ? "Creating…" : "Create your first event"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
