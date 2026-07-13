import React, { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink, Outlet } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui";
import { cn } from "../../lib/utils";

const NAV_TABS = [
  { path: "", label: "Cover", end: true },
  { path: "login", label: "Login" },
  { path: "home", label: "Home" },
  { path: "events", label: "Events" },
  { path: "guests", label: "Guests" },
  { path: "groups", label: "Guest Groups" },
  { path: "rsvp", label: "RSVP" },
  { path: "timeline", label: "Schedule" },
  { path: "pages", label: "Pages" },
  { path: "theme", label: "Theme" },
  { path: "sharing", label: "Sharing" },
  { path: "analytics", label: "Analytics" },
  { path: "settings", label: "Settings" },
];

export default function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/auth");
    });
  }, [navigate]);

  const { data: event, isLoading } = useQuery({
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
      setPublishing(true);
      const updates: Record<string, any> = {
        is_published: true,
        published_at: new Date().toISOString(),
        name: event?.draft_name || event?.name,
        event_type: event?.draft_event_type || event?.event_type,
        event_date: event?.draft_event_date || event?.event_date,
        event_time: event?.draft_event_time || event?.event_time,
        venue: event?.draft_venue || event?.venue,
        address: event?.draft_address || event?.address,
        cover_image: event?.draft_cover_image || event?.cover_image,
        cover_config: event?.draft_cover_config || event?.cover_config,
        login_config: event?.draft_login_config || event?.login_config,
        theme: event?.draft_theme || event?.theme,
        logo_config: event?.draft_logo_config || event?.logo_config,
        content: event?.draft_content || event?.content,
        sharing_config: event?.draft_sharing_config || event?.sharing_config,
        slug: event?.draft_slug || event?.slug,
        rsvp_deadline: event?.draft_rsvp_deadline || event?.rsvp_deadline,
      };

      const { data, error } = await supabase
        .from("user_events")
        .update(updates)
        .eq("id", eventId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setPublishing(false);
    },
    onError: () => setPublishing(false),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dash-bg flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-dash-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-dash-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-dash-muted">Website not found.</p>
          <Button className="mt-4" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-bg">
      <div className="sticky top-0 z-30 border-b border-dash-border bg-dash-surface/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/dashboard")} className="text-dash-muted hover:text-dash-text">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-dash-text">{event.name}</h1>
              {event.is_published ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="default">Draft</Badge>
              )}
            </div>
            <Button
              loading={publishing}
              onClick={() => publishMutation.mutate()}
            >
              {event.is_published ? "Republish" : "Publish"}
            </Button>
          </div>
          <nav className="flex gap-1 overflow-x-auto scrollbar-thin pb-px">
            {NAV_TABS.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap px-3 py-2.5 text-sm font-medium border-b-2 transition-colors",
                    isActive
                      ? "border-dash-primary text-dash-primary"
                      : "border-transparent text-dash-muted hover:text-dash-text",
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Outlet context={{ event }} />
      </div>
    </div>
  );
}
