import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { Menu, X, Globe } from "lucide-react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getTheme, getContent } from "../../lib/theme";
import { cn } from "../../lib/utils";
import type { TranslationKey } from "../../lib/i18n";

const NAV_ITEMS: { key: TranslationKey; path: string }[] = [
  { key: "home", path: "" },
  { key: "rsvp", path: "rsvp" },
  { key: "contact", path: "contact" },
  { key: "doa", path: "doa" },
  { key: "sendMessage", path: "send-message" },
];

export function GuestLayout() {
  const { session, loading } = useGuestAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const slug = params.slug || session?.wedding.slug || "";
  const [menuOpen, setMenuOpen] = useState(false);

  const wedding = session?.wedding || null;
  const theme = getTheme(wedding);
  const cssVars = themeToCssVars(theme);
  const content = getContent((wedding || {}) as never);

  // Redirect to login if no session (except cover/login handled at route level)
  useEffect(() => {
    if (!loading && !session && slug) {
      navigate(`/w/${slug}/login`, { replace: true });
    }
  }, [loading, session, slug, navigate]);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (loading) {
    return (
      <div
        style={cssVars}
        className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]"
      >
        <p className="font-ui text-sm uppercase tracking-wider-luxe text-[var(--color-text-muted)] animate-pulse">
          {t("loading")}
        </p>
      </div>
    );
  }

  if (!session) return null;

  const handleNav = (path: string) => {
    setMenuOpen(false);
    navigate(`/w/${slug}/${path}`);
  };

  const isActive = (path: string) => {
    const fullPath = `/w/${slug}/${path}`.replace(/\/$/, "");
    return location.pathname === fullPath || (path && location.pathname.endsWith(`/${path}`));
  };

  const coupleName =
    content.cover_heading ||
    (wedding ? `${wedding.couple_name_one} & ${wedding.couple_name_two}` : "");

  return (
    <div style={cssVars} className="min-h-screen bg-[var(--color-bg)]">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[var(--color-bg)]/70 backdrop-blur-md border-b border-[var(--color-border)]/15">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          {/* Left: Hamburger (mobile) / Logo (desktop) */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden p-2 -ml-2 text-[var(--color-primary)] hover:opacity-70 transition-opacity"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <button
              onClick={() => handleNav("")}
              className="font-script text-lg md:text-xl text-[var(--color-primary)] hover:opacity-70 transition-opacity truncate max-w-[180px] md:max-w-none"
            >
              {coupleName}
            </button>
          </div>

          {/* Center: Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNav(item.path)}
                className={cn(
                  "font-ui text-xs uppercase tracking-wider-luxe transition-opacity hover:opacity-100",
                  isActive(item.path)
                    ? "text-[var(--color-primary)] opacity-100"
                    : "text-[var(--color-text-muted)] opacity-70"
                )}
              >
                {t(item.key)}
              </button>
            ))}
          </div>

          {/* Right: Language toggle */}
          <div className="flex items-center gap-1.5">
            <Globe size={15} className="text-[var(--color-text-muted)] hidden sm:block" />
            <button
              onClick={() => setLang("en")}
              className={cn(
                "font-ui text-xs uppercase tracking-wider-luxe px-1.5 py-1 transition-opacity",
                lang === "en"
                  ? "text-[var(--color-primary)] opacity-100"
                  : "text-[var(--color-text-muted)] opacity-50 hover:opacity-80"
              )}
            >
              EN
            </button>
            <span className="text-[var(--color-border)]/40 text-xs">|</span>
            <button
              onClick={() => setLang("ms")}
              className={cn(
                "font-ui text-xs uppercase tracking-wider-luxe px-1.5 py-1 transition-opacity",
                lang === "ms"
                  ? "text-[var(--color-primary)] opacity-100"
                  : "text-[var(--color-text-muted)] opacity-50 hover:opacity-80"
              )}
            >
              MS
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-out bg-[var(--color-bg)]/95 backdrop-blur-md border-b border-[var(--color-border)]/15",
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="px-5 py-4 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNav(item.path)}
                className={cn(
                  "font-ui text-sm uppercase tracking-wider-luxe py-3 text-left border-b border-[var(--color-border)]/10 last:border-0 transition-colors",
                  isActive(item.path)
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-text)]"
                )}
              >
                {t(item.key)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="pt-16 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

export default GuestLayout;
