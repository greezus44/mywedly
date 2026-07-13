import { useParams, Link, Outlet, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge, Skeleton, Toast } from "../../components/ui";
import { Image, LogIn, Home, Palette, CalendarCheck, Users, Clock, Share2, BarChart3, Settings, ChevronLeft, Eye } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

const tabs = [
  { key: "cover", label: "Cover", icon: Image },
  { key: "login", label: "Login", icon: LogIn },
  { key: "home", label: "Home", icon: Home },
  { key: "theme", label: "Theme", icon: Palette },
  { key: "events", label: "Events", icon: CalendarCheck },
  { key: "guests", label: "Guests", icon: Users },
  { key: "groups", label: "Groups", icon: Users },
  { key: "rsvp", label: "RSVP", icon: CalendarCheck },
  { key: "timeline", label: "Timeline", icon: Clock },
  { key: "sharing", label: "Sharing", icon: Share2 },
  { key: "analytics", label: "Stats", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function EventLayoutPage() {
  const { eventId } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId).maybeSingle(); if (error) throw error; return data as UserEvent | null; },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) return;
      const newPublished = !event.is_published;
      const updates: Record<string, unknown> = { is_published: newPublished, updated_at: new Date().toISOString() };
      if (newPublished) {
        updates.published_at = new Date().toISOString();
        if (event.draft_name) updates.name = event.draft_name;
        if (event.draft_event_type) updates.event_type = event.draft_event_type;
        if (event.draft_event_date !== null) updates.event_date = event.draft_event_date;
        if (event.draft_event_time !== null) updates.event_time = event.draft_event_time;
        if (event.draft_venue !== null) updates.venue = event.draft_venue;
        if (event.draft_address !== null) updates.address = event.draft_address;
        if (event.draft_cover_image !== null) updates.cover_image = event.draft_cover_image;
        if (event.draft_cover_config !== null) updates.cover_config = event.draft_cover_config;
        if (event.draft_login_config !== null) updates.login_config = event.draft_login_config;
        if (event.draft_theme !== null) updates.theme = event.draft_theme;
        if (event.draft_content !== null) updates.content = event.draft_content;
        if (event.draft_slug !== null) updates.slug = event.draft_slug;
        if (event.draft_rsvp_deadline !== null) updates.rsvp_deadline = event.draft_rsvp_deadline;
      }
      const { error } = await supabase.from("user_events").update(updates).eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event", eventId] }); setToast(event?.is_published ? "Event unpublished" : "Event published"); },
    onError: (err: Error) => { setToast(`Failed to publish: ${err.message}`); },
  });

  if (isLoading) return <div className="min-h-screen bg-gray-50"><div className="h-16 border-b border-gray-200 bg-white" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  if (!event) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><p className="text-sm text-gray-500 mb-4">Event not found</p><Link to="/dashboard"><Button>Back to Dashboard</Button></Link></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/dashboard" className="p-1.5 hover:bg-gray-100 transition-colors rounded shrink-0"><ChevronLeft className="w-5 h-5 text-gray-600" /></Link>
              <div className="min-w-0"><h1 className="font-heading text-lg truncate text-gray-900">{event.draft_name || event.name}</h1></div>
              <Badge variant={event.is_published ? "success" : "default"}>{event.is_published ? "Published" : "Draft"}</Badge>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {event.is_published && event.slug && <Link to={`/e/${event.slug}`} target="_blank"><Button size="sm" variant="ghost"><Eye className="w-3.5 h-3.5" /> <span className="hidden sm:inline">View Live</span></Button></Link>}
              <Button size="sm" variant={event.is_published ? "secondary" : "primary"} loading={publishMutation.isPending} onClick={() => publishMutation.mutate()}>{event.is_published ? "Unpublish" : "Publish"}</Button>
            </div>
          </div>

          {/* Wrapping navigation — all tabs visible, wraps to multiple rows, no horizontal scroll */}
          <nav className="flex flex-wrap items-center gap-1 py-2 border-t border-gray-100">
            {tabs.map((tab) => {
              const isActive = location.pathname.endsWith(`/${tab.key}`);
              return (
                <Link
                  key={tab.key}
                  to={`/event/${eventId}/${tab.key}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all rounded-full",
                    isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto"><Outlet context={{ event }} /></div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
