import { NavLink, Outlet, useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState } from "../../components/ui";

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

export interface EventContextValue {
  event: UserEvent;
  eventId: string;
}

export function useEventContext(): EventContextValue {
  return useOutletContext<EventContextValue>();
}

export function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
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
      const { error } = await supabase
        .from("user_events")
        .update({
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
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  // CRITICAL: Never render Outlet with null context
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <ErrorState message={error instanceof Error ? error.message : "Failed to load event"} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      <header className="border-b border-dash-border bg-dash-surface">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-dash-text">
                {event.draft_name || event.name}
              </h1>
              {event.is_published ? (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  Draft
                </span>
              )}
            </div>
            <Button
              size="sm"
              loading={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              {event.is_published ? "Update Published" : "Publish"}
            </Button>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-1">
            {navTabs.map((tab) => (
              <NavLink
                key={tab.label}
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

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet context={{ event, eventId: eventId! }} />
      </main>
    </div>
  );
}
