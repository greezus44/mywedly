import { useState, useEffect } from "react";
import { useNavigate, useParams, Outlet, NavLink } from "react-router-dom";
import { Menu, X, Globe } from "lucide-react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { getTheme, themeToCssVars } from "../../lib/theme";
import { cn } from "../../lib/utils";

const NAV_ITEMS = [
  { key: "home", path: "" },
  { key: "rsvp", path: "rsvp" },
  { key: "doa", path: "doa" },
  { key: "contact", path: "contact" },
  { key: "sendMessage", path: "send-message" },
] as const;

export function GuestLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, loading } = useGuestAuth();
  const { lang, setLang, t } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session && slug) {
      navigate(`/w/${slug}/login`, { replace: true });
    }
  }, [loading, session, slug, navigate]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg,#f5edda)]">
        <p className="font-ui text-sm uppercase tracking-wider-luxe text-[var(--color-text-muted,#8a8a8a)] animate-pulse">
          {t("loading")}
        </p>
      </div>
    );
  }

  const theme = getTheme(session.wedding);
  const base = `/w/${slug}`;

  return (
    <div className="min-h-screen flex flex-col" style={themeToCssVars(theme) as React.CSSProperties}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--color-bg)]/85 backdrop-blur-md border-b border-[var(--color-primary)]/15">
        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Hamburger left */}
            <button
              className="p-2 -ml-2 text-[var(--color-text)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Center monogram */}
            <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
              <span className="font-script text-lg text-[var(--color-primary)]">
                {session.wedding.couple_name_one} &amp; {session.wedding.couple_name_two}
              </span>
            </div>

            {/* Language toggle right */}
            <div className="flex items-center gap-1">
              <Globe size={16} className="text-[var(--color-text-muted)] mr-1" />
              <button
                onClick={() => setLang("en")}
                className={cn(
                  "font-ui text-xs uppercase tracking-wider-luxe px-2 py-1 rounded transition-colors",
                  lang === "en" ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                EN
              </button>
              <span className="text-[var(--color-text-muted)] text-xs">|</span>
              <button
                onClick={() => setLang("ms")}
                className={cn(
                  "font-ui text-xs uppercase tracking-wider-luxe px-2 py-1 rounded transition-colors",
                  lang === "ms" ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                MS
              </button>
            </div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center justify-center gap-1 pb-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.key}
              to={`${base}/${item.path}`}
              end={item.path === ""}
              className={({ isActive }) =>
                cn(
                  "px-4 py-1.5 font-ui text-xs uppercase tracking-wider-luxe rounded-lg transition-all",
                  isActive
                    ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )
              }
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/20" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute top-16 left-0 right-0 bg-[var(--color-bg)] border-b border-[var(--color-primary)]/15 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto animate-fade-in-down"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="p-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.key}
                  to={`${base}/${item.path}`}
                  end={item.path === ""}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "block px-4 py-3 font-ui text-sm uppercase tracking-wider-luxe rounded-lg transition-all",
                      isActive
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "text-[var(--color-text)] hover:bg-[var(--color-primary)]/5"
                    )
                  }
                >
                  {t(item.key)}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}

export default GuestLayout;
