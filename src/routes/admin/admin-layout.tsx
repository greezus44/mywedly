import { type ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Menu, X, LogOut, LayoutDashboard, Image, Palette, FileText, Calendar, Users, MessageSquare, Mail, Settings, Share2, BarChart3, BookOpen, Heart } from "lucide-react";

const navItems = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/cover", label: "Cover Page", icon: Image },
  { to: "/admin/login", label: "Sign-In Page", icon: LogIn },
  { to: "/admin/theme", label: "Theme", icon: Palette },
  { to: "/admin/content", label: "Content", icon: FileText },
  { to: "/admin/content/doa", label: "Doa", icon: BookOpen },
  { to: "/admin/content/contact", label: "Contact", icon: Mail },
  { to: "/admin/content/message", label: "Messages", icon: MessageSquare },
  { to: "/admin/events", label: "Events", icon: Calendar },
  { to: "/admin/guests", label: "Guests", icon: Users },
  { to: "/admin/rsvps", label: "RSVPs", icon: Heart },
  { to: "/admin/messages", label: "Guestbook", icon: MessageSquare },
  { to: "/admin/sharing", label: "Sharing", icon: Share2 },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function LogIn({ className }: { className?: string }) {
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>;
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 dash-root">
      {/* Sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 transition-transform lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <span className="text-lg font-semibold text-gray-900">Dashboard</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1" style={{ maxHeight: "calc(100vh - 4rem)" }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", isActive ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-100")}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-3">
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600"><Menu className="h-6 w-6" /></button>
          <h1 className="text-lg font-semibold text-gray-900 lg:block hidden">Wedding Invitation Manager</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Heart className="h-4 w-4 text-indigo-500" />
            <span>Manage your wedding</span>
          </div>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
