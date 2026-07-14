import { NavLink, Outlet, useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { LoadingSpinner } from "../../components/ui";
import { ErrorState } from "../../components/ui";
import { cn } from "../../lib/utils";

export interface EventContext {
  event: UserEvent;
  eventId: string;
}

export function useEventContext(): EventContext {
  return useOutletContext<EventContext>();
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
  const navigate = useNavigate();

  const { data: event, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Event not found.");
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <ErrorState
          title="Failed to load event"
          message={error instanceof Error ? error.message : "An unexpected error occurred."}
          onRetry={() => {
            if (error instanceof Error && error.message === "Event not found.") navigate("/dashboard");
            else refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-dash-border bg-dash-surface/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-md p-1.5 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text"
                title="Back to dashboard"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-dash-text">
                  {event.draft_name || event.name || "Untitled Event"}
                </h1>
                <p className="text-xs text-dash-muted">
                  {event.is_published ? "Published" : "Draft"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="border-t border-dash-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="scrollbar-thin flex gap-1 overflow-x-auto py-2">
              {navTabs.map((tab) => {
                const to = tab.to === "" ? `/event/${eventId}` : `/event/${eventId}/${tab.to}`;
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
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet context={{ event, eventId: eventId! }} />
      </main>
    </div>
  );
}
