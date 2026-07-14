import { NavLink, Outlet, useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, Badge } from "../../components/ui";

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

async function publishEvent(eventId: string): Promise<void> {
  const { data: event, error: fetchError } = await supabase
    .from("user_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!event) throw new Error("Event not found");

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
    .eq("id", eventId);

  if (error) throw error;
}

export interface EventContext {
  event: UserEvent;
  eventId: string;
}

export function useEventContext(): EventContext {
  return useOutletContext<EventContext>();
}

const navTabs = [
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
  { to: "share", label: "Share" },
  { to: "analytics", label: "Analytics" },
  { to: "settings", label: "Settings" },
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
    queryFn: () => fetchEvent(eventId!),
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: () => publishEvent(eventId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  // CRITICAL: While loading, render spinner and DO NOT render Outlet
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dash-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner className="h-8 w-8" />
          <p className="text-sm text-dash-muted">Loading event...</p>
        </div>
      </div>
    );
  }

  // CRITICAL: On error, render error and DO NOT render Outlet
  if (isError || !event) {
    return (
      <div className="min-h-screen bg-dash-bg flex items-center justify-center">
        <ErrorState
          title="Failed to load event"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // CRITICAL: Only render Outlet with non-null context when event is loaded
  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-dash-border bg-dash-surface">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <a href="/dashboard" className="text-dash-muted hover:text-dash-text shrink-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </a>
            <h1 className="text-lg font-semibold text-dash-text truncate">
              {event.draft_name ?? event.name}
            </h1>
            {event.is_published ? (
              <Badge variant="success">Published</Badge>
            ) : (
              <Badge variant="warning">Draft</Badge>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => publishMutation.mutate()}
            loading={publishMutation.isPending}
            disabled={publishMutation.isPending}
          >
            {publishMutation.isPending ? "Publishing..." : event.is_published ? "Republish" : "Publish"}
          </Button>
        </div>

        {/* Nav tabs */}
        <nav className="mx-auto max-w-7xl px-4 pb-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {navTabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-dash-primary text-dash-primary-fg"
                      : "text-dash-text hover:bg-dash-bg"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      {/* Content — Outlet context is NEVER null here */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet context={{ event, eventId: eventId! }} />
      </main>
    </div>
  );
}
