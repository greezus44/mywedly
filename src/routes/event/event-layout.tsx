import { useParams, useOutletContext, Outlet, NavLink, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, Badge } from "../../components/ui";
import { cn } from "../../lib/utils";

export interface EventContextValue {
  event: UserEvent;
  eventId: string;
}

export function useEventContext(): EventContextValue {
  return useOutletContext<EventContextValue>();
}

const navTabs = [
  { label: "Cover", to: "" },
  { label: "Login", to: "login" },
  { label: "Home", to: "home" },
  { label: "Events", to: "events" },
  { label: "Guests", to: "guests" },
  { label: "Guest Groups", to: "groups" },
  { label: "RSVP", to: "rsvp" },
  { label: "Schedule", to: "timeline" },
  { label: "Pages", to: "pages" },
  { label: "Theme", to: "theme" },
  { label: "Share", to: "sharing" },
  { label: "Analytics", to: "analytics" },
  { label: "Settings", to: "settings" },
];

export function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: event, isLoading, isError, refetch } = useQuery({
    queryKey: ["event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId!)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { data, error } = await supabase
        .from("events")
        .update({
          slug: event?.draft_slug,
          name: event?.draft_name,
          theme: event?.draft_theme,
          cover_config: event?.draft_cover_config,
          cover_image: event?.draft_cover_image,
          logo_config: event?.draft_logo_config,
          content: event?.draft_content,
          login_config: event?.draft_login_config,
          sharing_config: event?.draft_sharing_config,
          event_date: event?.draft_event_date,
          event_time: event?.draft_event_time,
          venue: event?.draft_venue,
          address: event?.draft_address,
          event_type: event?.draft_event_type,
          rsvp_deadline: event?.draft_rsvp_deadline,
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
    },
  });

  // CRITICAL: While loading, render a loading spinner — NEVER render <Outlet> with null context
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // CRITICAL: If error, render an error message — NEVER render <Outlet> with null context
  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold text-dash-danger">Failed to load event</p>
        <Button variant="secondary" onClick={() => refetch()}>
          Try again
        </Button>
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold text-dash-text">Event not found</p>
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  // CRITICAL: Only when event is successfully loaded, render <Outlet> with non-null context
  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-dash-border bg-dash-surface/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                ← Dashboard
              </Button>
              <h1 className="text-lg font-semibold text-dash-text">
                {event.draft_name || event.name}
              </h1>
              {event.is_published ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="warning">Draft</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                loading={publishMutation.isPending}
                disabled={publishMutation.isPending}
                onClick={() => publishMutation.mutate()}
              >
                {event.is_published ? "Republish" : "Publish"}
              </Button>
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="flex gap-1 overflow-x-auto scrollbar-thin pb-px">
            {navTabs.map((tab) => (
              <NavLink
                key={tab.label}
                to={tab.to}
                end={tab.to === ""}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-dash-primary/10 text-dash-primary"
                      : "text-dash-muted hover:bg-dash-bg hover:text-dash-text"
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {publishMutation.isSuccess && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Event published successfully!
          </div>
        )}
        {publishMutation.isError && (
          <div className="mb-4 rounded-lg border border-dash-danger/20 bg-dash-danger/5 px-4 py-3 text-sm text-dash-danger">
            Failed to publish: {publishMutation.error instanceof Error ? publishMutation.error.message : "Unknown error"}
          </div>
        )}
        <Outlet context={{ event, eventId: eventId! }} />
      </div>
    </div>
  );
}
