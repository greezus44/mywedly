import { Outlet, NavLink, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { cn } from "../../lib/utils";

interface EventContextValue {
  event: UserEvent;
  eventId: string;
}

const EventContext = createContext<EventContextValue | null>(null);

export function useEventContext(): EventContextValue {
  const ctx = useContext(EventContext);
  if (!ctx) {
    throw new Error("useEventContext must be used within an EventLayout");
  }
  return ctx;
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

  const { data: event, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Event not found");
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("No event to publish");
      const { error } = await supabase
        .from("user_events")
        .update({
          slug: event.draft_slug,
          name: event.draft_name,
          theme: event.draft_theme,
          cover_config: event.draft_cover_config,
          cover_image: event.draft_cover_image,
          logo_config: event.draft_logo_config,
          content: event.draft_content,
          login_config: event.draft_login_config,
          sharing_config: event.draft_sharing_config,
          event_date: event.draft_event_date,
          event_time: event.draft_event_time,
          venue: event.draft_venue,
          address: event.draft_address,
          event_type: event.draft_event_type,
          rsvp_deadline: event.draft_rsvp_deadline,
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

  // CRITICAL: While loading, render spinner and DO NOT render <Outlet>
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // CRITICAL: On error, render error message and DO NOT render <Outlet>
  if (isError || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg px-4">
        <ErrorState
          message={error?.message ?? "Failed to load event"}
          onRetry={refetch}
        />
      </div>
    );
  }

  // CRITICAL: Only render <Outlet> when event is successfully loaded
  return (
    <div className="min-h-screen bg-dash-bg">
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="text-sm text-dash-muted hover:text-dash-text"
              >
                ← Dashboard
              </button>
              <span className="text-dash-border">/</span>
              <h1 className="truncate text-base font-semibold text-dash-text">
                {event.draft_name || event.name}
              </h1>
              {event.is_published ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="warning">Draft</Badge>
              )}
            </div>
            <Button
              size="sm"
              loading={publishMutation.isPending}
              disabled={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              {event.is_published ? "Update Published" : "Publish"}
            </Button>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
            {navTabs.map((tab) => (
              <NavLink
                key={tab.label}
                to={tab.to}
                end={tab.to === ""}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-dash-primary text-dash-primary-fg"
                      : "text-dash-muted hover:bg-dash-bg hover:text-dash-text",
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {publishMutation.isError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-dash-danger">
            {publishMutation.error?.message ?? "Failed to publish event"}
          </div>
        )}
        {publishMutation.isSuccess && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Event published successfully!
          </div>
        )}
        <Outlet context={{ event, eventId: eventId! }} />
      </main>
    </div>
  );
}

export default EventLayout;

export type { EventContextValue };
