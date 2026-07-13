import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOutHost } from "@/lib/auth";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import {
  LayoutDashboard, Users, UsersRound, Calendar, Mail, MessageSquare,
  FileText, Image, Settings, LogOut, Menu, X, Palette, Eye, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { path: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  { label: "Overview", items: [{ path: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Design",
    items: [
      { path: "/admin/cover", label: "Cover Page", icon: Eye },
      { path: "/admin/theme", label: "Theme", icon: Palette },
      { path: "/admin/content", label: "Content", icon: FileText },
      { path: "/admin/gallery", label: "Gallery", icon: Image },
    ],
  },
  {
    label: "Manage",
    items: [
      { path: "/admin/guests", label: "Guests", icon: Users },
      { path: "/admin/groups", label: "Groups", icon: UsersRound },
      { path: "/admin/events", label: "Events", icon: Calendar },
      { path: "/admin/invitations", label: "Invitations", icon: Mail },
      { path: "/admin/rsvps", label: "RSVPs", icon: MessageSquare },
      { path: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { wedding, loading, createWedding } = useHostWedding();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => { await signOutHost(); navigate("/"); };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sepia">Loading…</div>;

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-serif text-onyx mb-4">No Wedding Yet</h1>
          <p className="text-sepia text-sm mb-6">Create your wedding to get started.</p>
          <Button onClick={async () => { const w = await createWedding(); if (w) navigate("/admin"); }}>Create Wedding</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist flex flex-col">
      <header className="sticky top-0 z-40 bg-parchment/95 backdrop-blur-md border-b border-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/admin" className="font-serif text-lg text-onyx truncate whitespace-nowrap">
              {wedding.couple_name_one} & {wedding.couple_name_two}
            </Link>
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_GROUPS.map((group) => (
                <div key={group.label} className="relative group">
                  <button className="flex items-center gap-1 px-3 py-2 text-sm text-sepia hover:text-onyx transition-colors rounded-lg hover:bg-mist">
                    {group.label}<ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-sand rounded-xl shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {group.items.map((item) => (
                      <Link key={item.path} to={item.path} className={cn("flex items-center gap-2.5 px-3 py-2 text-sm transition-colors", location.pathname === item.path ? "bg-mist text-onyx font-medium" : "text-sepia hover:bg-mist hover:text-onyx")}>
                        <item.icon className="w-4 h-4" />{item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <a href={`/w/${wedding.slug}`} target="_blank" className="hidden sm:flex items-center gap-1.5 text-sepia text-sm hover:text-onyx transition-colors px-3 py-1.5 rounded-lg hover:bg-mist">
                <Eye className="w-4 h-4" /> View Site
              </a>
              <button onClick={handleSignOut} className="hidden sm:flex items-center gap-1.5 text-sepia text-sm hover:text-onyx transition-colors px-3 py-1.5 rounded-lg hover:bg-mist">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-sepia p-1.5 rounded-lg hover:bg-mist">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {mobileOpen && (
            <nav className="lg:hidden pb-4 animate-slide-down">
              <div className="space-y-3">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs uppercase tracking-widest text-sepia/50 px-2 mb-1">{group.label}</p>
                    {group.items.map((item) => (
                      <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg", location.pathname === item.path ? "bg-mist text-onyx font-medium" : "text-sepia hover:bg-mist")}>
                        <item.icon className="w-4 h-4" />{item.label}
                      </Link>
                    ))}
                  </div>
                ))}
                <div className="pt-2 border-t border-sand space-y-1">
                  <a href={`/w/${wedding.slug}`} target="_blank" className="flex items-center gap-2.5 px-3 py-2 text-sm text-sepia hover:bg-mist rounded-lg"><Eye className="w-4 h-4" /> View Site</a>
                  <button onClick={handleSignOut} className="flex items-center gap-2.5 px-3 py-2 text-sm text-sepia hover:bg-mist rounded-lg w-full"><LogOut className="w-4 h-4" /> Sign Out</button>
                </div>
              </div>
            </nav>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
