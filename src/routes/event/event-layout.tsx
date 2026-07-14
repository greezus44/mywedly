import React, { createContext, useContext } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    throw new Error("useEventContext must be used within EventLayout");
  }
  return ctx;
}

const NAV_TABS = [
  { to: "", label: "Cover", end: true },
  { to: "login", label: "Login" },
  { to: "home", label: "Home" },
  { to: "events", label: "Events" },
  { to: "guests", label: "Guests" },
  { to: "groups", label: "Guest Groups" },
  { to: "rsvp", label: "RSVP" },
  { to: "schedule", label: "Schedule" },
  { to: "pages", label: "Pages" },
  { to: "theme", label: "Theme" },
  { to: "sharing", label: "Sharing" },
  { to: "analytics", label: "Analytics" },
  { to: "settings", label: "Settings" },
];

export function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: event, isLoading, isError, error } = useQuery({
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
      if (!event) throw new Error("No event loaded");
      const update: Record<string, unknown> = {
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
        is_published: true,
        published_at: new Date().toISOString(),
      };
      const { data, error: updateError } = await supabase
        .from("user_events")
        .update(update)
        .eq("id", event.id)
        .select()
        .maybeSingle();
      if (updateError) throw updateError;
      return data as UserEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  // CRITICAL: While loading, render spinner and DO NOT render <Outlet>
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  // CRITICAL: On error, render error message and DO NOT render <Outlet>
  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load event"}
          onRetry={() => navigate("/dashboard")}
        />
      </div>
    );
  }

  // Only render Outlet when event is successfully loaded — context is never null
  return (
    <div className="min-h-screen bg-dash-bg flex flex-col">
      {/* Top bar */}
      <header className="border-b border-dash-border bg-dash-surface sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-dash-muted hover:text-dash-text flex-shrink-0"
                title="Back to dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-dash-text truncate">
                {event.draft_name || "Untitled"}
              </h1>
              <Badge variant={event.is_published ? "success" : "warning"}>
                {event.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
            <Button
              size="sm"
              onClick={() => publishMutation.mutate()}
              loading={publishMutation.isPending}
            >
              {event.is_published ? "Republish" : "Publish"}
            </Button>
          </div>

          {/* Nav tabs */}
          <nav className="flex gap-1 overflow-x-auto scrollbar-thin -mb-px pb-px">
            {NAV_TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                    isActive
                      ? "border-dash-primary text-dash-primary"
                      : "border-transparent text-dash-muted hover:text-dash-text",
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1">
        <EventContext.Provider value={{ event, eventId: eventId! }}>
          <Outlet context={{ event, eventId: eventId! }} />
        </EventContext.Provider>
      </div>
    </div>
  );
}
