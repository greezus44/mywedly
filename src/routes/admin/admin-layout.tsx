import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Wedding } from "../../lib/supabase";
import { cn } from "../../lib/utils";

interface NavItem {
  label: string;
  path: string;
  subtabs?: { label: string; path: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/admin" },
  { label: "Cover Page", path: "/admin/cover" },
  { label: "Theme", path: "/admin/theme" },
  {
    label: "Content",
    path: "/admin/content",
    subtabs: [
      { label: "Home", path: "/admin/content" },
      { label: "Doa", path: "/admin/content/doa" },
      { label: "Contact", path: "/admin/content/contact" },
      { label: "Message", path: "/admin/content/message" },
    ],
  },
  { label: "Events", path: "/admin/events" },
  { label: "Guests", path: "/admin/guests" },
  { label: "Messages", path: "/admin/messages" },
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/host-login");
  };

  const activeSubtabs = (() => {
    const path = window.location.pathname;
    const item = NAV_ITEMS.find((n) => n.subtabs && (path === n.path || path.startsWith(n.path + "/")));
    return item?.subtabs;
  })();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Primary nav */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[var(--color-border)]/15">
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-[var(--color-primary)]" />
                <span className="font-heading text-base text-[var(--color-text)] hidden sm:inline">
                  {wedding ? `${wedding.couple_name_one} & ${wedding.couple_name_two}` : "Wedding Dashboard"}
                </span>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-1.5 font-ui text-xs uppercase tracking-wider-luxe rounded-lg transition-all",
                      isActive
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <button onClick={handleSignOut} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-ui text-gray-500 hover:text-[var(--color-error)] transition-colors">
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Secondary nav (subtabs) */}
        {activeSubtabs && (
          <div className="px-4 md:px-6 border-t border-[var(--color-border)]/10">
            <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
              {activeSubtabs.map((sub) => (
                <NavLink
                  key={sub.path}
                  to={sub.path}
                  end={sub.path === activeSubtabs[0].path}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-1.5 font-ui text-xs uppercase tracking-wider-luxe rounded-lg whitespace-nowrap transition-all",
                      isActive
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "text-gray-400 hover:text-gray-600"
                    )
                  }
                >
                  {sub.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/20" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-14 left-0 right-0 bg-white border-b border-[var(--color-border)]/15 shadow-lg max-h-[calc(100vh-3.5rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <nav className="p-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <div key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/admin"}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "block px-3 py-2.5 font-ui text-sm uppercase tracking-wider-luxe rounded-lg transition-all",
                        isActive ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "text-gray-600 hover:bg-gray-50"
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                  {item.subtabs && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {item.subtabs.map((sub) => (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          end={sub.path === item.subtabs![0].path}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              "block px-3 py-2 font-ui text-xs uppercase tracking-wider-luxe rounded-lg transition-all",
                              isActive ? "text-[var(--color-primary)]" : "text-gray-400"
                            )
                          }
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
