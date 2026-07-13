import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate, useParams, Outlet, NavLink } from "react-router-dom";
import { Menu, X, Globe, Heart } from "lucide-react";
import { type Wedding } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import { themeToCssVars, getTheme, coverToCssVars, getCoverConfig } from "../../lib/theme";
import { cn } from "../../lib/utils";

const NAV_ITEMS = [
  { to: "home", key: "home" as const },
  { to: "rsvp", key: "rsvp" as const },
  { to: "doa", key: "doa" as const },
  { to: "contact", key: "contact" as const },
  { to: "send-message", key: "sendMessage" as const },
];

function GuestLayoutInner() {
  const navigate = useNavigate();
  const params = useParams();
  const slug = params.slug || "";
  const { session, loading } = useGuestAuth();
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wedding, setWedding] = useState<Wedding | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate(`/w/${slug}/login`, { replace: true });
      return;
    }
    setWedding(session.wedding);
  }, [session, loading, slug, navigate]);

  const theme = getTheme(wedding);
  const cover = getCoverConfig(wedding);

  const toggleLang = () => setLang(lang === "en" ? "ms" : "en");

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg)", color: "var(--color-text)" } as CSSProperties}
      >
        <Heart size={24} className="animate-pulse" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div
      className="min-h-screen"
      style={{ ...themeToCssVars(theme), ...coverToCssVars(cover) } as CSSProperties}
    >
      {/* Top Nav Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg)]/95 backdrop-blur-md border-b border-[var(--color-border)]/15">
        <div className="flex items-center justify-between px-5 md:px-8 h-16">
          {/* Hamburger - Left */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 -ml-2 text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Center monogram */}
          <div className="font-script text-lg md:text-xl text-[var(--color-primary)] tracking-wide">
            {wedding?.couple_name_one} <span className="text-[var(--color-text-muted)]">&</span> {wedding?.couple_name_two}
          </div>

          {/* Language Toggle - Right */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-2 text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors font-ui text-xs uppercase tracking-wider-luxe"
            aria-label="Toggle language"
          >
            <Globe size={16} />
            <span>{lang === "en" ? "EN" : "MS"}</span>
          </button>
        </div>

        {/* Slide-down Nav Menu */}
        <nav
          className={cn(
            "overflow-hidden transition-all duration-300 bg-[var(--color-bg)] border-b border-[var(--color-border)]/15",
            menuOpen ? "max-h-96" : "max-h-0"
          )}
        >
          <div className="px-5 md:px-8 py-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "block py-3 px-4 font-ui text-sm uppercase tracking-wider-luxe transition-all rounded-lg",
                    isActive
                      ? "text-[var(--color-primary)] bg-[var(--color-primary)]/8 border-l-2 border-[var(--color-primary)]"
                      : "text-[var(--color-text)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
                  )
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      {/* Page Content */}
      <main className="pt-16 min-h-screen">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 text-center border-t border-[var(--color-border)]/15">
        <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
          {wedding?.couple_name_one} & {wedding?.couple_name_two}
        </p>
      </footer>
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
