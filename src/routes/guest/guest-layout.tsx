import { useState, useEffect } from "react";
import { useNavigate, useParams, Outlet, NavLink } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToCssVars, getTheme, getLogoConfig, getLogoStyle } from "../../lib/theme";
import { cn, getDeviceType } from "../../lib/utils";
import { Menu, X, Globe } from "lucide-react";

const navItems = [
  { to: "", labelKey: "home" as const, end: true },
  { to: "rsvp", labelKey: "rsvp" as const },
  { to: "doa", labelKey: "doa" as const },
  { to: "contact", labelKey: "contact" as const },
  { to: "send-message", labelKey: "sendMessage" as const },
];

export function GuestLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, loading } = useGuestAuth();
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wedding, setWedding] = useState<Wedding | null>(null);

  useEffect(() => {
    if (!slug) return;
    supabase.from("weddings").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      if (data) setWedding(data as Wedding);
    });
  }, [slug]);

  useEffect(() => {
    if (!loading && !session) {
      navigate(`/w/${slug}/login`, { replace: true });
    }
  }, [loading, session, slug, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400 font-body text-sm tracking-widest uppercase">{t.loading}</div>
      </div>
    );
  }

  if (!session) return null;

  const theme = getTheme(wedding);
  const logo = getLogoConfig(wedding);
  const showNavLogo = logo.showInNavbar && logo.url;

  const baseRoute = `/w/${slug}`;

  return (
    <div className="min-h-screen bg-white" style={{ ...themeToCssVars(theme), fontFamily: "var(--font-body)" } as React.CSSProperties}>
      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 -ml-2 transition-opacity hover:opacity-60"
              style={{ color: "var(--color-text)" }}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Center: Logo (if showInNavbar) */}
            {showNavLogo && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <img
                  src={logo.url!}
                  alt="logo"
                  style={getLogoStyle(logo, getDeviceType())}
                  className="transition-opacity hover:opacity-80"
                />
              </div>
            )}

            {/* Right: Language toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "ms" : "en")}
              className="flex items-center gap-1.5 p-2 -mr-2 transition-opacity hover:opacity-60"
              style={{ color: "var(--color-text)" }}
              aria-label="Toggle language"
            >
              <Globe className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-wider hidden sm:inline">{lang}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-white shadow-xl transition-transform duration-300",
              menuOpen ? "translate-x-0" : "-translate-x-full"
            )}
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex h-16 items-center justify-between px-5 border-b" style={{ borderColor: "var(--color-border)" }}>
              <span className="font-heading text-lg" style={{ color: "var(--color-text)" }}>
                {wedding ? `${wedding.couple_name_one} & ${wedding.couple_name_two}` : "Menu"}
              </span>
              <button onClick={() => setMenuOpen(false)} className="p-1 transition-opacity hover:opacity-60" style={{ color: "var(--color-text)" }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-1">
              {navItems.map((item) => {
                const to = item.to === "" ? baseRoute : `${baseRoute}/${item.to}`;
                return (
                <NavLink
                  key={item.to}
                  to={to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "bg-black text-white"
                        : "hover:bg-gray-100"
                    )
                  }
                  style={({ isActive }) => ({
                    background: isActive ? "var(--color-button-bg)" : "transparent",
                    color: isActive ? "var(--color-button-text)" : "var(--color-text)",
                  })}
                >
                  {t[item.labelKey]}
                </NavLink>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Page Content */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8 md:py-12">
        <Outlet />
      </main>
    </div>
  );
}

export default GuestLayout;
