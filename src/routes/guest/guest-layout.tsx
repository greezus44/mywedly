import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import {
  Menu, X, Home, Heart, Calendar, Image as ImageIcon,
  HelpCircle, Gift, Mail, LogOut, ChevronDown,
} from "lucide-react";
import { supabase, type Wedding, type Guest } from "@/lib/supabase";
import { getGuestSession, clearGuestSession } from "@/lib/guest-auth";
import { getTheme, themeToCssVars } from "@/lib/theme";
import { daysUntil, formatDate, cn } from "@/lib/utils";

type NavItem = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { path: "home", label: "Home", icon: Home },
  { path: "events", label: "Events", icon: Calendar },
  { path: "story", label: "Our Story", icon: Heart },
  { path: "gallery", label: "Gallery", icon: ImageIcon },
  { path: "travel", label: "Travel", icon: ChevronDown },
  { path: "faq", label: "FAQ", icon: HelpCircle },
  { path: "registry", label: "Registry", icon: Gift },
  { path: "contact", label: "Contact", icon: Mail },
];

export function GuestLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const session = getGuestSession();

    // No session → redirect to cover
    if (!session || (slug && session.weddingSlug !== slug)) {
      if (slug) navigate(`/w/${slug}`, { replace: true });
      setLoading(false);
      return;
    }

    Promise.all([
      supabase.from("weddings").select("*").eq("id", session.weddingId).maybeSingle(),
      supabase.from("guests").select("*").eq("id", session.guestId).maybeSingle(),
    ]).then(([weddingRes, guestRes]) => {
      if (weddingRes.data) setWedding(weddingRes.data as Wedding);
      if (guestRes.data) setGuest(guestRes.data as Guest);
      setLoading(false);
    });
  }, [slug, navigate]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const theme = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const dUntil = daysUntil(wedding?.wedding_date ?? null);
  const coupleNames = wedding
    ? `${wedding.couple_name_one} & ${wedding.couple_name_two}`
    : "";

  const handleSignOut = () => {
    clearGuestSession();
    if (slug) navigate(`/w/${slug}`, { replace: true });
  };

  // Determine active nav item from current path
  const currentSegment = location.pathname.split("/").pop() ?? "home";
  const isActive = (item: NavItem) =>
    currentSegment === item.path ||
    (currentSegment === "" && item.path === "home");

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ ...cssVars, background: "var(--c-background)" } as React.CSSProperties}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[var(--c-textMuted)] border-t-[var(--c-primary)] rounded-full animate-spin" />
          <p className="text-sm" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-center px-6"
        style={{ ...cssVars, background: "var(--c-background)" } as React.CSSProperties}
      >
        <div>
          <h1
            className="font-serif text-3xl mb-3"
            style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}
          >
            Wedding Not Found
          </h1>
          <p className="text-sm" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
            The wedding you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ ...cssVars, background: "var(--c-background)" } as React.CSSProperties}
    >
      {/* ─── Sticky header ─── */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          background: "color-mix(in srgb, var(--c-navBg) 92%, transparent)",
          borderColor: "var(--c-secondary)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Couple names + countdown */}
            <Link
              to={`/w/${slug}/home`}
              className="flex flex-col min-w-0"
            >
              <span
                className="font-serif text-lg truncate"
                style={{ color: "var(--c-navText)", fontFamily: "var(--f-heading)" }}
              >
                {coupleNames}
              </span>
              {dUntil !== null && dUntil > 0 && (
                <span
                  className="text-xs"
                  style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}
                >
                  {dUntil} days to go
                </span>
              )}
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={`/w/${slug}/${item.path}`}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors",
                    isActive(item) ? "font-medium" : ""
                  )}
                  style={{
                    color: isActive(item) ? "var(--c-navText)" : "color-mix(in srgb, var(--c-navText) 70%, transparent)",
                    background: isActive(item) ? "color-mix(in srgb, var(--c-navText) 8%, transparent)" : "transparent",
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors hover:opacity-70"
                style={{ color: "var(--c-navText)" }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </nav>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: "var(--c-navText)" }}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile nav */}
          {mobileOpen && (
            <nav className="lg:hidden pb-4 animate-slide-down">
              <div className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={`/w/${slug}/${item.path}`}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors",
                      isActive(item) ? "font-medium" : ""
                    )}
                    style={{
                      color: isActive(item) ? "var(--c-navText)" : "color-mix(in srgb, var(--c-navText) 70%, transparent)",
                      background: isActive(item) ? "color-mix(in srgb, var(--c-navText) 8%, transparent)" : "transparent",
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={() => { setMobileOpen(false); handleSignOut(); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors w-full hover:opacity-70"
                  style={{ color: "var(--c-navText)" }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* ─── Main content ─── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {guest && (
          <p
            className="text-sm mb-6 text-center"
            style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}
          >
            Welcome, <span style={{ color: "var(--c-text)" }}>{guest.full_name}</span>!
          </p>
        )}
        {children}
      </main>

      {/* ─── Footer ─── */}
      <footer
        className="border-t"
        style={{
          background: "var(--c-footerBg)",
          borderColor: "color-mix(in srgb, var(--c-footerBg) 80%, var(--c-text))",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center">
          {/* Decorative ornament */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10" style={{ background: "var(--c-footerText)", opacity: 0.3 }} />
            <Heart
              className="w-4 h-4"
              style={{ color: "var(--c-footerText)", opacity: 0.5 }}
            />
            <div className="h-px w-10" style={{ background: "var(--c-footerText)", opacity: 0.3 }} />
          </div>

          {/* Hashtag */}
          {wedding.hashtag && (
            <p
              className="font-serif text-lg mb-2"
              style={{ color: "var(--c-footerText)", fontFamily: "var(--f-heading)" }}
            >
              {wedding.hashtag}
            </p>
          )}

          {/* Couple names */}
          <p
            className="text-sm mb-1"
            style={{ color: "var(--c-footerText)", fontFamily: "var(--f-body)", opacity: 0.9 }}
          >
            {coupleNames}
          </p>

          {/* Wedding date */}
          {wedding.wedding_date && (
            <p
              className="text-xs"
              style={{ color: "var(--c-footerText)", fontFamily: "var(--f-body)", opacity: 0.6 }}
            >
              {formatDate(wedding.wedding_date)}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
