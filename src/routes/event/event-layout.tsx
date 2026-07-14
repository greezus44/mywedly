import React from "react";
import {
  NavLink,
  Outlet,
  useParams,
  useNavigate,
  Link,
  useOutletContext,
} from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { cn } from "../../lib/utils";

interface EventContextValue {
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

async function fetchEvent(eventId: string): Promise<UserEvent> {
  const { data, error } = await supabase
    .from("user_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Event not found");
  return data as UserEvent;
}

export function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: event, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEvent(eventId!),
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("No event loaded");
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
          theme: event.draft_theme ?? event.theme,
          logo_config: event.draft_logo_config ?? event.logo_config,
          content: event.draft_content ?? event.content,
          login_config: event.draft_login_config ?? event.login_config,
          sharing_config: event.draft_sharing_config ?? event.sharing_config,
          slug: event.draft_slug ?? event.slug,
          rsvp_deadline: event.draft_rsvp_deadline ?? event.rsvp_deadline,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq("id", event.id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // CRITICAL: While loading, render spinner and DO NOT render Outlet
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  // CRITICAL: If error, render error message and DO NOT render Outlet
  if (isError || !event || !eventId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg px-4">
        <ErrorState
          title="Event not found"
          message={error instanceof Error ? error.message : "Failed to load event"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // CRITICAL: Only render Outlet with non-null context when event is successfully loaded
  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-dash-muted hover:text-dash-primary">
              ← Dashboard
            </Link>
            <div className="h-4 w-px bg-dash-border" />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-dash-text">
                {event.draft_name || event.name}
              </span>
              {event.is_published ? (
                <Badge color="success">Published</Badge>
              ) : (
                <Badge color="warning">Draft</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              loading={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              {event.is_published ? "Republish" : "Publish"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="sticky top-16 z-20 border-b border-dash-border bg-dash-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin py-2">
            {navTabs.map((tab) => (
              <NavLink
                key={tab.label}
                to={tab.to}
                end={tab.to === ""}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-dash-primary text-dash-primary-fg"
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
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet context={{ event, eventId: eventId! }} />
      </main>
    </div>
  );
}

export function useEventContext(): EventContextValue {
  return useOutletContext<EventContextValue>();
}
