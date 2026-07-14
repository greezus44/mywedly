import { NavLink, useOutletContext, Outlet, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, Badge } from "../../components/ui";

const TABS = [
  { label: "Cover", to: "", end: true },
  { label: "Login", to: "login" },
  { label: "Home", to: "home" },
  { label: "Events", to: "events" },
  { label: "Guests", to: "guests" },
  { label: "Guest Groups", to: "groups" },
  { label: "RSVP", to: "rsvp" },
  { label: "Schedule", to: "timeline" },
  { label: "Pages", to: "pages" },
  { label: "Theme", to: "theme" },
  { label: "Sharing", to: "sharing" },
  { label: "Analytics", to: "analytics" },
  { label: "Settings", to: "settings" },
];

export default function EventLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { eventId } = useOutletContext<{ eventId: string }>();

  const { data: event, isLoading, isError, error } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Event not found");
      return data as UserEvent;
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
          name: event!.draft_name ?? event!.name,
          event_type: event!.draft_event_type ?? event!.event_type,
          event_date: event!.draft_event_date ?? event!.event_date,
          event_time: event!.draft_event_time ?? event!.event_time,
          venue: event!.draft_venue ?? event!.venue,
          address: event!.draft_address ?? event!.address,
          cover_image: event!.draft_cover_image ?? event!.cover_image,
          cover_config: event!.draft_cover_config ?? event!.cover_config,
          login_config: event!.draft_login_config ?? event!.login_config,
          theme: event!.draft_theme ?? event!.theme,
          logo_config: event!.draft_logo_config ?? event!.logo_config,
          content: event!.draft_content ?? event!.content,
          sharing_config: event!.draft_sharing_config ?? event!.sharing_config,
          slug: event!.draft_slug ?? event!.slug,
          rsvp_deadline: event!.draft_rsvp_deadline ?? event!.rsvp_deadline,
        })
        .eq("id", eventId)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ErrorState
          message={error?.message ?? "Event not found"}
          onRetry={() => navigate("/dashboard")}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-dash-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-dash-muted hover:text-dash-text"
            >
              ← Dashboard
            </button>
            <span className="text-dash-border">/</span>
            <h1 className="text-sm font-semibold text-dash-text">{event.name}</h1>
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
          >
            Publish
          </Button>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="sticky top-14 z-30 border-b border-dash-border bg-dash-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 scrollbar-thin">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-dash-primary text-dash-primary-fg"
                    : "text-dash-muted hover:bg-dash-bg hover:text-dash-text"
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1">
        <Outlet context={{ event, eventId }} />
      </main>

      {publishMutation.isError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 shadow-lg">
          Failed to publish: {publishMutation.error instanceof Error ? publishMutation.error.message : "Unknown error"}
        </div>
      )}
      {publishMutation.isSuccess && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 shadow-lg">
          Published successfully!
        </div>
      )}
    </div>
  );
}
