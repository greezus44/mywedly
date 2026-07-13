import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Wedding } from "../../lib/supabase";
import { cn } from "../../lib/utils";

interface NavItem { label: string; path: string; subtabs?: { label: string; path: string }[]; }
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/admin" },
  { label: "Cover Page", path: "/admin/cover" },
  { label: "Theme", path: "/admin/theme" },
  { label: "Content", path: "/admin/content", subtabs: [
    { label: "Home", path: "/admin/content" },
    { label: "Doa", path: "/admin/content/doa" },
    { label: "Contact", path: "/admin/content/contact" },
    { label: "Message", path: "/admin/content/message" },
  ]},
  { label: "Events", path: "/admin/events" },
  { label: "Guests", path: "/admin/guests" },
  { label: "Messages", path: "/admin/messages" },
  { label: "RSVPs", path: "/admin/rsvps" },
  { label: "Sharing", path: "/admin/sharing" },
  { label: "Analytics", path: "/admin/analytics" },
  { label: "Settings", path: "/admin/settings" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { data: wedding } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/host-login"); };
  const path = window.location.pathname;
  const activeItem = NAV_ITEMS.find((n) => n.subtabs && (path === n.path || path.startsWith(n.path + "/")));
  const activeSubtabs = activeItem?.subtabs;

  return (
    <div className="dash-root min-h-screen bg-[var(--dash-bg)] flex flex-col">
      <header className="sticky top-0 z-40 bg-[var(--dash-surface)]/90 backdrop-blur-md border-b border-[var(--dash-border)]">
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={20} className="text-gray-600" /> : <Menu size={20} className="text-gray-600" />}</button>
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-[var(--dash-accent)]" />
                <span className="font-ui text-sm font-semibold text-[var(--dash-text)] hidden sm:inline">{wedding ? `${wedding.couple_name_one} & ${wedding.couple_name_two}` : "Wedding Dashboard"}</span>
              </div>
            </div>
            <nav className="hidden lg:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.path} to={item.path} end={item.path === "/admin"} className={({ isActive }) => cn("px-3 py-1.5 font-ui text-xs font-medium rounded-lg transition-all", isActive ? "bg-[var(--dash-accent-bg)] text-[var(--dash-accent)]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50")}>{item.label}</NavLink>
              ))}
            </nav>
            <button onClick={handleSignOut} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-ui text-gray-500 hover:text-red-500 transition-colors"><LogOut size={14} /><span className="hidden sm:inline">Sign Out</span></button>
          </div>
        </div>
        {activeSubtabs && (
          <div className="px-4 md:px-6 border-t border-[var(--dash-border)]">
            <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
              {activeSubtabs.map((sub) => (
                <NavLink key={sub.path} to={sub.path} end={sub.path === activeSubtabs[0].path} className={({ isActive }) => cn("px-3 py-1.5 font-ui text-xs font-medium rounded-lg whitespace-nowrap transition-all", isActive ? "bg-[var(--dash-accent-bg)] text-[var(--dash-accent)]" : "text-gray-400 hover:text-gray-600")}>{sub.label}</NavLink>
              ))}
            </div>
          </div>
        )}
      </header>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/20" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg max-h-[calc(100vh-3.5rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <nav className="p-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <div key={item.path}>
                  <NavLink to={item.path} end={item.path === "/admin"} onClick={() => setMobileOpen(false)} className={({ isActive }) => cn("block px-3 py-2.5 font-ui text-sm font-medium rounded-lg transition-all", isActive ? "bg-[var(--dash-accent-bg)] text-[var(--dash-accent)]" : "text-gray-600 hover:bg-gray-50")}>{item.label}</NavLink>
                  {item.subtabs && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {item.subtabs.map((sub) => (
                        <NavLink key={sub.path} to={sub.path} end={sub.path === item.subtabs![0].path} onClick={() => setMobileOpen(false)} className={({ isActive }) => cn("block px-3 py-2 font-ui text-xs font-medium rounded-lg transition-all", isActive ? "text-[var(--dash-accent)]" : "text-gray-400")}>{sub.label}</NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
