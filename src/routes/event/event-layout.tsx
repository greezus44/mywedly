import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, Badge } from "../../components/ui";

const NAV_TABS = [
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

  const { data: event, isLoading, isError, refetch } = useQuery({
    queryKey: ["user_events", eventId],
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

  // Check auth on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/auth");
    });
  }, [navigate]);

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("No event");
      const draft = event;
      const { error } = await supabase
        .from("user_events")
        .update({
          name: draft.draft_name ?? draft.name,
          event_type: draft.draft_event_type ?? draft.event_type,
          event_date: draft.draft_event_date ?? draft.event_date,
          event_time: draft.draft_event_time ?? draft.event_time,
          venue: draft.draft_venue ?? draft.venue,
          address: draft.draft_address ?? draft.address,
          cover_image: draft.draft_cover_image ?? draft.cover_image,
          cover_config: draft.draft_cover_config ?? draft.cover_config,
          login_config: draft.draft_login_config ?? draft.login_config,
          theme: draft.draft_theme ?? draft.theme,
          logo_config: draft.draft_logo_config ?? draft.logo_config,
          content: draft.draft_content ?? draft.content,
          sharing_config: draft.draft_sharing_config ?? draft.sharing_config,
          slug: draft.draft_slug ?? draft.slug,
          rsvp_deadline: draft.draft_rsvp_deadline ?? draft.rsvp_deadline,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", eventId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (isError || !event) {
    return (
      <div className="min-h-screen bg-dash-bg">
        <ErrorState
          title="Event not found"
          message="This event may not exist or you don't have access."
          onRetry={() => refetch()}
        />
        <div className="text-center">
          <Link to="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-dash-muted hover:text-dash-text">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-lg font-bold text-dash-text">
                {event.draft_name || event.name}
              </h1>
              {event.is_published ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="warning">Draft</Badge>
              )}
            </div>
            <Button
              onClick={() => publishMutation.mutate()}
              loading={publishMutation.isPending}
              size="sm"
            >
              Publish
            </Button>
          </div>
        </div>
        {/* Nav tabs */}
        <nav className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-px">
            {NAV_TABS.map((tab) => (
              <NavLink
                key={tab.to}
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
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet context={{ event }} />
      </main>
    </div>
  );
}
