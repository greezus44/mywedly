import React from "react";
import { useParams, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { LoadingSpinner, ErrorState, Badge, Button } from "../../components/ui";
import { cn } from "../../lib/utils";

export interface EventContextValue {
  event: UserEvent;
  eventId: string;
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

export function useEventContext(): EventContextValue {
  const ctx = (React.useContext(EventContext) ?? null) as EventContextValue | null;
  if (!ctx) throw new Error("useEventContext must be used within an EventLayout");
  return ctx;
}

const EventContext = React.createContext<EventContextValue | null>(null);

export function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: event,
    isLoading,
    isError,
    refetch,
  } = useQuery({
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
      if (!event) throw new Error("Event not loaded");
      const updates: Record<string, unknown> = {
        is_published: true,
        published_at: new Date().toISOString(),
        // Copy draft fields to published
        name: event.draft_name,
        event_type: event.draft_event_type,
        event_date: event.draft_event_date,
        event_time: event.draft_event_time,
        venue: event.draft_venue,
        address: event.draft_address,
        cover_image: event.draft_cover_image,
        cover_config: event.draft_cover_config as Json,
        theme: event.draft_theme as Json,
        logo_config: event.draft_logo_config as Json,
        content: event.draft_content as Json,
        login_config: event.draft_login_config as Json,
        sharing_config: event.draft_sharing_config as Json,
        slug: event.draft_slug,
        rsvp_deadline: event.draft_rsvp_deadline,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("user_events")
        .update(updates)
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  // While loading: render spinner and DO NOT render Outlet
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  // If error: render error message and DO NOT render Outlet
  if (isError || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <ErrorState
          title="Event not found"
          message="This invitation website could not be loaded."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Only when event is successfully loaded: provide context and render Outlet
  return (
    <EventContext.Provider value={{ event, eventId: eventId! }}>
      <div className="min-h-screen bg-dash-bg">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="text-sm text-dash-muted hover:text-dash-text"
              >
                ← Dashboard
              </button>
              <span className="text-dash-border">/</span>
              <span className="font-semibold text-dash-text">{event.draft_name}</span>
              {event.is_published ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="warning">Draft</Badge>
              )}
            </div>
            <Button
              size="sm"
              loading={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              {event.is_published ? "Republish" : "Publish"}
            </Button>
          </div>
        </header>

        {/* Nav tabs */}
        <nav className="sticky top-14 z-30 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex gap-1 overflow-x-auto scrollbar-thin">
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
                        : "text-dash-muted hover:bg-dash-bg hover:text-dash-text",
                    )
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="mx-auto max-w-7xl px-4 py-6">
          <Outlet context={{ event, eventId: eventId! } satisfies EventContextValue} />
        </main>
      </div>
    </EventContext.Provider>
  );
}
