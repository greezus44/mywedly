import React from "react";
import { NavLink, Outlet, useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState } from "../../components/ui";

export interface EventOutletContext {
  event: UserEvent;
  eventId: string;
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

export default function EventLayout(): React.ReactElement {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-event", eventId],
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
      if (!event) throw new Error("No event loaded");
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
      queryClient.invalidateQueries({ queryKey: ["user-event", eventId] });
    },
  });

  // CRITICAL: While loading, render spinner and DO NOT render Outlet
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  // CRITICAL: On error, render error message and DO NOT render Outlet
  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <ErrorState
          title="Event not found"
          message={error?.message ?? "The event you're looking for could not be loaded."}
          onRetry={() => navigate("/dashboard")}
        />
      </div>
    );
  }

  // CRITICAL: Only render Outlet when event is successfully loaded, with non-null context
  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/dashboard" className="text-dash-muted hover:text-dash-text shrink-0">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-dash-text">
                  {event.draft_name ?? event.name}
                </h1>
                <p className="text-xs text-dash-muted">
                  {event.is_published ? "Published" : "Draft"} • /e/{event.draft_slug ?? event.slug ?? "..."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {event.draft_slug && (
                <a
                  href={`${window.location.origin}/e/${event.draft_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex"
                >
                  <Button variant="ghost" size="sm">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View
                  </Button>
                </a>
              )}
              <Button
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
            {NAV_TABS.map((tab) => (
              <NavLink
                key={tab.label}
                to={tab.to}
                end={tab.end}
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
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet context={{ event, eventId: eventId! } satisfies EventOutletContext} />
      </main>
    </div>
  );
}
