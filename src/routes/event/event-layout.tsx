import React from "react";
import { Outlet, NavLink, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, Badge } from "../../components/ui";

export interface EventOutletContext {
  event: UserEvent;
  eventId: string;
}

const NAV_TABS: {
  label: string;
  to: string;
  end?: boolean;
  icon: React.ReactNode;
}[] = [
  {
    label: "Cover",
    to: "",
    end: true,
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" /></svg>,
  },
  {
    label: "Login",
    to: "login",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 20.25 7.5 17.25l-2.25 2.25c-.404.404-.527 1-.43 1.563A6 6 0 011.5 9.75a6 6 0 016-6" /></svg>,
  },
  {
    label: "Home",
    to: "home",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75V15a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v5.25a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75V9.75M8.25 21h8.25" /></svg>,
  },
  {
    label: "Events",
    to: "events",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
  },
  {
    label: "Guests",
    to: "guests",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.353 9.327 9.327 0 00-1.213 2.933zM3.75 18a4.5 4.5 0 01.702-2.395 4.5 4.5 0 014.5-2.105 4.5 4.5 0 014.5 2.105A4.5 4.5 0 0113.5 18a4.5 4.5 0 01-4.5 4.5A4.5 4.5 0 013.75 18z" /></svg>,
  },
  {
    label: "Guest Groups",
    to: "groups",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.059 2.772m0 0a3 3 0 00-4.682 2.72 8.986 8.986 0 003.74.479m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
  },
  {
    label: "RSVP",
    to: "rsvp",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    label: "Schedule",
    to: "schedule",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 2.25H3v-6.75a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 11.25v6.75z" /></svg>,
  },
  {
    label: "Pages",
    to: "pages",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9-9 0 00-9-9z" /></svg>,
  },
  {
    label: "Theme",
    to: "theme",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .717-.077 1.418-.224 2.093m-15.686-4.582A8.959 8.959 0 003 12c0 1.64.436 3.18 1.2 4.527" /></svg>,
  },
  {
    label: "Sharing",
    to: "sharing",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>,
  },
  {
    label: "Analytics",
    to: "analytics",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 13.125 4.5 13.125 6 15c1.5 1.875 3 4.5 3 4.5s3-9 9-12" /></svg>,
  },
  {
    label: "Settings",
    to: "settings",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.75 6.75 0 01-.011.267c-.027.379.138.752.43.96l1.005.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.57 6.57 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.93 6.93 0 010-.267c.007-.378-.138-.752-.43-.96l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

export function useEventContext(): EventOutletContext {
  return (window as unknown as { __eventContext?: EventOutletContext }).__eventContext ?? { event: null as unknown as UserEvent, eventId: "" };
}

export default function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: event, isLoading, error, refetch } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Event not found");
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("No event");
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
          rsvp_deadline: event.draft_rsvp_deadline ?? event.rsvp_deadline,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  // CRITICAL: Never render Outlet with null context
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg p-4">
        <ErrorState
          title="Failed to load event"
          message={error?.message ?? "Event not found"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Only render Outlet when event is successfully loaded
  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-lg p-2 text-dash-muted hover:bg-dash-bg hover:text-dash-text"
              aria-label="Back to dashboard"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-semibold text-dash-text">
                {event.draft_name ?? event.name}
              </h1>
              <div className="flex items-center gap-2">
                {event.is_published ? (
                  <Badge variant="success">Published</Badge>
                ) : (
                  <Badge variant="warning">Draft</Badge>
                )}
                {event.draft_slug && (
                  <span className="text-xs text-dash-muted">
                    /e/{event.draft_slug}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => publishMutation.mutate()}
            loading={publishMutation.isPending}
          >
            {event.is_published ? "Update Live" : "Publish"}
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        {/* Sidebar nav */}
        <nav className="border-b border-dash-border bg-dash-surface lg:h-[calc(100vh-4rem)] lg:w-56 lg:border-b-0 lg:border-r">
          <div className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
            {NAV_TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-dash-primary text-dash-primary-fg"
                      : "text-dash-muted hover:bg-dash-bg hover:text-dash-text"
                  )
                }
              >
                {tab.icon}
                {tab.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 lg:h-[calc(100vh-4rem)] lg:overflow-auto">
          <Outlet context={{ event, eventId: eventId! } satisfies EventOutletContext} />
        </main>
      </div>
    </div>
  );
}
