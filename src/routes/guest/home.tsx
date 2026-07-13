import { useMemo } from "react";
import { Calendar, MapPin, Clock, Heart, ArrowRight, BookOpen, Images, CalendarDays } from "lucide-react";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import type { ThemeConfig } from "@/lib/theme";
import { formatDate, formatTime, daysUntil, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui";

export function GuestHome() {
  const { wedding, guest, loading } = useGuestData();
  const theme: ThemeConfig = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex items-center justify-center py-24 text-center">
        <p className="text-sepia">Wedding not found.</p>
      </div>
    );
  }

  const countdown = daysUntil(wedding.wedding_date);
  const coupleName = `${wedding.couple_name_one} & ${wedding.couple_name_two}`;
  const scriptFont = theme.typography.headingFont === "Inter" ? "'Dancing Script', cursive" : `'${theme.typography.headingFont}', serif`;

  return (
    <div style={cssVars as React.CSSProperties} className="animate-fade-in">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        {wedding.hero_image_url && (
          <div className="absolute inset-0">
            <img
              src={wedding.hero_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />
          </div>
        )}

        <div
          className={cn(
            "relative px-6 py-24 sm:py-32 text-center",
            !wedding.hero_image_url && "bg-[var(--c-background)]"
          )}
        >
          <p
            className="text-xs sm:text-sm uppercase tracking-[0.3em] mb-6"
            style={{ color: wedding.hero_image_url ? "#fff" : "var(--c-textMuted)" }}
          >
            We're getting married
          </p>

          <h1
            className="text-5xl sm:text-6xl md:text-7xl mb-6 leading-tight"
            style={{
              fontFamily: scriptFont,
              color: wedding.hero_image_url ? "#fff" : "var(--c-text)",
              fontStyle: theme.typography.fontStyle,
            }}
          >
            {coupleName}
          </h1>

          {wedding.wedding_date && (
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm sm:text-base"
              style={{ color: wedding.hero_image_url ? "#fff" : "var(--c-textMuted)" }}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(wedding.wedding_date)}
              </span>
              {wedding.wedding_date && (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatTime(wedding.wedding_date)}
                </span>
              )}
              {wedding.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {wedding.location}
                </span>
              )}
            </div>
          )}

          {/* Countdown */}
          {countdown !== null && countdown > 0 && (
            <div className="mt-12 flex flex-col items-center">
              <p
                className="text-xs uppercase tracking-[0.3em] mb-3"
                style={{ color: wedding.hero_image_url ? "#fff" : "var(--c-textMuted)" }}
              >
                Counting down
              </p>
              <div className="flex items-center gap-4 sm:gap-8">
                <CountdownUnit value={countdown} label="Days" hero={!!wedding.hero_image_url} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Personalized welcome ─── */}
      {guest && (
        <section className="px-6 py-12 text-center" style={{ background: "var(--c-background)" }}>
          <div className="max-w-2xl mx-auto">
            <Heart className="w-6 h-6 mx-auto mb-3" style={{ color: "var(--c-accent)" }} />
            <h2
              className="text-3xl sm:text-4xl font-serif mb-2"
              style={{ color: "var(--c-text)" }}
            >
              Welcome, {guest.first_name || guest.full_name.split(" ")[0]}!
            </h2>
            <p className="text-sm" style={{ color: "var(--c-textMuted)" }}>
              We're so glad you're here. Explore the details of our special day below.
            </p>
          </div>
        </section>
      )}

      {/* ─── Quick links ─── */}
      <section className="px-6 py-12" style={{ background: "var(--c-background)" }}>
        <div className="max-w-4xl mx-auto grid gap-6 sm:grid-cols-3">
          <QuickLink
            icon={<CalendarDays className="w-6 h-6" />}
            title="Events"
            description="View schedule and RSVP"
            href="#/events"
            theme={theme}
          />
          <QuickLink
            icon={<BookOpen className="w-6 h-6" />}
            title="Our Story"
            description="How we got here"
            href="#/story"
            theme={theme}
          />
          <QuickLink
            icon={<Images className="w-6 h-6" />}
            title="Gallery"
            description="Moments we've shared"
            href="#/gallery"
            theme={theme}
          />
        </div>
      </section>
    </div>
  );
}

function CountdownUnit({ value, label, hero }: { value: number; label: string; hero: boolean }) {
  return (
    <div className="text-center">
      <div
        className={cn(
          "text-4xl sm:text-5xl font-serif",
        )}
        style={{ color: hero ? "#fff" : "var(--c-text)" }}
      >
        {value}
      </div>
      <div
        className="text-xs uppercase tracking-widest mt-1"
        style={{ color: hero ? "#fff" : "var(--c-textMuted)" }}
      >
        {label}
      </div>
    </div>
  );
}

function QuickLink({
  icon,
  title,
  description,
  href,
  theme,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  theme: ThemeConfig;
}) {
  return (
    <a href={href} className="block group">
      <Card className="p-6 text-center h-full transition-all hover:shadow-md" >
        <div
          className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 transition-colors"
          style={{ background: "var(--c-secondary)", color: "var(--c-primary)" }}
        >
          {icon}
        </div>
        <h3
          className="text-lg font-serif mb-1"
          style={{ color: "var(--c-text)" }}
        >
          {title}
        </h3>
        <p className="text-sm" style={{ color: "var(--c-textMuted)" }}>
          {description}
        </p>
        <div
          className="mt-3 inline-flex items-center gap-1 text-xs uppercase tracking-widest transition-transform group-hover:translate-x-0.5"
          style={{ color: "var(--c-link)" }}
        >
          View <ArrowRight className="w-3 h-3" />
        </div>
      </Card>
    </a>
  );
}

export default GuestHome;
