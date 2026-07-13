import React from "react";
import { useParams, Outlet, Link, NavLink } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui";
import { ArrowLeft, Globe } from "lucide-react";

const NAV_TABS = [
  { path: "cover", label: "Cover" },
  { path: "login", label: "Login" },
  { path: "home", label: "Home" },
  { path: "theme", label: "Theme" },
  { path: "events", label: "Events" },
  { path: "guests", label: "Guests" },
  { path: "groups", label: "Groups" },
  { path: "rsvp", label: "RSVP" },
  { path: "timeline", label: "Timeline" },
  { path: "pages", label: "Pages" },
  { path: "sharing", label: "Sharing" },
  { path: "analytics", label: "Analytics" },
  { path: "settings", label: "Settings" },
];

export default function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, any> = { is_published: true, published_at: new Date().toISOString() };
      if (event?.draft_name) updates.name = event.draft_name;
      if (event?.draft_event_type) updates.event_type = event.draft_event_type;
      if (event?.draft_event_date !== undefined) updates.event_date = event.draft_event_date;
      if (event?.draft_event_time !== undefined) updates.event_time = event.draft_event_time;
      if (event?.draft_venue !== undefined) updates.venue = event.draft_venue;
      if (event?.draft_address !== undefined) updates.address = event.draft_address;
      if (event?.draft_cover_image !== undefined) updates.cover_image = event.draft_cover_image;
      if (event?.draft_cover_config) updates.cover_config = event.draft_cover_config;
      if (event?.draft_login_config) updates.login_config = event.draft_login_config;
      if (event?.draft_theme) updates.theme = event.draft_theme;
      if (event?.draft_logo_config) updates.logo_config = event.draft_logo_config;
      if (event?.draft_content) updates.content = event.draft_content;
      if (event?.draft_sharing_config) updates.sharing_config = event.draft_sharing_config;
      if (event?.draft_slug) updates.slug = event.draft_slug;
      if (event?.draft_rsvp_deadline !== undefined) updates.rsvp_deadline = event.draft_rsvp_deadline;
      const { data, error } = await supabase.from("user_events").update(updates).eq("id", eventId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err: any) => alert("Failed to publish: " + (err.message || "Unknown error")),
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").update({ is_published: false }).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err: any) => alert("Failed to unpublish: " + (err.message || "Unknown error")),
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-dash-muted">Loading...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center text-red-600">Event not found</div>;

  return (
    <div className="min-h-screen bg-dash-bg">
      <header className="sticky top-0 z-40 bg-dash-surface border-b border-dash-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-dash-muted hover:text-dash-text"><ArrowLeft className="w-5 h-5" /></Link>
              <h1 className="text-lg font-semibold text-dash-text">{event.name}</h1>
              <Badge variant={event.is_published ? "success" : "default"}>{event.is_published ? "Published" : "Draft"}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {event.is_published && event.slug && (
                <a href={`/e/${event.slug}`} target="_blank" rel="noopener" className="text-sm text-teal-700 hover:underline flex items-center gap-1"><Globe className="w-4 h-4" /> View</a>
              )}
              {event.is_published ? (
                <Button variant="secondary" size="sm" onClick={() => unpublishMutation.mutate()} loading={unpublishMutation.isPending}>Unpublish</Button>
              ) : (
                <Button size="sm" onClick={() => publishMutation.mutate()} loading={publishMutation.isPending}><Globe className="w-4 h-4" /> Publish</Button>
              )}
            </div>
          </div>
          <nav className="flex flex-wrap gap-1 pb-2">
            {NAV_TABS.map((tab) => (
              <NavLink key={tab.path} to={`/event/${eventId}/${tab.path}`} className={({ isActive }) => `px-3 py-1.5 rounded-full text-sm transition-colors ${isActive ? "bg-dash-primary text-white" : "text-dash-muted hover:bg-dash-primary-light hover:text-dash-primary"}`}>
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet context={{ event }} />
      </main>
    </div>
  );
}
