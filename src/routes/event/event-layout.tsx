import React, { useState } from "react";
import { NavLink, useParams, Outlet, useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, Badge } from "../../components/ui";

export interface EventContext {
  event: UserEvent;
  eventId: string;
}

export function useEventContext(): EventContext {
  return useOutletContext<EventContext>();
}

const NAV_TABS = [
  { label: "Cover", to: "", end: true },
  { label: "Login", to: "login" },
  { label: "Home", to: "home" },
  { label: "Events", to: "events" },
  { label: "Guests", to: "guests" },
  { label: "Guest Groups", to: "groups" },
  { label: "RSVP", to: "rsvp" },
  { label: "Schedule", to: "schedule" },
  { label: "Pages", to: "pages" },
  { label: "Theme", to: "theme" },
  { label: "Sharing", to: "sharing" },
  { label: "Analytics", to: "analytics" },
  { label: "Settings", to: "settings" },
];

export default function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [publishError, setPublishError] = useState<string | null>(null);

  const {
    data: event,
    isLoading,
    isError,
    error,
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
      if (!data) throw new Error("Event not found.");
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("Event not loaded.");
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setPublishError(null);
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
    onError: (err: Error) => {
      setPublishError(err.message);
    },
  });

  // CRITICAL: While loading, render spinner and DO NOT render <Outlet>
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  // CRITICAL: On error, render error message and DO NOT render <Outlet>
  if (isError || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg px-4">
        <ErrorState
          message={error?.message ?? "Event not found."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // CRITICAL: Only render <Outlet> when event is successfully loaded
  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-sm text-dash-muted hover:text-dash-text">
              ← Dashboard
            </Link>
            <span className="text-dash-border">/</span>
            <span className="truncate text-sm font-semibold text-dash-text">{event.name}</span>
            {event.is_published ? (
              <Badge variant="success">Published</Badge>
            ) : (
              <Badge variant="warning">Draft</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {publishError && (
              <span className="text-xs text-dash-danger">{publishError}</span>
            )}
            {event.slug && (
              <a
                href={`${window.location.origin}/e/${event.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-dash-muted hover:text-dash-text"
              >
                View Site ↗
              </a>
            )}
            <Button
              size="sm"
              loading={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              {event.is_published ? "Republish" : "Publish"}
            </Button>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="mx-auto max-w-7xl overflow-x-auto px-4">
          <div className="flex gap-1 pb-1">
            {NAV_TABS.map((tab) => (
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
      </header>

      {/* Content — Outlet with non-null context */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet context={{ event, eventId: eventId! }} />
      </main>
    </div>
  );
}
