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

type NavItem = { path: string; label: string; icon: React.ComponentType<{ className?: string }>; subtabs?: { path: string; label: string }[] };

const NAV_ITEMS: NavItem[] = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/cover", label: "Cover Page", icon: Eye },
  { path: "/admin/theme", label: "Theme", icon: Palette },
  {
    path: "/admin/content", label: "Content", icon: FileText,
    subtabs: [
      { path: "/admin/content", label: "Home" },
      { path: "/admin/content/story", label: "Our Story" },
      { path: "/admin/content/schedule", label: "Timeline" },
      { path: "/admin/content/travel", label: "Travel" },
      { path: "/admin/content/accommodation", label: "Accommodation" },
      { path: "/admin/content/faq", label: "FAQ" },
      { path: "/admin/content/registry", label: "Registry" },
      { path: "/admin/content/contact", label: "Contact" },
      { path: "/admin/content/footer", label: "Footer" },
    ],
  },
  {
    path: "/admin/guests", label: "Guests", icon: Users,
    subtabs: [
      { path: "/admin/guests", label: "Guest List" },
      { path: "/admin/groups", label: "Guest Groups" },
      { path: "/admin/guests?tab=import", label: "Imports" },
    ],
  },
  {
    path: "/admin/events", label: "Events", icon: Calendar,
    subtabs: [
      { path: "/admin/events", label: "All Events" },
      { path: "/admin/events?tab=create", label: "Create Event" },
      { path: "/admin/invitations", label: "Invitations" },
    ],
  },
  { path: "/admin/gallery", label: "Gallery", icon: Image },
  { path: "/admin/rsvps", label: "RSVPs", icon: MessageSquare },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

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

  // Find active primary tab
  const activeItem = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path)) ?? NAV_ITEMS[0];
  const subtabs = activeItem.subtabs;

  return (
    <div className="min-h-screen bg-mist flex flex-col">
      {/* ─── Sticky header ─── */}
      <header className="sticky top-0 z-40 bg-parchment/95 backdrop-blur-md border-b border-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top row: brand + actions */}
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-sepia p-1.5 rounded-lg hover:bg-mist">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <Link to="/admin" className="font-serif text-base text-onyx truncate whitespace-nowrap">
                {wedding.couple_name_one} & {wedding.couple_name_two}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <a href={`/w/${wedding.slug}`} target="_blank" className="hidden sm:flex items-center gap-1.5 text-sepia text-sm hover:text-onyx transition-colors px-3 py-1.5 rounded-lg hover:bg-mist">
                <Eye className="w-4 h-4" /> View Site
              </a>
              <button onClick={handleSignOut} className="hidden sm:flex items-center gap-1.5 text-sepia text-sm hover:text-onyx transition-colors px-3 py-1.5 rounded-lg hover:bg-mist">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>

          {/* ─── Primary navigation (horizontal scroll on small screens) ─── */}
          <nav className="hidden lg:flex items-center gap-1 h-11 nav-scroll overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                    isActive ? "bg-onyx text-parchment" : "text-sepia hover:text-onyx hover:bg-mist"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* ─── Secondary navigation (subtabs) ─── */}
          {subtabs && subtabs.length > 0 && (
            <nav className="hidden lg:flex items-center gap-1 h-10 border-t border-sand/50 nav-scroll overflow-x-auto">
              {subtabs.map((subtab) => {
                const isActive = location.pathname + location.search === subtab.path;
                return (
                  <Link
                    key={subtab.path}
                    to={subtab.path}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                      isActive ? "text-onyx bg-mist" : "text-sepia/70 hover:text-onyx hover:bg-mist/50"
                    )}
                  >
                    {subtab.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* ─── Mobile navigation ─── */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-sand bg-parchment animate-slide-down max-h-[70vh] overflow-y-auto">
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
                return (
                  <div key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn("flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg", isActive ? "bg-mist text-onyx font-medium" : "text-sepia hover:bg-mist")}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                    {item.subtabs && isActive && (
                      <div className="ml-8 mt-1 space-y-0.5">
                        {item.subtabs.map((subtab) => (
                          <Link
                            key={subtab.path}
                            to={subtab.path}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "block px-3 py-1.5 text-xs rounded-md",
                              location.pathname + location.search === subtab.path ? "text-onyx bg-mist font-medium" : "text-sepia/70 hover:text-onyx"
                            )}
                          >
                            {subtab.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="pt-2 border-t border-sand space-y-1">
                <a href={`/w/${wedding.slug}`} target="_blank" className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-sepia hover:bg-mist rounded-lg"><Eye className="w-4 h-4" /> View Site</a>
                <button onClick={handleSignOut} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-sepia hover:bg-mist rounded-lg w-full"><LogOut className="w-4 h-4" /> Sign Out</button>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* ─── Main content ─── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
