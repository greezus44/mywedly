import { useState, useEffect } from "react";
import { useNavigate, useParams, Outlet, NavLink } from "react-router-dom";
import { Menu, X, Globe } from "lucide-react";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, coverToCssVars, getLogoConfig, getLogoStyle, getTheme, getCoverConfig } from "../../lib/theme";
import { cn, getDeviceType } from "../../lib/utils";

const NAV_ITEMS = [
  { key: "home", path: "" },
  { key: "rsvp", path: "/rsvp" },
  { key: "doa", path: "/doa" },
  { key: "contact", path: "/contact" },
  { key: "sendMessage", path: "/send-message" },
] as const;

export function GuestLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session, loading } = useGuestAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  useEffect(() => {
    if (!loading && !session) navigate(`/w/${slug}/login`, { replace: true });
  }, [loading, session, slug, navigate]);

  if (loading || !session) return null;

  const wedding = session.wedding;
  const theme = getTheme(wedding);
  const cover = getCoverConfig(wedding);
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();

  const base = `/w/${slug}`;
  const showNavLogo = logo.showInNavbar && logo.visible && logo.url;

  return (
    <div
      className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-body"
      style={{ ...themeToCssVars(theme), ...coverToCssVars(cover) } as React.CSSProperties}
    >
      <header className="sticky top-0 z-40 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-border)]/20">
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-1.5 hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                {mobileOpen ? <X size={20} className="text-[var(--color-text)]" /> : <Menu size={20} className="text-[var(--color-text)]" />}
              </button>
              {showNavLogo && (
                <img
                  src={logo.url!}
                  alt="Logo"
                  style={getLogoStyle(logo, device)}
                  className="max-h-8 w-auto"
                />
              )}
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.key}
                  to={`${base}${item.path}`}
                  end={item.path === ""}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-1.5 font-ui text-xs uppercase tracking-wider-luxe rounded-lg transition-all",
                      isActive
                        ? "text-[var(--color-primary)]"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                    )
                  }
                >
                  {t(item.key)}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLang(lang === "en" ? "ms" : "en")}
                className="flex items-center gap-1.5 px-3 py-1.5 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors rounded-lg"
                aria-label="Toggle language"
              >
                <Globe size={14} />
                <span>{lang === "en" ? "EN" : "MS"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/20" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute top-14 left-0 right-0 bg-[var(--color-bg)] border-b border-[var(--color-border)]/20 shadow-lg max-h-[calc(100vh-3.5rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="p-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.key}
                  to={`${base}${item.path}`}
                  end={item.path === ""}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "block px-3 py-2.5 font-ui text-sm uppercase tracking-wider-luxe rounded-lg transition-all",
                      isActive
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]"
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

      <main className="min-h-[calc(100vh-3.5rem)]">
        <Outlet />
      </main>
    </div>
  );
}

export default GuestLayout;
