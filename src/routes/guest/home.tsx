import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, Heart, ChevronRight } from "lucide-react";
import { useGuestData } from "@/lib/use-guest-data";
import { formatDate, daysUntil } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function GuestHome() {
  const { wedding, guest, loading, slug } = useGuestData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        Loading…
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        Wedding details not found.
      </div>
    );
  }

  const countdown = daysUntil(wedding.wedding_date);
  const guestName = guest?.first_name || guest?.full_name || "Guest";
  const hasHeroImage = Boolean(wedding.hero_image_url);

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl">
        {hasHeroImage ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${wedding.hero_image_url})` }}
            />
            <div className="absolute inset-0 bg-onyx/40" />
            <div className="relative px-6 py-20 md:py-28 text-center text-cream">
              <p className="text-xs tracking-[0.3em] uppercase mb-6 opacity-90">
                We're getting married
              </p>
              <h1 className="font-script text-5xl md:text-7xl leading-tight mb-6">
                {wedding.couple_name_one} & {wedding.couple_name_two}
              </h1>
              {wedding.wedding_date && (
                <div className="flex items-center justify-center gap-3 text-sm md:text-base tracking-widest uppercase mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(wedding.wedding_date)}</span>
                </div>
              )}
              {wedding.location && (
                <div className="flex items-center justify-center gap-3 text-sm md:text-base tracking-widest uppercase">
                  <MapPin className="w-4 h-4" />
                  <span>{wedding.location}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-gradient-to-b from-mist to-cream px-6 py-20 md:py-28 text-center rounded-2xl border border-sand">
            <p className="text-xs tracking-[0.3em] uppercase text-sepia mb-6">
              We're getting married
            </p>
            <h1 className="font-script text-5xl md:text-7xl leading-tight text-onyx mb-6">
              {wedding.couple_name_one} & {wedding.couple_name_two}
            </h1>
            {wedding.wedding_date && (
              <div className="flex items-center justify-center gap-3 text-sm md:text-base tracking-widest uppercase text-sepia mb-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(wedding.wedding_date)}</span>
              </div>
            )}
            {wedding.location && (
              <div className="flex items-center justify-center gap-3 text-sm md:text-base tracking-widest uppercase text-sepia">
                <MapPin className="w-4 h-4" />
                <span>{wedding.location}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Countdown */}
      {countdown !== null && countdown >= 0 && (
        <section className="text-center">
          <div className="inline-flex flex-col items-center px-8 py-6 bg-card border border-sand rounded-xl">
            <div className="flex items-center gap-2 text-sepia text-xs tracking-[0.3em] uppercase mb-2">
              <Clock className="w-4 h-4" />
              <span>Counting Down</span>
            </div>
            <p className="font-serif text-4xl md:text-5xl text-onyx">
              {countdown === 0 ? "Today!" : countdown}
            </p>
            {countdown > 0 && (
              <p className="text-sepia text-sm tracking-widest uppercase mt-1">
                {countdown === 1 ? "Day to go" : "Days to go"}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Personalized Welcome */}
      <section className="text-center max-w-xl mx-auto">
        <Heart className="w-6 h-6 text-rose mx-auto mb-4" />
        <h2 className="font-serif text-2xl md:text-3xl text-onyx mb-3">
          Welcome, {guestName}!
        </h2>
        <p className="text-sepia leading-relaxed">
          We're so delighted to share our special day with you. Explore the
          details below and let us know if you'll be joining us.
        </p>
      </section>

      {/* Quick Links */}
      <section>
        <h3 className="font-serif text-lg text-sepia text-center mb-6 tracking-wide">
          Explore
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickLink
            to={`/w/${slug}/events`}
            icon={Calendar}
            title="Events"
            description="View the schedule and RSVP"
          />
          <QuickLink
            to={`/w/${slug}/story`}
            icon={Heart}
            title="Our Story"
            description="How we met and fell in love"
          />
          <QuickLink
            to={`/w/${slug}/gallery`}
            icon={Heart}
            title="Gallery"
            description="Photos of our journey"
          />
        </div>
      </section>

      {/* Hashtag */}
      {wedding.hashtag && (
        <section className="text-center pt-4">
          <p className="font-script text-3xl text-sepia">{wedding.hashtag}</p>
        </section>
      )}
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center gap-4 p-5 bg-card border border-sand rounded-xl",
        "hover:border-sepia hover:shadow-sm transition-all"
      )}
    >
      <div className="flex-shrink-0 w-11 h-11 rounded-full bg-mist flex items-center justify-center text-sepia">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-serif text-lg text-onyx leading-tight">{title}</h4>
        <p className="text-sepia text-sm truncate">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-sepia/50 group-hover:text-sepia group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

export default GuestHome;
