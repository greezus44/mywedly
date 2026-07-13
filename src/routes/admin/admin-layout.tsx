import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOutHost } from "@/lib/auth";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import {
  LayoutDashboard, Users, UsersRound, Calendar, Mail, MessageSquare,
  FileText, Image, Settings, LogOut, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { path: "/admin", label: "Overview", icon: LayoutDashboard },
  { path: "/admin/guests", label: "Guests", icon: Users },
  { path: "/admin/groups", label: "Groups", icon: UsersRound },
  { path: "/admin/events", label: "Events", icon: Calendar },
  { path: "/admin/invitations", label: "Invitations", icon: Mail },
  { path: "/admin/rsvps", label: "RSVPs", icon: MessageSquare },
  { path: "/admin/content", label: "Content", icon: FileText },
  { path: "/admin/gallery", label: "Gallery", icon: Image },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { wedding, loading, createWedding } = useHostWedding();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOutHost();
    navigate("/");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sepia">Loading…</div>;
  }

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-serif text-onyx mb-4">No Wedding Yet</h1>
          <p className="text-sepia text-sm mb-6">Create your wedding to get started with the dashboard.</p>
          <Button onClick={async () => { const w = await createWedding(); if (w) navigate("/admin"); }}>
            Create Wedding
          </Button>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <div className="px-6 py-5 border-b border-sand">
        <h1 className="font-serif text-lg text-onyx truncate">
          {wedding.couple_name_one} & {wedding.couple_name_two}
        </h1>
        <p className="text-xs text-sepia/60 mt-0.5">Wedding Dashboard</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active ? "bg-onyx/5 text-onyx font-medium" : "text-sepia hover:bg-onyx/5 hover:text-onyx"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-sand">
        <a
          href={`/w/${wedding.slug}`}
          target="_blank"
          className="block px-3 py-2 text-sm text-sepia hover:text-onyx transition-colors"
        >
          View Guest Site →
        </a>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 text-sm text-sepia hover:text-onyx transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-mist flex">
      {/* Desktop sidebar */}
      <aside className="w-60 bg-parchment border-r border-sand flex flex-col hidden md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-onyx/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 bg-parchment border-r border-sand flex flex-col animate-slide-up">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-parchment border-b border-sand">
          <button onClick={() => setMobileOpen(true)} className="text-sepia">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-serif text-sm text-onyx">Dashboard</span>
          <div className="w-5" />
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
