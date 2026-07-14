import { NavLink, Outlet, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, Badge } from "../../components/ui";

const NAV_TABS = [
  { label: "Cover", to: "", end: true },
  { label: "Login", to: "login", end: false },
  { label: "Home", to: "home", end: false },
  { label: "Events", to: "events", end: false },
  { label: "Guests", to: "guests", end: false },
  { label: "Guest Groups", to: "groups", end: false },
  { label: "RSVP", to: "rsvp", end: false },
  { label: "Schedule", to: "schedule", end: false },
  { label: "Pages", to: "pages", end: false },
  { label: "Theme", to: "theme", end: false },
  { label: "Sharing", to: "sharing", end: false },
  { label: "Analytics", to: "analytics", end: false },
  { label: "Settings", to: "settings", end: false },
];

export default function EventLayout() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("Event not loaded");
      const { data, error } = await supabase
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
        .eq("id", eventId)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
    },
  });

  // CRITICAL: Do NOT render Outlet while loading or on error.
  // This prevents child routes from receiving a null outlet context.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <ErrorState
          title="Event not found"
          description="This website may have been deleted or you don't have access."
          onRetry={() => navigate("/dashboard")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-muted hover:text-foreground"
                >
                  ← Dashboard
                </button>
                <span className="text-muted">/</span>
                <h1 className="text-lg font-semibold text-foreground">
                  {event.draft_name ?? event.name}
                </h1>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={event.is_published ? "success" : "warning"}>
                  {event.is_published ? "Published" : "Draft"}
                </Badge>
                {event.slug && (
                  <span className="text-xs text-muted">/{event.slug}</span>
                )}
              </div>
            </div>
            <Button
              onClick={() => publishMutation.mutate()}
              loading={publishMutation.isPending}
            >
              Publish
            </Button>
          </div>

          {/* Nav tabs */}
          <nav className="mt-4 flex flex-wrap gap-1">
            {NAV_TABS.map((tab) => (
              <NavLink
                key={tab.label}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted hover:bg-muted/20 hover:text-foreground"
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Outlet — context is always valid here */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Outlet context={{ event, eventId: eventId! }} />
      </div>
    </div>
  );
}
