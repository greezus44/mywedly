import { useState } from "react";
import { useParams, NavLink, Outlet, Link } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, Modal } from "../../components/ui";

interface EventContextValue { event: UserEvent; eventId: string; }

export function useEventContext(): EventContextValue {
  return useOutletContext<EventContextValue>();
}

// FIX #6: "Wishes" tab added to dashboard navigation
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
  { label: "Wishes", to: "wishes" },
  { label: "Theme", to: "theme" },
  { label: "Share", to: "sharing" },
  { label: "Analytics", to: "analytics" },
  { label: "Settings", to: "settings" },
];

export function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [showPublish, setShowPublish] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { data: event, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events").select("*").eq("id", eventId).maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("Event not loaded");
      const { error } = await supabase
        .from("user_events")
        .update({
          slug: event.draft_slug,
          name: event.draft_name,
          theme: event.draft_theme ?? event.theme,
          cover_config: event.draft_cover_config ?? event.cover_config,
          cover_image: event.draft_cover_image ?? event.cover_image,
          logo_config: event.draft_logo_config ?? event.logo_config,
          content: event.draft_content ?? event.content,
          login_config: event.draft_login_config ?? event.login_config,
          sharing_config: event.draft_sharing_config ?? event.sharing_config,
          event_date: event.draft_event_date ?? event.event_date,
          event_time: event.draft_event_time ?? event.event_time,
          venue: event.draft_venue ?? event.venue,
          address: event.draft_address ?? event.address,
          event_type: event.draft_event_type ?? event.event_type,
          rsvp_deadline: event.draft_rsvp_deadline ?? event.rsvp_deadline,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["published-event"] });
      setShowPublish(false);
    },
  });

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner /></div>;
  if (isError) return <div className="flex min-h-screen items-center justify-center px-4"><ErrorState title="Failed to load event" message={error instanceof Error ? error.message : "Unexpected error"} onRetry={() => refetch()} /></div>;
  if (!event || !eventId) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center"><h1 className="text-2xl font-bold text-dash-text">Event not found</h1><Link to="/dashboard"><Button variant="secondary">Back to Dashboard</Button></Link></div>;

  return (
    <div className="min-h-screen bg-dash-bg">
      <header className="sticky top-0 z-30 border-b border-dash-border bg-dash-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm font-medium text-dash-muted hover:text-dash-text">← Dashboard</Link>
            <div className="hidden h-6 w-px bg-dash-border sm:block" />
            <h1 className="hidden text-lg font-semibold text-dash-text sm:block">{event.draft_name || event.name || "Untitled Event"}</h1>
          </div>
          <div className="flex items-center gap-2">
            {event.is_published && (
              <a href={`${window.location.origin}/e/${event.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-dash-primary hover:underline">
                View Live →
              </a>
            )}
            <Button size="sm" onClick={() => setShowPublish(true)} disabled={publishMutation.isPending}>
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
        <nav className="mx-auto hidden max-w-7xl items-center gap-1 px-4 pb-2 sm:flex sm:px-6 overflow-x-auto scrollbar-thin">
          {navTabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === ""}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${isActive ? "bg-dash-primary/10 text-dash-primary" : "text-dash-muted hover:bg-dash-bg hover:text-dash-text"}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className="sm:hidden">
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="flex w-full items-center justify-between border-b border-dash-border bg-dash-surface px-4 py-2.5 text-sm font-medium text-dash-text"
        >
          Navigation
          <svg className={`h-4 w-4 transition-transform ${mobileNavOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {mobileNavOpen && (
          <nav className="flex flex-col gap-1 border-b border-dash-border bg-dash-surface px-4 py-2">
            {navTabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === ""}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-dash-primary/10 text-dash-primary" : "text-dash-muted hover:bg-dash-bg hover:text-dash-text"}`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet context={{ event, eventId } satisfies EventContextValue} />
      </main>

      <Modal open={showPublish} onClose={() => setShowPublish(false)} title="Publish Website">
        <div className="space-y-4">
          <p className="text-sm text-dash-muted">This will publish all current draft changes. Guests will see the updated content immediately.</p>
          {publishMutation.isError && (
            <p className="text-sm text-dash-danger">{publishMutation.error instanceof Error ? publishMutation.error.message : "Failed to publish"}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowPublish(false)}>Cancel</Button>
            <Button onClick={() => publishMutation.mutate()} loading={publishMutation.isPending}>Publish Now</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
