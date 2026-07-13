import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { cn } from "../../lib/utils";

const NAV_TABS = [
  { label: "Cover", to: "", end: true },
  { label: "Login", to: "login", end: false },
  { label: "Home", to: "home", end: false },
  { label: "Events", to: "events", end: false },
  { label: "Guests", to: "guests", end: false },
  { label: "Groups", to: "groups", end: false },
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
  const [publishing, setPublishing] = useState(false);

  const { data: event, isLoading, isError, refetch } = useQuery({
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
          login_config: event.draft_login_config ?? event.login_config,
          theme: event.draft_theme ?? event.theme,
          logo_config: event.draft_logo_config ?? event.logo_config,
          content: event.draft_content ?? event.content,
          sharing_config: event.draft_sharing_config ?? event.sharing_config,
          slug: event.draft_slug ?? event.slug,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onMutate: () => setPublishing(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setPublishing(false);
    },
    onError: () => setPublishing(false),
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-dash-muted">Website not found.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-dash-bg">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-dash-border bg-dash-surface px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-dash-muted hover:text-dash-text"
          >
            ← Dashboard
          </button>
          <span className="text-dash-border">|</span>
          <h1 className="text-sm font-semibold text-dash-text">
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
          onClick={() => publishMutation.mutate()}
          loading={publishing}
        >
          Publish
        </Button>
      </header>

      {/* Nav tabs */}
      <nav className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-dash-border bg-dash-surface px-4 scrollbar-thin">
        {NAV_TABS.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
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

      {/* Outlet */}
      <div className="flex-1 overflow-hidden">
        <Outlet context={{ event }} />
      </div>
    </div>
  );
}
