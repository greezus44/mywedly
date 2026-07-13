import { useParams, Link, Outlet } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge, Skeleton, Toast } from "../../components/ui";
import { Image, LogIn, Home, Palette, CalendarCheck, Users, Clock, Share2, BarChart3, Settings, ChevronLeft, Menu, X, Eye } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

/**
 * Event Layout — the admin dashboard wrapper.
 * CRITICAL: This does NOT wrap children in EventThemeProvider.
 * The dashboard always uses fixed gray Tailwind classes for a consistent admin UI.
 * Event theme only applies to guest-facing pages and the preview pane in the theme editor.
 */
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
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function EventLayoutPage() {
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        if (event.draft_event_date !== undefined) updates.event_date = event.draft_event_date;
        if (event.draft_event_time !== undefined) updates.event_time = event.draft_event_time;
        if (event.draft_venue !== undefined) updates.venue = event.draft_venue;
        if (event.draft_address !== undefined) updates.address = event.draft_address;
        if (event.draft_cover_image !== undefined) updates.cover_image = event.draft_cover_image;
        if (event.draft_cover_config !== undefined) updates.cover_config = event.draft_cover_config;
        if (event.draft_login_config !== undefined) updates.login_config = event.draft_login_config;
        if (event.draft_theme !== undefined) updates.theme = event.draft_theme;
        if (event.draft_content !== undefined) updates.content = event.draft_content;
        if (event.draft_slug !== undefined) updates.slug = event.draft_slug;
        if (event.draft_rsvp_deadline !== undefined) updates.rsvp_deadline = event.draft_rsvp_deadline;
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
      {/* Top Bar — fixed dashboard styling, never affected by event theme */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="p-1.5 hover:bg-gray-100 transition-colors rounded"><ChevronLeft className="w-5 h-5 text-gray-600" /></Link>
              <div className="min-w-0"><h1 className="font-heading text-lg truncate text-gray-900">{event.draft_name || event.name}</h1></div>
              <Badge variant={event.is_published ? "success" : "default"}>{event.is_published ? "Published" : "Draft"}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {event.is_published && event.slug && <Link to={`/e/${event.slug}`} target="_blank"><Button size="sm" variant="ghost"><Eye className="w-3.5 h-3.5" /> View Live</Button></Link>}
              <Button size="sm" variant={event.is_published ? "secondary" : "primary"} loading={publishMutation.isPending} onClick={() => publishMutation.mutate()}>{event.is_published ? "Unpublish" : "Publish"}</Button>
              <button className="lg:hidden p-2 hover:bg-gray-100 rounded" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
            </div>
          </div>
          {/* Top Navigation — horizontal tabs, no sidebar */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto pb-px">
            {tabs.map((tab) => { const isActive = location.pathname.endsWith(`/${tab.key}`); return <Link key={tab.key} to={`/event/${eventId}/${tab.key}`} className={cn("flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap transition-colors border-b-2", isActive ? "border-gray-900 text-gray-900 font-medium" : "border-transparent text-gray-500 hover:text-gray-900")}><tab.icon className="w-4 h-4" />{tab.label}</Link>; })}
          </nav>
        </div>
        {mobileMenuOpen && (<nav className="lg:hidden border-t border-gray-200 bg-white overflow-x-auto"><div className="flex gap-1 p-2 overflow-x-auto">{tabs.map((tab) => { const isActive = location.pathname.endsWith(`/${tab.key}`); return <Link key={tab.key} to={`/event/${eventId}/${tab.key}`} onClick={() => setMobileMenuOpen(false)} className={cn("flex items-center gap-2 px-3 py-2 text-sm whitespace-nowrap transition-colors rounded", isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100")}><tab.icon className="w-4 h-4" />{tab.label}</Link>; })}</div></nav>)}
      </div>
      {/* Content — dashboard styling, NOT wrapped in EventThemeProvider */}
      <div className="max-w-7xl mx-auto"><Outlet context={{ event }} /></div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
