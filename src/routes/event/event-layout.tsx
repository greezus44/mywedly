import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { cn } from "../../lib/utils";

const TABS = [
  { to: "", label: "Cover", end: true },
  { to: "login", label: "Login" },
  { to: "home", label: "Home" },
  { to: "events", label: "Events" },
  { to: "guests", label: "Guests" },
  { to: "groups", label: "Guest Groups" },
  { to: "rsvp", label: "RSVP" },
  { to: "timeline", label: "Schedule" },
  { to: "pages", label: "Pages" },
  { to: "theme", label: "Theme" },
  { to: "sharing", label: "Sharing" },
  { to: "analytics", label: "Analytics" },
  { to: "settings", label: "Settings" },
] as const;

export default function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) setUserId(session?.user.id ?? null);
    })();
    return () => { mounted = false; };
  }, []);

  const { data: event, isLoading, error } = useQuery({
    queryKey: ["user_events", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId!)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("Event not loaded");
      const payload: Record<string, any> = {
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
      };
      const { data, error } = await supabase
        .from("user_events")
        .update(payload)
        .eq("id", event.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["user_events", userId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <ErrorState message={error ? "Failed to load event." : "Event not found."} onRetry={() => navigate("/dashboard")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-sm text-dash-muted hover:text-dash-text">
                ← Dashboard
              </Link>
              <span className="text-dash-border">/</span>
              <h1 className="text-lg font-semibold text-dash-text">
                {event.draft_name || event.name}
              </h1>
              {event.is_published ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="warning">Draft</Badge>
              )}
            </div>
            <Button
              size="sm"
              loading={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              Publish
            </Button>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="sticky top-16 z-30 border-b border-dash-border bg-dash-surface">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
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
        </div>
      </nav>

      {/* Outlet content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet context={{ event }} />
      </main>
    </div>
  );
}
