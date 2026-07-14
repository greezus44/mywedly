import React from "react";
import { useParams, NavLink, Outlet, useOutletContext, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { Button } from "../../components/ui/Button";

interface EventContextValue {
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
  const queryClient = useQueryClient();

  const {
    data: event,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId!)
        .maybeSingle();
      if (queryError) throw queryError;
      if (!data) throw new Error("Event not found");
      return data as UserEvent;
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("No event loaded");
      const updates: Record<string, Json | boolean | string | null> = {
        is_published: true,
        published_at: new Date().toISOString(),
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
        updated_at: new Date().toISOString(),
      };
      const { error: updateError } = await supabase
        .from("user_events")
        .update(updates)
        .eq("id", eventId!);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  if (!eventId) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg px-4">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load event"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <NavLink to="/dashboard" className="text-sm text-dash-muted hover:text-dash-text">
                ← Dashboard
              </NavLink>
              <span className="text-dash-border">/</span>
              <h1 className="text-lg font-semibold text-dash-text">
                {event.draft_name || event.name}
              </h1>
              {event.is_published ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="default">Draft</Badge>
              )}
            </div>
            <Button
              size="sm"
              variant="primary"
              loading={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              {event.is_published ? "Republish" : "Publish"}
            </Button>
          </div>

          {/* Nav tabs */}
          <nav className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
            {navTabs.map((tab) => (
              <NavLink
                key={tab.to || "index"}
                to={tab.to}
                end={tab.to === ""}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-dash-primary text-dash-primary-fg"
                      : "text-dash-muted hover:bg-dash-bg hover:text-dash-text"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet context={{ event, eventId: eventId! } as EventContextValue} />
      </main>
    </div>
  );
}
