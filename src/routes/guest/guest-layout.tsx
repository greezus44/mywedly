import { useState, useEffect } from "react";
import { useNavigate, useParams, Outlet, NavLink } from "react-router-dom";
import { Menu, X, Globe } from "lucide-react";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import { themeToCssVars, getTheme } from "../../lib/theme";
import { cn } from "../../lib/utils";

const NAV_ITEMS = [
  { key: "home", path: "" },
  { key: "rsvp", path: "rsvp" },
  { key: "doa", path: "doa" },
  { key: "contact", path: "contact" },
  { key: "sendMessage", path: "send-message" },
] as const;

function GuestLayoutInner() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { lang, setLang, t } = useLang();
  const { session, loading } = useGuestAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate(`/w/${slug}/login`, { replace: true });
  }, [loading, session, slug, navigate]);

  if (loading || !session) return null;

  const theme = getTheme(session.wedding);
  const base = `/w/${slug}`;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]" style={themeToCssVars(theme) as React.CSSProperties}>
      <header className="fixed top-0 inset-x-0 z-40 bg-[var(--color-bg)]/70 backdrop-blur-md border-b border-[var(--color-border)]/15">
        <div className="px-5 md:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              className="md:hidden p-2 -ml-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div className="hidden md:flex items-center gap-7">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.path ? `${base}/${item.path}` : base}
                  end={!item.path}
                  className={({ isActive }) =>
                    cn(
                      "font-ui text-xs uppercase tracking-wider-luxe transition-colors",
                      isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                    )
                  }
                >
                  {t(item.key)}
                </NavLink>
              ))}
            </div>

            <button
              onClick={() => setLang(lang === "en" ? "ms" : "en")}
              className="flex items-center gap-1.5 px-3 py-1.5 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-primary)] border border-[var(--color-border)]/40 rounded-lg hover:bg-[var(--color-primary)] hover:text-white transition-all"
              style={{ borderRadius: "var(--button-radius, 8px)" }}
            >
              <Globe size={14} />
              {lang === "en" ? "EN" : "MS"}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--color-border)]/15 bg-[var(--color-bg)]/95 backdrop-blur-md animate-fade-in-down">
            <nav className="px-5 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.path ? `${base}/${item.path}` : base}
                  end={!item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "block px-3 py-3 font-ui text-sm uppercase tracking-wider-luxe rounded-lg transition-colors",
                      isActive
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
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

      <main className="pt-16 min-h-screen">
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
