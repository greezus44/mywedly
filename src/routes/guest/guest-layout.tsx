import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation, Link, Outlet } from "react-router-dom";
import {
  Menu, X, Home, Heart, Calendar, Image as ImageIcon,
  HelpCircle, Gift, Mail, LogOut, ChevronDown, MapPin,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Wedding, Guest, GuestSession } from "@/lib/supabase";
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
  { path: "travel", label: "Travel", icon: MapPin },
  { path: "faq", label: "FAQ", icon: HelpCircle },
  { path: "registry", label: "Registry", icon: Gift },
  { path: "contact", label: "Contact", icon: Mail },
];

export function GuestLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState<GuestSession | null>(null);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Check session + fetch wedding/guest data ──
  useEffect(() => {
    const s = getGuestSession();

    // No session → redirect to cover
    if (!s || (slug && s.weddingSlug !== slug)) {
      navigate(`/w/${slug}`, { replace: true });
      return;
    }

    setSession(s);

    Promise.all([
      supabase.from("weddings").select("*").eq("id", s.weddingId).maybeSingle(),
      supabase.from("guests").select("*").eq("id", s.guestId).maybeSingle(),
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

  const coupleNames = wedding
    ? `${wedding.couple_name_one} & ${wedding.couple_name_two}`
    : "";
  const dUntil = daysUntil(wedding?.wedding_date ?? null);

  const handleSignOut = () => {
    clearGuestSession();
    navigate(`/w/${slug}`, { replace: true });
  };

  // Determine active nav item from path
  const activeSegment = location.pathname.split("/").pop() ?? "home";
  const isActive = (item: NavItem) =>
    item.path === activeSegment || (activeSegment === "" && item.path === "home");

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ ...cssVars, background: "var(--c-background)" }}
      >
        <p
          className="text-sm tracking-widest uppercase animate-pulse"
          style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}
        >
          Loading…
        </p>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ ...cssVars, background: "var(--c-background)" }}
      >
        <div className="text-center px-6">
          <h1
            className="text-2xl mb-2"
            style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}
          >
            Wedding Not Found
          </h1>
          <button
            onClick={handleSignOut}
            className="text-sm underline"
            style={{ color: "var(--c-link)", fontFamily: "var(--f-body)" }}
          >
            Return to cover
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ ...cssVars, background: "var(--c-background)", fontFamily: "var(--f-body)" }}
    >
      {/* ═══════════════ Sticky Header ═══════════════ */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b transition-colors"
        style={{
          background: "color-mix(in srgb, var(--c-navBg) 92%, transparent)",
          borderColor: "var(--c-secondary)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* ── Top row: names + countdown + mobile toggle ── */}
          <div className="flex items-center justify-between h-16">
            <Link
              to={`/w/${slug}/home`}
              className="flex items-center gap-2 min-w-0"
            >
              <span
                className="text-base sm:text-lg truncate whitespace-nowrap"
                style={{
                  color: "var(--c-navText)",
                  fontFamily: "var(--f-heading)",
                  fontStyle: "var(--f-style)",
                }}
              >
                {coupleNames}
              </span>
            </Link>

            <div className="flex items-center gap-3">
              {/* Countdown badge */}
              {dUntil !== null && dUntil > 0 && (
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                  style={{
                    background: "color-mix(in srgb, var(--c-accent) 15%, transparent)",
                    color: "var(--c-navText)",
                    fontFamily: "var(--f-body)",
                  }}
                >
                  <Calendar className="w-3 h-3" />
                  {dUntil} days to go
                </span>
              )}

              {/* Desktop sign out */}
              <button
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--c-navText)", fontFamily: "var(--f-body)" }}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sign Out</span>
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg transition-colors"
                style={{ color: "var(--c-navText)" }}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* ── Desktop horizontal nav ── */}
          <nav className="hidden lg:flex items-center gap-1 h-12">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.path}
                  to={`/w/${slug}/${item.path}`}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                    active && "font-semibold"
                  )}
                  style={{
                    color: active ? "var(--c-navText)" : "color-mix(in srgb, var(--c-navText) 70%, transparent)",
                    background: active ? "color-mix(in srgb, var(--c-accent) 18%, transparent)" : "transparent",
                    fontFamily: "var(--f-body)",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "color-mix(in srgb, var(--c-accent) 8%, transparent)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Mobile dropdown nav ── */}
        {mobileOpen && (
          <nav
            className="lg:hidden border-t animate-slide-down max-h-[70vh] overflow-y-auto"
            style={{
              borderColor: "var(--c-secondary)",
              background: "var(--c-navBg)",
            }}
          >
            <div className="px-4 py-3 space-y-1">
              {/* Mobile countdown */}
              {dUntil !== null && dUntil > 0 && (
                <div
                  className="flex items-center gap-2 px-3 py-2 text-sm"
                  style={{ color: "var(--c-navText)", fontFamily: "var(--f-body)" }}
                >
                  <Calendar className="w-4 h-4" />
                  {dUntil} days to go
                </div>
              )}

              {NAV_ITEMS.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.path}
                    to={`/w/${slug}/${item.path}`}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors",
                      active && "font-semibold"
                    )}
                    style={{
                      color: "var(--c-navText)",
                      background: active ? "color-mix(in srgb, var(--c-accent) 15%, transparent)" : "transparent",
                      fontFamily: "var(--f-body)",
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Mobile sign out */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg w-full transition-colors"
                style={{ color: "var(--c-navText)", fontFamily: "var(--f-body)" }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* ═══════════════ Main Content ═══════════════ */}
      <main
        className="flex-1 w-full"
        style={{ background: "var(--c-background)" }}
      >
        <Outlet />
      </main>

      {/* ═══════════════ Footer ═══════════════ */}
      <footer
        className="px-6 py-10 text-center"
        style={{ background: "var(--c-footerBg)" }}
      >
        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div
            className="h-px w-12"
            style={{ background: "var(--c-footerText)", opacity: 0.3 }}
          />
          <Heart
            className="w-4 h-4"
            style={{ color: "var(--c-footerText)", opacity: 0.5 }}
          />
          <div
            className="h-px w-12"
            style={{ background: "var(--c-footerText)", opacity: 0.3 }}
          />
        </div>

        {wedding.hashtag && (
          <p
            className="text-lg mb-2"
            style={{
              color: "var(--c-footerText)",
              fontFamily: "var(--f-heading)",
              fontStyle: "var(--f-style)",
            }}
          >
            {wedding.hashtag}
          </p>
        )}

        {wedding.wedding_date && (
          <p
            className="text-xs"
            style={{
              color: "var(--c-footerText)",
              opacity: 0.7,
              fontFamily: "var(--f-body)",
            }}
          >
            {formatDate(wedding.wedding_date)}
          </p>
        )}

        {wedding.location && (
          <p
            className="text-xs mt-1"
            style={{
              color: "var(--c-footerText)",
              opacity: 0.5,
              fontFamily: "var(--f-body)",
            }}
          >
            {wedding.location}
          </p>
        )}

        {/* Guest name + sign out */}
        {guest && (
          <p
            className="text-xs mt-4"
            style={{
              color: "var(--c-footerText)",
              opacity: 0.4,
              fontFamily: "var(--f-body)",
            }}
          >
            Signed in as {guest.full_name}
          </p>
        )}
      </footer>
    </div>
  );
}
