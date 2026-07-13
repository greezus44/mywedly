import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Wedding, Guest, GuestSession } from "@/lib/supabase";
import { getGuestSession, clearGuestSession } from "@/lib/guest-auth";
import { daysUntil, formatDate } from "@/lib/utils";
import { Menu, X, Home, Calendar, Heart, Image as ImageIcon, MapPin, HelpCircle, Gift, Mail, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { path: "home", label: "Home", icon: Home },
  { path: "events", label: "Events", icon: Calendar },
  { path: "story", label: "Our Story", icon: Heart },
  { path: "gallery", label: "Gallery", icon: ImageIcon },
  { path: "travel", label: "Travel", icon: MapPin },
  { path: "faq", label: "FAQ", icon: HelpCircle },
  { path: "registry", label: "Registry", icon: Gift },
  { path: "contact", label: "Contact", icon: Mail },
];

export function GuestLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<GuestSession | null>(null);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const s = getGuestSession();
    if (!s) {
      navigate(`/w/${slug}`);
      return;
    }
    setSession(s);
    supabase.from("weddings").select("*").eq("id", s.weddingId).maybeSingle().then(({ data }) => {
      if (data) setWedding(data as Wedding);
    });
    supabase.from("guests").select("*").eq("id", s.guestId).maybeSingle().then(({ data }) => {
      if (data) setGuest(data as Guest);
    });
  }, [slug, navigate]);

  useEffect(() => {
    if (wedding?.wedding_date) {
      const d = daysUntil(wedding.wedding_date);
      setCountdown(d);
    }
  }, [wedding]);

  const handleSignOut = () => {
    clearGuestSession();
    navigate(`/w/${slug}`);
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center text-sepia">Redirecting…</div>;
  }

  const activePath = location.pathname.split("/").pop();

  return (
    <div className="min-h-screen bg-parchment">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-parchment/95 backdrop-blur-sm border-b border-sand">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={`/w/${slug}/home`} className="font-serif text-lg text-onyx">
            {wedding ? `${wedding.couple_name_one} & ${wedding.couple_name_two}` : "Wedding"}
          </Link>
          <div className="flex items-center gap-4">
            {countdown !== null && countdown >= 0 && (
              <span className="hidden sm:block text-xs text-sepia tracking-widest uppercase">
                {countdown === 0 ? "Today!" : `${countdown} days to go`}
              </span>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-sepia">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button onClick={handleSignOut} className="hidden md:flex items-center gap-1 text-sepia text-sm hover:text-onyx">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
        {/* Desktop nav */}
        <nav className="hidden md:block border-t border-sand/50">
          <div className="max-w-5xl mx-auto px-4 flex gap-1">
            {NAV.map((item) => (
              <Link
                key={item.path}
                to={`/w/${slug}/${item.path}`}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-sm transition-colors border-b-2",
                  activePath === item.path
                    ? "border-sepia text-onyx font-medium"
                    : "border-transparent text-sepia hover:text-onyx"
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden bg-parchment border-b border-sand animate-slide-up">
          <div className="px-4 py-2 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.path}
                to={`/w/${slug}/${item.path}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                  activePath === item.path ? "bg-onyx/5 text-onyx font-medium" : "text-sepia"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sepia w-full">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </nav>
      )}

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12 animate-fade-in">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-sand mt-16 py-8 text-center">
        {wedding?.hashtag && <p className="font-serif text-lg text-sepia mb-1">{wedding.hashtag}</p>}
        <p className="text-xs text-sepia/50 uppercase tracking-widest">
          {wedding ? `${wedding.couple_name_one} & ${wedding.couple_name_two}` : "Wedding"}
          {wedding?.wedding_date && ` · ${formatDate(wedding.wedding_date)}`}
        </p>
      </footer>
    </div>
  );
}

export type GuestContext = { wedding: Wedding | null; guest: Guest | null; session: GuestSession | null };
