import React from "react";
import {
  useParams,
  useNavigate,
  Outlet,
  NavLink,
  useOutletContext as useRRDOutletContext,
} from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState } from "../../components/ui";

export interface EventOutletContext {
  event: UserEvent;
  eventId: string;
}

export function useOutletContext(): EventOutletContext {
  return useRRDOutletContext<EventOutletContext>();
}

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
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: event,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["user_event", eventId],
    enabled: !!eventId,
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
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("No event");
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
        .eq("id", event.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["user_events"] });
    },
  });

  // CRITICAL: While loading, render spinner and DO NOT render Outlet
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // CRITICAL: On error, render error state and DO NOT render Outlet
  if (isError || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg p-4">
        <ErrorState
          title="Event not found"
          description={
            error instanceof Error ? error.message : "Failed to load event"
          }
          onRetry={() => navigate("/dashboard")}
        />
      </div>
    );
  }

  // CRITICAL: Only on success, render Outlet with non-null context
  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-dash-muted hover:text-dash-text"
              aria-label="Back to dashboard"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-semibold text-dash-text">
                {event.draft_name ?? event.name}
              </h1>
              <p className="text-xs text-dash-muted">
                {event.is_published ? "Published" : "Draft"}
              </p>
            </div>
          </div>
          <Button
            onClick={() => publishMutation.mutate()}
            loading={publishMutation.isPending}
            size="sm"
          >
            {event.is_published ? "Update Published" : "Publish"}
          </Button>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="sticky top-16 z-30 border-b border-dash-border bg-dash-surface">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin py-1">
            {NAV_TABS.map((tab) => (
              <NavLink
                key={tab.label}
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
        </div>
      </nav>

      {/* Outlet with non-null context */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet context={{ event, eventId: eventId! }} />
      </main>
    </div>
  );
}
