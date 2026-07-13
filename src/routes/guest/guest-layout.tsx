import { useState, useEffect } from "react";
import { useNavigate, useParams, Outlet, NavLink } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import {
  themeToCssVars,
  getTheme,
  getLogoConfig,
  getLogoStyle,
  shouldShowLogo,
} from "../../lib/theme";
import { cn, getDeviceType } from "../../lib/utils";
import { Menu, X, Globe, Heart, Home as HomeIcon, Calendar, BookOpen, Mail, Send } from "lucide-react";

const navItems = [
  { key: "home", to: "", icon: HomeIcon },
  { key: "rsvp", to: "rsvp", icon: Calendar },
  { key: "doa", to: "doa", icon: BookOpen },
  { key: "contact", to: "contact", icon: Mail },
  { key: "sendMessage", to: "send-message", icon: Send },
];

function GuestLayoutInner() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, loading } = useGuestAuth();
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wedding, setWedding] = useState<Wedding | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session || (slug && session.wedding_slug !== slug)) {
      navigate(`/w/${slug}/login`, { replace: true });
    }
  }, [session, loading, slug, navigate]);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("weddings")
      .select("*")
      .eq("id", session.wedding_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setWedding(data as Wedding);
      });
  }, [session]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <Heart className="h-8 w-8 animate-pulse" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!session) return null;

  const theme = getTheme(wedding);
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const showNavLogo = logo.showInNavbar && logo.url;

  const base = slug ? `/w/${slug}` : "";

  return (
    <div
      className="min-h-screen"
      style={{ ...themeToCssVars(theme) } as React.CSSProperties}
    >
      {/* Nav bar */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          background: "color-mix(in srgb, var(--color-bg) 90%, transparent)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          {/* Hamburger left */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 transition-opacity hover:opacity-70"
            style={{ color: "var(--color-text)" }}
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Center logo (optional) */}
          {showNavLogo && (
            <div className="absolute left-1/2 -translate-x-1/2">
              <img
                src={logo.url!}
                alt="Logo"
                style={getLogoStyle(logo, device)}
                className="transition-opacity"
              />
            </div>
          )}

          {/* Language toggle right */}
          <button
            onClick={() => setLang(lang === "en" ? "ms" : "en")}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-70"
            style={{
              color: "var(--color-text)",
              border: "1px solid var(--color-border)",
            }}
          >
            <Globe className="h-4 w-4" />
            {lang === "en" ? "EN" : "MS"}
          </button>
        </div>

        {/* Mobile/desktop nav menu */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-16 z-30 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <nav
              className="absolute left-0 right-0 top-16 z-40 border-b shadow-lg md:border-b-0"
              style={{
                background: "var(--color-bg)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="mx-auto max-w-5xl px-4 py-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.key}
                    to={`${base}/${item.to}`.replace(/\/$/, "")}
                    end={item.to === ""}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                        isActive ? "opacity-100" : "opacity-70 hover:opacity-100"
                      )
                    }
                    style={({ isActive }) => ({
                      background: isActive ? "var(--color-primary)" : "transparent",
                      color: isActive ? "var(--color-button-text)" : "var(--color-text)",
                    })}
                  >
                    <item.icon className="h-4 w-4" />
                    {t[item.key as keyof typeof t]}
                  </NavLink>
                ))}
              </div>
            </nav>
          </>
        )}
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export function GuestLayout() {
  return (
    <GuestAuthProvider>
      <GuestLayoutInner />
    </GuestAuthProvider>
  );
}

export default GuestLayout;
