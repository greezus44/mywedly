import React, { createContext, useContext } from "react";
import { NavLink, Outlet, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { cn } from "../../lib/utils";

// ─── Event Context ───────────────────────────────────────────────────────────

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

// ─── Nav Tabs ────────────────────────────────────────────────────────────────

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

// ─── Event Layout ────────────────────────────────────────────────────────────

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
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
    },
  });

  // CRITICAL: While loading, render spinner and DO NOT render Outlet
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner />
      </div>
    );
  }

  // CRITICAL: If error, render error message and DO NOT render Outlet
  if (isError || !event || !eventId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <ErrorState
          title="Event not found"
          message="This event could not be loaded."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // CRITICAL: Only render Outlet with non-null context when event is loaded
  return (
    <EventContext.Provider value={{ event, eventId }}>
      <div className="min-h-screen bg-dash-bg">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-sm text-dash-muted hover:text-dash-text"
                >
                  ← Dashboard
                </button>
                <span className="text-dash-border">/</span>
                <h1 className="text-lg font-semibold text-dash-text">
                  {event.draft_name || event.name}
                </h1>
                {event.is_published ? (
                  <Badge color="success">Published</Badge>
                ) : (
                  <Badge color="warning">Draft</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const slug = event.slug || event.draft_slug;
                    if (slug) {
                      window.open(`/${slug}`, "_blank");
                    }
                  }}
                  disabled={!event.is_published}
                >
                  View Live
                </Button>
                <Button
                  size="sm"
                  onClick={() => publishMutation.mutate()}
                  loading={publishMutation.isPending}
                  disabled={event.is_published && !publishMutation.isPending}
                >
                  {event.is_published ? "Republish" : "Publish"}
                </Button>
              </div>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="mx-auto max-w-7xl overflow-x-auto px-4">
            <div className="flex gap-1 pb-2">
              {navTabs.map((tab) => {
                const to =
                  tab.to === ""
                    ? `/event/${eventId}`
                    : `/event/${eventId}/${tab.to}`;
                return (
                  <NavLink
                    key={tab.label}
                    to={to}
                    end={tab.to === ""}
                    className={({ isActive }) =>
                      cn(
                        "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-dash-primary/10 text-dash-primary"
                          : "text-dash-muted hover:bg-dash-bg hover:text-dash-text"
                      )
                    }
                  >
                    {tab.label}
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-7xl px-4 py-6">
          <Outlet context={{ event, eventId: eventId! }} />
        </main>
      </div>
    </EventContext.Provider>
  );
}
