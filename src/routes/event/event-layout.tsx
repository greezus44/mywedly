import React, { useEffect } from "react";
import {
  NavLink,
  Outlet,
  useParams,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui";
import { cn } from "../../lib/utils";

export interface EventContextType {
  event: UserEvent;
  eventId: string;
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

export function useEventContext(): EventContextType {
  const ctx = useOutletContext<EventContextType>();
  if (!ctx) {
    throw new Error("useEventContext must be used within EventLayout");
  }
  return ctx;
}

export function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
  });

  const {
    data: event,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Website not found");
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
      queryClient.invalidateQueries({ queryKey: ["user-event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
    },
  });

  // Redirect to dashboard if not authenticated
  useEffect(() => {
    if (session === null) {
      navigate("/auth");
    }
  }, [session, navigate]);

  // CRITICAL: While loading, render spinner and DO NOT render Outlet
  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // CRITICAL: If error, render error message and DO NOT render Outlet
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg px-4">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">
            {error instanceof Error ? error.message : "Failed to load website"}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Only render Outlet when event is successfully loaded — context is NEVER null
  return (
    <div className="min-h-screen bg-dash-bg flex flex-col">
      {/* Top bar */}
      <header className="border-b border-dash-border bg-dash-surface sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-dash-muted hover:text-dash-text transition-colors shrink-0"
            >
              ← Dashboard
            </button>
            <span className="text-dash-border">/</span>
            <h1 className="text-base font-semibold text-dash-text truncate">
              {event.draft_name || event.name}
            </h1>
            {event.is_published ? (
              <span className="shrink-0 inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                Published
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Draft
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              loading={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              Publish
            </Button>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="mx-auto max-w-7xl px-4 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1 pb-2">
            {NAV_TABS.map((tab) => (
              <NavLink
                key={tab.label}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
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

      {/* Content — Outlet context is guaranteed non-null here */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6">
        <Outlet context={{ event, eventId: eventId! }} />
      </main>
    </div>
  );
}
