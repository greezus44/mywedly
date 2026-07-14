import { NavLink, Outlet, useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { LoadingSpinner, ErrorState, Button } from "../../components/ui";
import { cn } from "../../lib/utils";

export interface EventOutletContext {
  event: UserEvent;
  eventId: string;
}

export function useEventContext(): EventOutletContext {
  return useOutletContext<EventOutletContext>();
}

const navTabs = [
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
      return data as UserEvent | null;
    },
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("Event not loaded");
      const { data, error } = await supabase
        .from("user_events")
        .update({
          title: event.draft_title || event.title,
          description: event.draft_description,
          event_date: event.draft_event_date,
          event_end_date: event.draft_event_end_date,
          venue_name: event.draft_venue_name,
          venue_address: event.draft_venue_address,
          venue_map_url: event.draft_venue_map_url,
          cover_config: event.cover_config,
          theme: event.theme,
          content: event.content,
          login_config: event.login_config,
          sharing_config: event.sharing_config,
          slug: event.draft_slug ?? event.slug,
          status: "published",
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
    },
  });

  // CRITICAL: Never render Outlet with null context
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg">
        <ErrorState
          title="Event not found"
          description="This event may have been deleted or you don't have access."
          onRetry={() => navigate("/dashboard")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Top bar */}
      <header className="border-b border-dash-border bg-dash-surface">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-dash-muted hover:text-dash-text flex-shrink-0"
              title="Back to dashboard"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-dash-text truncate">
              {event.draft_title || event.title || "Untitled"}
            </h1>
            <span
              className={cn(
                "flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
                event.status === "published"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-dash-border bg-dash-bg text-dash-muted"
              )}
            >
              {event.status}
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => publishMutation.mutate()}
            loading={publishMutation.isPending}
          >
            Publish
          </Button>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="border-b border-dash-border bg-dash-surface">
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

      {/* Outlet with non-null context */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet context={{ event, eventId: eventId! }} />
      </main>
    </div>
  );
}
