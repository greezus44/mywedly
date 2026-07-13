import { Outlet, NavLink, useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent } from "../../lib/supabase";
import { DEFAULT_THEME, DEFAULT_COVER_CONFIG, DEFAULT_LOGIN_CONFIG, DEFAULT_LOGO_CONFIG, DEFAULT_CONTENT, DEFAULT_SHARING_CONFIG } from "../../lib/theme";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Calendar, Users, Share2, Settings, Layout, Check, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

function normalizeEvent(data: any): UserEvent {
  return {
    ...data,
    cover_config: data.cover_config || {},
    login_config: data.login_config || {},
    theme: data.theme || {},
    logo_config: data.logo_config || {},
    content: data.content || {},
    sharing_config: data.sharing_config || {},
    draft_cover_config: data.draft_cover_config || data.cover_config || {},
    draft_login_config: data.draft_login_config || data.login_config || {},
    draft_theme: data.draft_theme || data.theme || {},
    draft_logo_config: data.draft_logo_config || data.logo_config || {},
    draft_content: data.draft_content || data.content || {},
    draft_sharing_config: data.draft_sharing_config || data.sharing_config || {},
  };
}

export default function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [publishing, setPublishing] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const { data: event, isLoading, error } = useQuery<UserEvent | null>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId).maybeSingle();
      if (error) throw error;
      return data ? normalizeEvent(data) : null;
    },
    staleTime: 30000,
  });

  const { data: allEvents } = useQuery<UserEvent[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(normalizeEvent);
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (!switcherOpen) return;
    const handler = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setSwitcherOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [switcherOpen]);

  const handlePublish = async () => {
    if (!event || !eventId) return;
    setPublishing(true);
    try {
      const { error } = await supabase.from("user_events").update({
        cover_config: event.draft_cover_config,
        login_config: event.draft_login_config,
        theme: event.draft_theme,
        logo_config: event.draft_logo_config,
        content: event.draft_content,
        sharing_config: event.draft_sharing_config,
        event_date: event.draft_event_date,
        event_time: event.draft_event_time,
        venue: event.draft_venue,
        address: event.draft_address,
        is_published: true,
        published_at: new Date().toISOString(),
      }).eq("id", eventId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    } catch (err) {
      console.error("Publish failed:", err);
    } finally {
      setPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-gray-500">Could not load this event.</p>
        <Link to="/dashboard" className="text-sm text-black underline">Back to dashboard</Link>
      </div>
    );
  }

  const filteredEvents = (allEvents || []).filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  const tabs = [
    { section: "Website", items: [
      { label: "Cover", path: "cover" },
      { label: "Sign In", path: "login" },
      { label: "Home", path: "home" },
      { label: "Theme", path: "theme" },
      { label: "Branding", path: "branding" },
    ]},
    { section: "Guests", items: [
      { label: "Guest List", path: "guests" },
      { label: "RSVP", path: "rsvp" },
    ]},
    { section: "Schedule", items: [
      { label: "Timeline", path: "timeline" },
    ]},
    { section: "Sharing", items: [
      { label: "QR Codes", path: "qr-codes" },
      { label: "Sharing", path: "sharing" },
      { label: "Analytics", path: "analytics" },
    ]},
    { section: "Settings", items: [
      { label: "Settings", path: "settings" },
    ]},
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors">
                <span className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center text-xs font-bold">E</span>
              </Link>
              <div className="relative" ref={switcherRef}>
                <button
                  onClick={() => setSwitcherOpen(!switcherOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{event.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {switcherOpen && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="p-3 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search events..."
                          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-gray-900"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {filteredEvents.map(e => (
                        <button
                          key={e.id}
                          onClick={() => { navigate(`/event/${e.id}/cover`); setSwitcherOpen(false); }}
                          className={cn("w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors", e.id === eventId && "bg-gray-50")}
                        >
                          <span className="text-sm font-medium text-gray-900 truncate">{e.name}</span>
                          {e.id === eventId && <Check className="w-4 h-4 text-gray-900 flex-shrink-0" />}
                        </button>
                      ))}
                      {filteredEvents.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">No events found</p>}
                    </div>
                    <div className="p-2 border-t border-gray-100">
                      <button onClick={() => { navigate("/dashboard"); setSwitcherOpen(false); }} className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg text-left">
                        View all events
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {event.is_published ? "Update" : "Publish"}
              </button>
            </div>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto pb-px">
            {tabs.map(group => (
              <div key={group.section} className="flex items-center">
                {group.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => cn(
                      "px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors",
                      isActive ? "border-black text-black font-medium" : "border-transparent text-gray-500 hover:text-gray-900"
                    )}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </header>
      <main className="p-4 sm:p-6 max-w-[1200px] mx-auto">
        <Outlet context={{ event }} />
      </main>
    </div>
  );
}
