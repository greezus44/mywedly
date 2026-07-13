import { useState, useEffect } from "react";
import { useNavigate, useParams, Outlet, NavLink } from "react-router-dom";
import { Menu, X, Globe } from "lucide-react";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars } from "../../lib/theme";
import { cn } from "../../lib/utils";

const NAV_ITEMS = [
  { key: "home", path: "" },
  { key: "rsvp", path: "rsvp" },
  { key: "doa", path: "doa" },
  { key: "contact", path: "contact" },
  { key: "sendMessage", path: "send-message" },
] as const;

function GuestLayoutInner() {
  const { session, loading } = useGuestAuth();
  const { lang, setLang, t } = useLang();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session && slug) {
      navigate(`/w/${slug}/login`, { replace: true });
    }
  }, [loading, session, slug, navigate]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [window.location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] animate-pulse">
          {t("loading")}
        </p>
      </div>
    );
  }

  if (!session || !slug) return null;

  const theme = session.wedding.theme_config && "colors" in session.wedding.theme_config
    ? session.wedding.theme_config
    : null;
  const basePath = `/w/${slug}`;

  return (
    <div
      style={themeToCssVars(theme) as React.CSSProperties}
      className="min-h-screen bg-[var(--color-bg)] flex flex-col"
    >
      {/* Top Nav Bar */}
      <header className="sticky top-0 z-40 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-border)]/15">
        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Hamburger - Left */}
            <button
              className="p-2 hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} className="text-[var(--color-text)]" /> : <Menu size={20} className="text-[var(--color-text)]" />}
            </button>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.key}
                  to={`${basePath}/${item.path}`}
                  end={item.path === ""}
                  className={({ isActive }) =>
                    cn(
                      "px-4 py-2 font-ui text-xs uppercase tracking-wider-luxe rounded-lg transition-all",
                      isActive
                        ? "text-[var(--color-primary)] bg-[var(--color-primary)]/10"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
                    )
                  }
                >
                  {t(item.key)}
                </NavLink>
              ))}
            </nav>

            {/* Language Toggle - Right */}
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-[var(--color-text-muted)] hidden sm:block" />
              <div className="inline-flex border border-[var(--color-border)]/30 rounded-lg overflow-hidden">
                <button
                  onClick={() => setLang("en")}
                  className={cn(
                    "px-3 py-1.5 font-ui text-xs uppercase tracking-wider-luxe transition-all",
                    lang === "en"
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                  )}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang("ms")}
                  className={cn(
                    "px-3 py-1.5 font-ui text-xs uppercase tracking-wider-luxe transition-all",
                    lang === "ms"
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                  )}
                >
                  MS
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Slide-Down Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--color-border)]/15 bg-[var(--color-bg)]/95 backdrop-blur-md animate-fade-in-down">
            <nav className="px-4 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.key}
                  to={`${basePath}/${item.path}`}
                  end={item.path === ""}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "block px-4 py-3 font-ui text-sm uppercase tracking-wider-luxe rounded-lg transition-all",
                      isActive
                        ? "text-[var(--color-primary)] bg-[var(--color-primary)]/10"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
                    )
                  }
                >
                  {t(item.key)}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Content Outlet */}
      <main className="flex-1 flex flex-col">
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
