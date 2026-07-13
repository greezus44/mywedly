import { useState, useEffect, useMemo, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Globe, Users, Calendar, Mail, Image,
  BarChart3, Share2, Settings, ChevronRight, LogOut, Menu, X,
} from "lucide-react";
import { supabase, Wedding } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

interface NavChild { label: string; path: string; }
interface NavItem { label: string; icon: React.ReactNode; path?: string; children?: NavChild[]; }

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", icon: <LayoutDashboard className="w-4 h-4" />, path: "/admin" },
  {
    label: "Website", icon: <Globe className="w-4 h-4" />,
    children: [
      { label: "Cover Page", path: "/admin/cover" },
      { label: "Sign In Page", path: "/admin/login" },
      { label: "Home Page", path: "/admin/home" },
      { label: "Theme", path: "/admin/theme" },
      { label: "Navigation", path: "/admin/navigation" },
      { label: "Footer", path: "/admin/footer" },
      { label: "Extra Pages", path: "/admin/extra-pages" },
    ],
  },
  {
    label: "Guests", icon: <Users className="w-4 h-4" />,
    children: [
      { label: "Guest List", path: "/admin/guests" },
      { label: "Guest Groups", path: "/admin/guest-groups" },
      { label: "Imports", path: "/admin/imports" },
    ],
  },
  {
    label: "Events", icon: <Calendar className="w-4 h-4" />,
    children: [
      { label: "Event Details", path: "/admin/events" },
      { label: "Event Categories", path: "/admin/event-categories" },
    ],
  },
  {
    label: "Invitations", icon: <Mail className="w-4 h-4" />,
    children: [
      { label: "RSVP Settings", path: "/admin/rsvp" },
      { label: "RSVP Management", path: "/admin/rsvp-management" },
      { label: "Event Invitations", path: "/admin/event-invitations" },
    ],
  },
  { label: "Gallery", icon: <Image className="w-4 h-4" />, path: "/admin/gallery" },
  { label: "Analytics", icon: <BarChart3 className="w-4 h-4" />, path: "/admin/analytics" },
  { label: "Sharing", icon: <Share2 className="w-4 h-4" />, path: "/admin/sharing" },
  {
    label: "Settings", icon: <Settings className="w-4 h-4" />,
    children: [
      { label: "General", path: "/admin/settings" },
      { label: "Branding", path: "/admin/branding" },
      { label: "Domains", path: "/admin/domains" },
      { label: "Integrations", path: "/admin/integrations" },
      { label: "Account", path: "/admin/account" },
    ],
  },
];

function findActiveParent(pathname: string): number {
  for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
    const item = NAV_ITEMS[i];
    if (item.path === pathname) return i;
    if (item.children) for (const child of item.children) if (pathname === child.path || pathname.startsWith(child.path + "/")) return i;
  }
  return 0;
}

function findActiveChild(pathname: string, parentIndex: number): string | null {
  const item = NAV_ITEMS[parentIndex];
  if (!item.children) return null;
  for (const child of item.children) if (pathname === child.path || pathname.startsWith(child.path + "/")) return child.path;
  return item.children[0]?.path || null;
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const activeParent = useMemo(() => findActiveParent(location.pathname), [location.pathname]);
  const activeChild = useMemo(() => findActiveChild(location.pathname, activeParent), [location.pathname, activeParent]);

  const { data: wedding, isLoading } = useQuery<Wedding | null>({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from("weddings").select("*").eq("creator_id", user.id).limit(1).maybeSingle();
      if (error) throw error;
      return data as Wedding | null;
    },
    staleTime: 30000,
    gcTime: 60000,
  });

  useEffect(() => {
    if (!isLoading && !wedding) {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }
        const { data } = await supabase.from("weddings").insert({ creator_id: user.id, title: "Our Wedding" }).select().single();
        if (data) queryClient.setQueryData(["wedding"], data);
      })();
    }
  }, [wedding, isLoading, navigate, queryClient]);

  const handleSignOut = useCallback(async () => { await supabase.auth.signOut(); queryClient.clear(); navigate("/login"); }, [navigate, queryClient]);

  const handlePublish = useCallback(async () => {
    if (!wedding) return;
    setPublishing(true);
    setPublishMsg(null);
    try {
      const updates: Record<string, any> = { is_published: true, published_at: new Date().toISOString() };
      const draftFields: (keyof Wedding)[] = ["draft_title","draft_groom_name","draft_bride_name","draft_groom_parents","draft_bride_parents","draft_wedding_date","draft_wedding_time","draft_venue","draft_address","draft_cover_image","draft_cover_config","draft_login_config","draft_theme","draft_logo_config","draft_content","draft_sharing_config"];
      for (const draft of draftFields) {
        const published = draft.replace("draft_", "");
        if (wedding[draft] !== null && wedding[draft] !== undefined) updates[published] = wedding[draft];
      }
      const { error } = await supabase.from("weddings").update(updates).eq("id", wedding.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setPublishMsg({ type: "success", text: "Website published successfully!" });
    } catch (err: any) {
      setPublishMsg({ type: "error", text: err.message || "Failed to publish" });
    } finally {
      setPublishing(false);
      setTimeout(() => setPublishMsg(null), 4000);
    }
  }, [wedding, queryClient]);

  const handlePrimaryClick = (item: NavItem) => { if (item.path) { navigate(item.path); setMobileMenuOpen(false); } };
  const currentParent = NAV_ITEMS[activeParent];

  return (
    <div className="dash-root min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold">W</div>
              <span className="font-semibold text-gray-900 text-sm hidden sm:inline">Wedding Studio</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {wedding && <Button variant="primary" size="sm" onClick={handlePublish} loading={publishing}>Publish</Button>}
            <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="w-4 h-4" /><span className="hidden sm:inline">Sign Out</span></Button>
          </div>
        </div>
        <nav className="border-t border-gray-100 px-4 lg:px-6">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar h-11">
            {NAV_ITEMS.map((item, index) => (
              <button key={item.label} onClick={() => handlePrimaryClick(item)} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium whitespace-nowrap rounded-md transition-colors", activeParent === index ? "text-gray-900 bg-gray-100" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50")}>
                {item.icon}{item.label}
                {item.children && <ChevronRight className={cn("w-3 h-3 transition-transform", activeParent === index && "rotate-90")} />}
              </button>
            ))}
          </div>
        </nav>
        {currentParent?.children && (
          <nav className="border-t border-gray-100 px-4 lg:px-6 bg-gray-50">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar h-10">
              {currentParent.children.map(child => (
                <button key={child.path} onClick={() => { navigate(child.path); setMobileMenuOpen(false); }} className={cn("px-3 py-1 text-sm whitespace-nowrap rounded-md transition-colors", activeChild === child.path ? "text-gray-900 font-semibold bg-white shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700")}>{child.label}</button>
              ))}
            </div>
          </nav>
        )}
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-30 bg-white overflow-y-auto pb-20">
          <div className="p-4 space-y-1">
            {NAV_ITEMS.map((item, index) => (
              <div key={item.label}>
                <button onClick={() => handlePrimaryClick(item)} className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium", activeParent === index ? "bg-gray-100 text-gray-900" : "text-gray-600")}>{item.icon}{item.label}</button>
                {item.children && activeParent === index && (
                  <div className="ml-8 mt-1 space-y-0.5">
                    {item.children.map(child => <button key={child.path} onClick={() => { navigate(child.path); setMobileMenuOpen(false); }} className={cn("w-full text-left px-3 py-1.5 rounded-md text-sm", activeChild === child.path ? "text-gray-900 font-medium bg-gray-100" : "text-gray-500")}>{child.label}</button>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {publishMsg && <div className={cn("fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-white text-sm font-medium shadow-lg animate-slide-up", publishMsg.type === "success" ? "bg-green-600" : "bg-red-600")}>{publishMsg.text}</div>}

      <main className="flex-1 p-4 lg:p-6"><Outlet context={{ wedding }} /></main>
    </div>
  );
}
