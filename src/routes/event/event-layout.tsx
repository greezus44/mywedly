import { NavLink, Outlet, useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState } from "../../components/ui";
import { cn } from "../../lib/utils";

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

  const { data: event, isLoading, isError, error } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEvent(eventId!),
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("Event not loaded");
      const { data, error: updateError } = await supabase
        .from("user_events")
        .update({
          slug: event.draft_slug,
          name: event.draft_name,
          theme: event.draft_theme,
          cover_config: event.draft_cover_config,
          cover_image: event.draft_cover_image,
          logo_config: event.draft_logo_config,
          content: event.draft_content,
          login_config: event.draft_login_config,
          sharing_config: event.draft_sharing_config,
          event_date: event.draft_event_date,
          event_time: event.draft_event_time,
          venue: event.draft_venue,
          address: event.draft_address,
          event_type: event.draft_event_type,
          rsvp_deadline: event.draft_rsvp_deadline,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq("id", event.id)
        .select()
        .maybeSingle();
      if (updateError) throw updateError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  // CRITICAL: While loading, render spinner and DO NOT render <Outlet>
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  // CRITICAL: On error, render error message and DO NOT render <Outlet>
  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-bg px-4">
        <ErrorState
          title="Failed to load event"
          description={error instanceof Error ? error.message : "Please try again."}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["event", eventId] })}
        />
      </div>
    );
  }

  // CRITICAL: Only render <Outlet> when event is successfully loaded, with non-null context
  return (
    <div className="min-h-screen bg-dash-bg">
      <header className="border-b border-dash-border bg-dash-surface sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-sm text-dash-muted hover:text-dash-text transition-colors"
              >
                ← Dashboard
              </button>
              <span className="text-dash-border">/</span>
              <span className="text-sm font-semibold text-dash-text truncate max-w-[200px]">
                {event.draft_name || event.name || "Untitled"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {event.is_published ? (
                <Badge>Published</Badge>
              ) : (
                <Badge>Draft</Badge>
              )}
              <Button
                size="sm"
                loading={publishMutation.isPending}
                onClick={() => publishMutation.mutate()}
              >
                {event.is_published ? "Update" : "Publish"}
              </Button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-2 -mb-px">
            {navTabs.map((tab) => (
              <NavLink
                key={tab.label}
                to={tab.to}
                end={tab.to === ""}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-dash-primary text-dash-primary-fg"
                      : "text-dash-muted hover:text-dash-text hover:bg-dash-bg"
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
        {publishMutation.isError && (
          <div className="mb-4 rounded-md bg-dash-danger/10 border border-dash-danger/20 p-3 text-sm text-dash-danger">
            Failed to publish: {publishMutation.error instanceof Error ? publishMutation.error.message : "Unknown error"}
          </div>
        )}
        {publishMutation.isSuccess && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            {event.is_published ? "Website updated successfully!" : "Website published successfully!"}
          </div>
        )}
        <Outlet context={{ event, eventId: eventId! }} />
      </main>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-dash-bg text-dash-muted border border-dash-border">
      {children}
    </span>
  );
}
