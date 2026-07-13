import { useState, useEffect, type ReactNode } from "react";
import { NavLink, useNavigate, useParams, Outlet } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getTheme, getLogoConfig, getLogoStyle, shouldShowLogo } from "../../lib/theme";
import { cn, getDeviceType } from "../../lib/utils";
import { Menu, X, Globe, Heart } from "lucide-react";

const navItems = [
  { to: "", labelKey: "home" as const, end: true },
  { to: "rsvp", labelKey: "rsvp" as const, end: false },
  { to: "doa", labelKey: "doa" as const, end: false },
  { to: "contact", labelKey: "contact" as const, end: false },
  { to: "send-message", labelKey: "sendMessage" as const, end: false },
];

export function GuestLayout({ children }: { children?: ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, loading } = useGuestAuth();
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wedding, setWedding] = useState<Wedding | null>(null);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("weddings")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setWedding(data as Wedding);
      });
  }, [slug]);

  useEffect(() => {
    if (!loading && !session && slug) {
      navigate(`/w/${slug}/login`, { replace: true });
    }
  }, [loading, session, slug, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400">
          <Heart className="h-8 w-8 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!session) return null;

  const theme = getTheme(wedding);
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const showNavbarLogo = shouldShowLogo(logo, "home") && logo.url;

  const baseNavPath = `/w/${slug}`;

  return (
    <div
      className="min-h-screen"
      style={{ ...themeToCssVars(theme), background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" } as React.CSSProperties}
    >
      {/* Top nav bar */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          borderColor: "var(--color-border)",
          background: "color-mix(in srgb, var(--color-bg) 85%, transparent)",
        } as React.CSSProperties}
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="p-1.5 transition-opacity hover:opacity-70"
              style={{ color: "var(--color-text)" }}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {showNavbarLogo && (
              <img
                src={logo.url!}
                alt="logo"
                style={getLogoStyle(logo, device)}
                className="max-h-8"
              />
            )}
          </div>

          {/* Right: language toggle */}
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
            <div
              className="inline-flex overflow-hidden rounded-full border"
              style={{ borderColor: "var(--color-border)" }}
            >
              {(["en", "ms"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="px-3 py-1 text-xs font-medium transition-all"
                  style={{
                    background: lang === l ? "var(--color-primary)" : "transparent",
                    color: lang === l ? "var(--color-button-text)" : "var(--color-text-muted)",
                  } as React.CSSProperties}
                >
                  {l === "en" ? "EN" : "MS"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-72 transform border-r transition-transform duration-300",
              menuOpen ? "translate-x-0" : "-translate-x-full"
            )}
            style={{
              background: "var(--color-bg)",
              borderColor: "var(--color-border)",
            } as React.CSSProperties}
          >
            <div
              className="flex h-16 items-center justify-between border-b px-4"
              style={{ borderColor: "var(--color-border)" }}
            >
              <span
                className="font-heading text-lg"
                style={{ color: "var(--color-primary)" }}
              >
                {wedding ? `${wedding.couple_name_one} & ${wedding.couple_name_two}` : "Menu"}
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="transition-opacity hover:opacity-70"
                style={{ color: "var(--color-text)" }}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={`${baseNavPath}/${item.to}`.replace(/\/$/, "")}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition",
                      isActive ? "text-white" : "hover:opacity-80"
                    )
                  }
                  style={({ isActive }) =>
                    ({
                      background: isActive ? "var(--color-primary)" : "transparent",
                      color: isActive ? "var(--color-button-text)" : "var(--color-text)",
                    }) as React.CSSProperties
                  }
                >
                  {t[item.labelKey]}
                </NavLink>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* Page content */}
      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        {children || <Outlet />}
      </main>
    </div>
  );
}

export default GuestLayout;
