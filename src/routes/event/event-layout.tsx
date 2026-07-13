import { useParams, NavLink, Outlet } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Skeleton, ErrorState, Badge } from "../../components/ui";
import { Rocket } from "lucide-react";

const TABS = [
  { label: "Cover", path: "cover" },
  { label: "Login", path: "login" },
  { label: "Home", path: "home" },
  { label: "Theme", path: "theme" },
  { label: "Branding", path: "branding" },
  { label: "Guests", path: "guests" },
  { label: "RSVP", path: "rsvp" },
  { label: "Timeline", path: "timeline" },
  { label: "Sharing", path: "sharing" },
  { label: "Analytics", path: "analytics" },
  { label: "Settings", path: "settings" },
];

export default function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const { data: event, isLoading, error, refetch } = useQuery({
    queryKey: ["event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .single();
      if (error) throw error;
      return data as UserEvent;
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("No event loaded");
      const { error } = await supabase
        .from("user_events")
        .update({
          name: event.draft_name || event.name,
          event_type: event.draft_event_type || event.event_type,
          event_date: event.draft_event_date,
          event_time: event.draft_event_time,
          venue: event.draft_venue,
          address: event.draft_address,
          cover_image: event.draft_cover_image,
          cover_config: event.draft_cover_config,
          login_config: event.draft_login_config,
          theme: event.draft_theme,
          logo_config: event.draft_logo_config,
          content: event.draft_content,
          sharing_config: event.draft_sharing_config,
          slug: event.draft_slug || event.slug,
          rsvp_deadline: event.draft_rsvp_deadline,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <Skeleton key={tab.path} className="h-8 w-20 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load event"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {event.draft_name || event.name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="info">{event.draft_event_type || event.event_type}</Badge>
              {event.is_published ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="default">Draft</Badge>
              )}
            </div>
          </div>
          <Button
            onClick={() => publishMutation.mutate()}
            loading={publishMutation.isPending}
            disabled={event.is_published && !publishMutation.isPending}
            size="sm"
          >
            <Rocket className="w-4 h-4" />
            {event.is_published ? "Republish" : "Publish"}
          </Button>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {TABS.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet context={{ event }} />
      </main>
    </div>
  );
}
