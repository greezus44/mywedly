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

  const {
    data: event,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("Event not loaded");
      const { error } = await supabase
        .from("user_events")
        .update({
          name: event.draft_name ?? event.name,
          event_type: event.draft_event_type ?? event.event_type,
          event_date: event.draft_event_date ?? event.event_date,
          event_time: event.draft_event_time ?? event.event_time,
          venue: event.draft_venue ?? event.venue,
          address: event.draft_address ?? event.address,
          cover_image: event.draft_cover_image ?? event.cover_image,
          cover_config: event.draft_cover_config ?? event.cover_config,
          login_config: event.draft_login_config ?? event.login_config,
          theme: event.draft_theme ?? event.theme,
          logo_config: event.draft_logo_config ?? event.logo_config,
          content: event.draft_content ?? event.content,
          sharing_config: event.draft_sharing_config ?? event.sharing_config,
          slug: event.draft_slug ?? event.slug,
          rsvp_deadline: event.draft_rsvp_deadline ?? event.rsvp_deadline,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-5">
            <Skeleton className="h-7 w-64 mb-4" />
            <div className="flex gap-1">
              {[...Array(11)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load event"}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight truncate">
                {event.draft_name || event.name || "Untitled Event"}
              </h1>
              {event.is_published ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="warning">Draft</Badge>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => publishMutation.mutate()}
              loading={publishMutation.isPending}
              disabled={event.is_published}
            >
              <Rocket className="w-4 h-4" />
              {event.is_published ? "Published" : "Publish"}
            </Button>
          </div>

          <nav className="flex gap-1 overflow-x-auto pb-px scrollbar-thin">
            {TABS.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `whitespace-nowrap px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet context={{ event }} />
      </main>
    </div>
  );
}
