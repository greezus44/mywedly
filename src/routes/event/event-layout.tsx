import { useState, useEffect, useMemo, useCallback } from "react";
import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Globe, Users, Calendar, Share2, Settings,
  ChevronDown, LogOut, Menu, X, Plus, Search, Copy, Archive, Trash2,
  Image as ImageIcon, BarChart3, User,
} from "lucide-react";
import { supabase, UserEvent } from "../../lib/supabase";
import { cn, formatDateShort } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { EVENT_TYPES } from "../../lib/supabase";

interface NavChild { label: string; path: string; }
interface NavItem { label: string; icon: React.ReactNode; children?: NavChild[]; }

const EVENT_NAV: NavItem[] = [
  {
    label: "Website", icon: <Globe className="w-4 h-4" />,
    children: [
      { label: "Cover Page", path: "cover" },
      { label: "Sign In", path: "login" },
      { label: "Home", path: "home" },
      { label: "Theme", path: "theme" },
      { label: "Extra Pages", path: "extra-pages" },
    ],
  },
  {
    label: "Guests", icon: <Users className="w-4 h-4" />,
    children: [
      { label: "Guest List", path: "guests" },
      { label: "Guest Groups", path: "guest-groups" },
      { label: "RSVP", path: "rsvp" },
    ],
  },
  {
    label: "Schedule", icon: <Calendar className="w-4 h-4" />,
    children: [
      { label: "Timeline", path: "timeline" },
      { label: "Activities", path: "activities" },
    ],
  },
  {
    label: "Sharing", icon: <Share2 className="w-4 h-4" />,
    children: [
      { label: "QR Codes", path: "qr-codes" },
      { label: "Invitations", path: "invitations" },
      { label: "Analytics", path: "analytics" },
    ],
  },
  {
    label: "Settings", icon: <Settings className="w-4 h-4" />,
    children: [
      { label: "Branding", path: "branding" },
      { label: "Domain", path: "domain" },
      { label: "Integrations", path: "integrations" },
    ],
  },
];

function findActiveParent(pathname: string, eventId: string): number {
  const base = `/event/${eventId}/`;
  for (let i = EVENT_NAV.length - 1; i >= 0; i--) {
    if (EVENT_NAV[i].children) {
      for (const child of EVENT_NAV[i].children!) {
        if (pathname === base + child.path || pathname.startsWith(base + child.path + "/")) return i;
      }
    }
  }
  return 0;
}

function findActiveChild(pathname: string, eventId: string, parentIndex: number): string | null {
  const base = `/event/${eventId}/`;
  const item = EVENT_NAV[parentIndex];
  if (!item.children) return null;
  for (const child of item.children) {
    if (pathname === base + child.path || pathname.startsWith(base + child.path + "/")) return child.path;
  }
  return item.children[0]?.path || null;
}

export default function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: event, isLoading: eventLoading, error: eventError } = useQuery<UserEvent | null>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId).maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!eventId,
    staleTime: 30000,
  });

  const { data: allEvents } = useQuery<UserEvent[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from("user_events").select("*").eq("is_archived", false).order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as UserEvent[];
    },
    staleTime: 30000,
  });

  const activeParent = useMemo(() => findActiveParent(location.pathname, eventId || ""), [location.pathname, eventId]);
  const activeChild = useMemo(() => findActiveChild(location.pathname, eventId || "", activeParent), [location.pathname, eventId, activeParent]);
  const currentParent = EVENT_NAV[activeParent];

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate("/login");
  }, [navigate, queryClient]);

  const handlePublish = useCallback(async () => {
    if (!event) return;
    setPublishing(true);
    setPublishMsg(null);
    try {
      const updates: Record<string, any> = { is_published: true, published_at: new Date().toISOString() };
      const draftFields: (keyof UserEvent)[] = ["draft_name","draft_event_type","draft_event_date","draft_event_time","draft_venue","draft_address","draft_cover_image","draft_cover_config","draft_login_config","draft_theme","draft_logo_config","draft_content","draft_sharing_config"];
      for (const draft of draftFields) {
        const published = draft.replace("draft_", "");
        if (event[draft] !== null && event[draft] !== undefined) updates[published] = event[draft];
      }
      const { error } = await supabase.from("user_events").update(updates).eq("id", event.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setPublishMsg({ type: "success", text: "Website published!" });
    } catch (err: any) {
      setPublishMsg({ type: "error", text: err.message || "Failed to publish" });
    } finally {
      setPublishing(false);
      setTimeout(() => setPublishMsg(null), 4000);
    }
  }, [event, eventId, queryClient]);

  const filteredEvents = useMemo(() => {
    if (!allEvents) return [];
    if (!searchQuery) return allEvents;
    return allEvents.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allEvents, searchQuery]);

  const eventTypeLabel = useMemo(() => {
    const type = event?.draft_event_type || event?.event_type || "other";
    return EVENT_TYPES.find(t => t.id === type)?.label || type;
  }, [event]);

  if (eventLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );

  if (eventError || (!eventLoading && !event)) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-4">Event not found or you don't have access.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    </div>
  );

  return (
    <div className="dash-root min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        {/* Top bar */}
        <div className="px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold">E</div>
              <span className="font-semibold text-gray-900 text-sm hidden sm:inline">Event Studio</span>
            </button>

            {/* Event Switcher */}
            <div className="relative ml-2">
              <button
                onClick={() => setSwitcherOpen(!switcherOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{event?.name}</span>
                <Badge>{eventTypeLabel}</Badge>
                <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", switcherOpen && "rotate-180")} />
              </button>

              {switcherOpen && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search events..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto scrollbar-thin">
                    {filteredEvents.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No events found</div>
                    ) : (
                      filteredEvents.map(ev => (
                        <button
                          key={ev.id}
                          onClick={() => { navigate(`/event/${ev.id}/cover`); setSwitcherOpen(false); }}
                          className={cn("w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors text-left", ev.id === eventId && "bg-gray-50")}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{ev.name}</div>
                            <div className="text-xs text-gray-400">{ev.event_date ? formatDateShort(ev.event_date) : "No date"}</div>
                          </div>
                          {ev.is_published && <span className="text-xs text-green-600">Published</span>}
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-100">
                    <button onClick={() => { navigate("/dashboard?create=true"); setSwitcherOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Plus className="w-4 h-4" /> Create New Event
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {event && <Button variant="primary" size="sm" onClick={handlePublish} loading={publishing}>Publish</Button>}
            <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="w-4 h-4" /><span className="hidden sm:inline">Sign Out</span></Button>
          </div>
        </div>

        {/* Primary nav */}
        <nav className="border-t border-gray-100 px-4 lg:px-6">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar h-11">
            {EVENT_NAV.map((item, index) => (
              <button
                key={item.label}
                onClick={() => { if (item.children?.[0]) navigate(`/event/${eventId}/${item.children[0].path}`); }}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium whitespace-nowrap rounded-md transition-colors", activeParent === index ? "text-gray-900 bg-gray-100" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50")}
              >
                {item.icon}{item.label}
                <ChevronDown className={cn("w-3 h-3 transition-transform", activeParent === index && "rotate-180")} />
              </button>
            ))}
          </div>
        </nav>

        {/* Secondary nav */}
        {currentParent?.children && (
          <nav className="border-t border-gray-100 px-4 lg:px-6 bg-gray-50">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar h-10">
              {currentParent.children.map(child => (
                <button
                  key={child.path}
                  onClick={() => navigate(`/event/${eventId}/${child.path}`)}
                  className={cn("px-3 py-1 text-sm whitespace-nowrap rounded-md transition-colors", activeChild === child.path ? "text-gray-900 font-semibold bg-white shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700")}
                >
                  {child.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-30 bg-white overflow-y-auto pb-20">
          <div className="p-4 space-y-1">
            {EVENT_NAV.map((item, index) => (
              <div key={item.label}>
                <button onClick={() => { if (item.children?.[0]) { navigate(`/event/${eventId}/${item.children[0].path}`); setMobileMenuOpen(false); } }} className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium", activeParent === index ? "bg-gray-100 text-gray-900" : "text-gray-600")}>
                  {item.icon}{item.label}
                </button>
                {item.children && activeParent === index && (
                  <div className="ml-8 mt-1 space-y-0.5">
                    {item.children.map(child => (
                      <button key={child.path} onClick={() => { navigate(`/event/${eventId}/${child.path}`); setMobileMenuOpen(false); }} className={cn("w-full text-left px-3 py-1.5 rounded-md text-sm", activeChild === child.path ? "text-gray-900 font-medium bg-gray-100" : "text-gray-500")}>{child.label}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publish toast */}
      {publishMsg && <div className={cn("fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-white text-sm font-medium shadow-lg animate-slide-up", publishMsg.type === "success" ? "bg-green-600" : "bg-red-600")}>{publishMsg.text}</div>}

      <main className="flex-1 p-4 lg:p-6"><Outlet context={{ event }} /></main>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{children}</span>;
}
