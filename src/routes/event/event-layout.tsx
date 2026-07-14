import { NavLink, Outlet, useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils";

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
  { to: "sharing", label: "Sharing" },
  { to: "analytics", label: "Analytics" },
  { to: "settings", label: "Settings" },
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

export default function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const { data: event, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["user_events", eventId],
    queryFn: () => fetchEvent(eventId!),
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
          login_config: event.draft_login_config ?? event.login_config,
          theme: event.draft_theme ?? event.theme,
          logo_config: event.draft_logo_config ?? event.logo_config,
          content: event.draft_content ?? event.content,
          sharing_config: event.draft_sharing_config ?? event.sharing_config,
          slug: event.draft_slug ?? event.slug,
          rsvp_deadline: event.draft_rsvp_deadline ?? event.rsvp_deadline,
        })
        .eq("id", event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["user_events"] });
    },
  });

  // CRITICAL: While loading, render spinner WITHOUT Outlet
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // CRITICAL: On error, render error WITHOUT Outlet
  if (isError || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg p-4">
        <ErrorState
          title="Failed to load event"
          message={error instanceof Error ? error.message : "Event not found"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // CRITICAL: Only on success, render Outlet with non-null context
  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <NavLink
              to="/dashboard"
              className="text-sm text-dash-muted hover:text-dash-text"
            >
              ← Dashboard
            </NavLink>
            <span className="text-dash-border">/</span>
            <span className="text-sm font-semibold text-dash-text">
              {event.draft_name ?? event.name}
            </span>
            {event.is_published ? (
              <Badge variant="success">Published</Badge>
            ) : (
              <Badge variant="warning">Draft</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {event.draft_slug && (
              <a
                href={`${window.location.origin}/e/${event.draft_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-dash-muted hover:text-dash-text"
              >
                View site ↗
              </a>
            )}
            <Button
              size="sm"
              onClick={() => publishMutation.mutate()}
              loading={publishMutation.isPending}
            >
              Publish
            </Button>
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="sticky top-14 z-30 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin">
            {navTabs.map((tab) => (
              <NavLink
                key={tab.label}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border-dash-primary text-dash-primary"
                      : "border-transparent text-dash-muted hover:text-dash-text"
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Outlet with context */}
      <Outlet context={{ event, eventId: eventId! } satisfies EventContext} />
    </div>
  );
}
