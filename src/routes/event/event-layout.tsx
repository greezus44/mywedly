import React, { useCallback } from "react";
import { NavLink, Outlet, useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState } from "../../components/ui";

export interface EventContext {
  event: UserEvent;
  eventId: string;
}

export function useEventContext(): EventContext {
  return useOutletContext<EventContext>();
}

const NAV_TABS = [
  { label: "Cover", to: "" },
  { label: "Login", to: "login" },
  { label: "Home", to: "home" },
  { label: "Events", to: "events" },
  { label: "Guests", to: "guests" },
  { label: "Guest Groups", to: "groups" },
  { label: "RSVP", to: "rsvp" },
  { label: "Schedule", to: "schedule" },
  { label: "Pages", to: "pages" },
  { label: "Theme", to: "theme" },
  { label: "Share", to: "share" },
  { label: "Analytics", to: "analytics" },
  { label: "Settings", to: "settings" },
];

export const EventLayout: React.FC = () => {
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
      if (!eventId) throw new Error("Missing event ID");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Event not found");
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!eventId || !event) throw new Error("No event");
      const updates: Record<string, unknown> = {
        name: event.draft_name,
        event_type: event.draft_event_type,
        event_date: event.draft_event_date,
        event_time: event.draft_event_time,
        venue: event.draft_venue,
        address: event.draft_address,
        cover_image: event.draft_cover_image,
        cover_config: event.draft_cover_config,
        theme: event.draft_theme,
        logo_config: event.draft_logo_config,
        content: event.draft_content,
        login_config: event.draft_login_config,
        sharing_config: event.draft_sharing_config,
        slug: event.draft_slug,
        rsvp_deadline: event.draft_rsvp_deadline,
        is_published: true,
        published_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("user_events")
        .update(updates)
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const handlePublish = useCallback(() => {
    publishMutation.mutate();
  }, [publishMutation]);

  // CRITICAL: While loading, render a loading spinner and DO NOT render <Outlet>
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner size="lg" label="Loading event..." />
      </div>
    );
  }

  // CRITICAL: If error, render an error message and DO NOT render <Outlet>
  if (isError || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg px-4">
        <ErrorState
          title="Event not found"
          message="This event may have been deleted or you don't have access."
          onRetry={() => {
            refetch();
            navigate("/dashboard");
          }}
          className="max-w-md"
        />
      </div>
    );
  }

  // CRITICAL: Only when the event is successfully loaded, render <Outlet> with non-null context
  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-md p-1.5 text-dash-muted hover:bg-dash-bg hover:text-dash-text"
                aria-label="Back to dashboard"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-base font-semibold text-dash-text truncate max-w-[200px] sm:max-w-xs">
                {event.draft_name || event.name || "Untitled Event"}
              </h1>
              {event.is_published ? (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-dash-bg px-2 py-0.5 text-xs font-medium text-dash-muted border border-dash-border">
                  Draft
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={handlePublish}
                loading={publishMutation.isPending}
                disabled={publishMutation.isPending}
              >
                {event.is_published ? "Update Live" : "Publish"}
              </Button>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex gap-1 overflow-x-auto pb-1">
            {NAV_TABS.map((tab) => (
              <NavLink
                key={tab.to}
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

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet context={{ event, eventId: eventId! }} />
      </main>
    </div>
  );
};
