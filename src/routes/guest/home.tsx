import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, CalendarHeart, BookOpen, Images, ChevronRight } from "lucide-react";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import { formatDate, daysUntil, cn } from "@/lib/utils";
import { Card } from "@/components/ui";

export function GuestHome() {
  const { wedding, guest, loading } = useGuestData();

  const theme = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const dUntil = daysUntil(wedding?.wedding_date ?? null);
  const heroUrl = wedding?.hero_image_url ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia animate-fade-in">
        Loading…
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex items-center justify-center py-24 text-center animate-fade-in">
        <div>
          <h1 className="text-2xl font-serif text-onyx mb-2">Wedding Not Found</h1>
          <p className="text-sm text-sepia/70">We couldn't find the wedding you're looking for.</p>
        </div>
      </div>
    );
  }

  const quickLinks = [
    { to: "events", label: "Events", icon: CalendarHeart, desc: "View schedule & RSVP" },
    { to: "story", label: "Our Story", icon: BookOpen, desc: "How we got here" },
    { to: "gallery", label: "Gallery", icon: Images, desc: "Photos & memories" },
  ];

  return (
    <div style={cssVars as React.CSSProperties} className="animate-fade-in">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {heroUrl ? (
          <div className="absolute inset-0">
            <img src={heroUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, var(--c-secondary), var(--c-accent))" }}
          />
        )}

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-24 md:py-32">
          <p
            className="text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: heroUrl ? "rgba(255,255,255,0.85)" : "var(--c-textMuted)", fontFamily: "var(--f-body)" }}
          >
            We're getting married
          </p>

          <h1
            className="font-script leading-tight mb-4"
            style={{
              color: heroUrl ? "white" : "var(--c-text)",
              fontSize: "clamp(3rem, 8vw, 5.5rem)",
              fontFamily: "var(--f-heading)",
              fontStyle: "var(--f-style)",
              textShadow: heroUrl ? "0 2px 20px rgba(0,0,0,0.3)" : "none",
            }}
          >
            {wedding.couple_name_one}
            <span className="mx-3" style={{ color: heroUrl ? "rgba(255,255,255,0.7)" : "var(--c-accent)" }}>&</span>
            {wedding.couple_name_two}
          </h1>

          {wedding.wedding_date && (
            <div
              className="flex items-center gap-2 mb-2"
              style={{ color: heroUrl ? "rgba(255,255,255,0.9)" : "var(--c-textMuted)" }}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm" style={{ fontFamily: "var(--f-body)" }}>
                {formatDate(wedding.wedding_date)}
              </span>
            </div>
          )}

          {wedding.location && (
            <div
              className="flex items-center gap-2 mb-6"
              style={{ color: heroUrl ? "rgba(255,255,255,0.9)" : "var(--c-textMuted)" }}
            >
              <MapPin className="w-4 h-4" />
              <span className="text-sm" style={{ fontFamily: "var(--f-body)" }}>
                {wedding.location}
              </span>
            </div>
          )}

          {dUntil !== null && dUntil > 0 && (
            <div
              className="inline-flex items-baseline gap-1 px-6 py-3 rounded-full"
              style={{
                background: heroUrl ? "rgba(255,255,255,0.15)" : "var(--c-card)",
                backdropFilter: heroUrl ? "blur(8px)" : "none",
                border: heroUrl ? "1px solid rgba(255,255,255,0.2)" : "1px solid var(--c-secondary)",
                color: heroUrl ? "white" : "var(--c-text)",
              }}
            >
              <span className="text-3xl font-serif" style={{ fontFamily: "var(--f-heading)" }}>
                {dUntil}
              </span>
              <span className="text-xs ml-1" style={{ fontFamily: "var(--f-body)" }}>
                days to go
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Personalized welcome ── */}
      <section className="px-6 py-12 md:py-16" style={{ background: "var(--c-background)" }}>
        <div className="max-w-2xl mx-auto text-center animate-fade-in">
          {guest && (
            <p
              className="text-xs uppercase tracking-[0.3em] mb-3"
              style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}
            >
              Welcome, {guest.first_name || guest.full_name}!
            </p>
          )}
          <h2
            className="text-3xl md:text-4xl font-serif mb-4"
            style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)", fontStyle: "var(--f-style)" }}
          >
            We're so glad you're here
          </h2>
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}
          >
            We can't wait to celebrate our special day with you. Explore the site to find event details,
            our story, travel information, and more.
          </p>
        </div>
      </section>

      {/* ── Quick links ── */}
      <section className="px-6 pb-16 md:pb-24" style={{ background: "var(--c-background)" }}>
        <div className="max-w-4xl mx-auto grid gap-4 sm:grid-cols-3">
          {quickLinks.map(({ to, label, icon: Icon, desc }) => (
            <Link key={to} to={to} className="block group">
              <Card
                className="p-6 h-full transition-all duration-200 hover:shadow-md"
                style={{ borderColor: "var(--c-secondary)", background: "var(--c-card)" } as React.CSSProperties}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors group-hover:scale-110 transition-transform"
                    style={{ background: "var(--c-secondary)" }}
                  >
                    <Icon className="w-6 h-6" style={{ color: "var(--c-primary)" }} />
                  </div>
                  <h3
                    className="text-lg font-serif mb-1"
                    style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}
                  >
                    {label}
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}
                  >
                    {desc}
                  </p>
                  <ChevronRight
                    className="w-4 h-4 mt-3 transition-transform group-hover:translate-x-1"
                    style={{ color: "var(--c-textMuted)" }}
                  />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Countdown detail ── */}
      {dUntil !== null && dUntil > 0 && (
        <section className="px-6 py-16 md:py-20" style={{ background: "var(--c-card)" }}>
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <Clock className="w-8 h-8 mx-auto mb-4" style={{ color: "var(--c-accent)" }} />
            <h2
              className="text-2xl md:text-3xl font-serif mb-2"
              style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}
            >
              The Big Day
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
              {formatDate(wedding.wedding_date)}
            </p>
            <div
              className="inline-flex items-baseline gap-2 px-8 py-4 rounded-lg"
              style={{ background: "var(--c-background)", border: "1px solid var(--c-secondary)" }}
            >
              <span
                className="text-5xl font-serif"
                style={{ color: "var(--c-primary)", fontFamily: "var(--f-heading)" }}
              >
                {dUntil}
              </span>
              <span className="text-sm" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
                days remaining
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
