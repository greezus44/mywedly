import { useState, useEffect } from "react";
import { useNavigate, useParams, Outlet, NavLink } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToCssVars, getTheme, getLogoConfig, getLogoStyle, shouldShowLogo } from "../../lib/theme";
import { cn, getDeviceType } from "../../lib/utils";
import { Menu, X, Globe } from "lucide-react";

export function GuestLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang, setLang, t } = useLang();
  const { session, loading } = useGuestAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wedding, setWedding] = useState<Wedding | null>(null);

  useEffect(() => {
    if (!slug) return;
    supabase.from("weddings").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
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
        <p className="font-body text-sm text-gray-400">{t.loading}</p>
      </div>
    );
  }

  if (!session) return null;

  const theme = getTheme(wedding);
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const showLogoInNav = logo.showInNavbar && shouldShowLogo(logo, "nav");

  const navItems = [
    { to: `/w/${slug}/home`, label: t.home, end: false },
    { to: `/w/${slug}/rsvp`, label: t.rsvp, end: false },
    { to: `/w/${slug}/doa`, label: t.doa, end: false },
    { to: `/w/${slug}/send-message`, label: t.sendMessage, end: false },
    { to: `/w/${slug}/contact`, label: t.contact, end: false },
  ];

  return (
    <div className="min-h-screen" style={{ ...themeToCssVars(theme), background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" } as React.CSSProperties}>
      {/* Nav bar */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-md" style={{ borderColor: "var(--color-border)", background: "rgba(255,255,255,0.85)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
          {/* Left: hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 transition hover:opacity-70"
            style={{ color: "var(--color-text)" }}
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Center: logo or couple names */}
          <div className="flex items-center gap-2">
            {showLogoInNav && logo.url ? (
              <img src={logo.url} alt="logo" style={getLogoStyle(logo, device)} />
            ) : (
              <span className="font-heading text-sm tracking-wide md:text-base" style={{ color: "var(--color-text)" }}>
                {wedding?.couple_name_one || ""} & {wedding?.couple_name_two || ""}
              </span>
            )}
          </div>

          {/* Right: language toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "ms" : "en")}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:opacity-70 md:text-sm"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "en" ? "EN" : "MS"}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="border-t" style={{ borderColor: "var(--color-border)" }}>
            <div className="mx-auto max-w-5xl px-4 py-2 md:px-6">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "block rounded-lg px-3 py-2.5 text-sm font-medium transition",
                      isActive ? "opacity-100" : "opacity-60 hover:opacity-100"
                    )
                  }
                  style={({ isActive }) => ({
                    background: isActive ? "var(--color-primary)" : "transparent",
                    color: isActive ? "var(--color-button-text)" : "var(--color-text)",
                  })}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Desktop nav links */}
      <nav className="hidden border-b md:block" style={{ borderColor: "var(--color-border)" }}>
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center gap-1 py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-4 py-2 text-sm font-medium transition",
                    isActive ? "opacity-100" : "opacity-60 hover:opacity-100"
                  )
                }
                style={({ isActive }) => ({
                  background: isActive ? "var(--color-primary)" : "transparent",
                  color: isActive ? "var(--color-button-text)" : "var(--color-text)",
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default GuestLayout;
