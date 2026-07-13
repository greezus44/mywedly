import { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { CalendarDays, Clock, MapPin, ArrowRight } from "lucide-react";
import { type UserEvent, type CoverConfig } from "../../lib/supabase";
import { cn, formatDate, formatTime, getCountdown } from "../../lib/utils";
import { DEFAULT_THEME } from "../../lib/theme";
import { Button } from "../../components/ui/Button";

const DEFAULT_COVER_CONFIG: CoverConfig = {
  bgColor: DEFAULT_THEME.bgColor,
  textColor: DEFAULT_THEME.textColor,
  buttonColor: DEFAULT_THEME.primaryColor,
  buttonText: "Enter",
  showDate: true,
  showCountdown: true,
};

export default function GuestCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { event } = useOutletContext<{ event: UserEvent }>();

  const cover: CoverConfig = { ...DEFAULT_COVER_CONFIG, ...(event?.cover_config || {}) };
  const hasBgImage = Boolean(cover.bgImage || event?.cover_image);

  // live countdown ticker
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!cover.showCountdown || !event?.event_date) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [cover.showCountdown, event?.event_date]);

  const countdown = getCountdown(event?.event_date || null);

  const eventSlug = slug || event?.slug || event?.id || "";

  const handleEnter = () => {
    navigate(`/e/${eventSlug}/login`);
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: cover.bgColor || DEFAULT_THEME.bgColor,
        color: cover.textColor || DEFAULT_THEME.textColor,
      }}
    >
      {/* Background image with overlay */}
      {hasBgImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${cover.bgImage || event?.cover_image})` }}
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: cover.overlayColor || "#1a1a1a",
              opacity: cover.overlayOpacity ?? 0.4,
            }}
            aria-hidden
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 max-w-3xl mx-auto animate-fade-in-up">
        {cover.customText && (
          <p
            className="font-heading italic text-lg sm:text-xl tracking-wide mb-6"
            style={{ color: cover.buttonColor || DEFAULT_THEME.primaryColor }}
          >
            {cover.customText}
          </p>
        )}

        {/* Event name */}
        <h1
          className="font-heading text-5xl sm:text-6xl md:text-7xl leading-tight tracking-wide mb-6"
          style={{ color: cover.textColor || DEFAULT_THEME.textColor }}
        >
          {event?.name || "You're Invited"}
        </h1>

        {/* Date & venue */}
        {cover.showDate && event?.event_date && (
          <div className="flex flex-col items-center gap-2 mb-8">
            <div
              className="flex items-center gap-2 text-base sm:text-lg"
              style={{ color: cover.textColor || DEFAULT_THEME.textColor }}
            >
              <CalendarDays
                className="w-4 h-4"
                style={{ color: cover.buttonColor || DEFAULT_THEME.primaryColor }}
              />
              <span>{formatDate(event.event_date)}</span>
              {event?.event_time && (
                <>
                  <span
                    className="mx-1"
                    style={{ color: cover.buttonColor || DEFAULT_THEME.primaryColor }}
                  >
                    •
                  </span>
                  <Clock
                    className="w-4 h-4"
                    style={{ color: cover.buttonColor || DEFAULT_THEME.primaryColor }}
                  />
                  <span>{formatTime(event.event_time)}</span>
                </>
              )}
            </div>
            {event?.venue && (
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: cover.textColor || DEFAULT_THEME.textColor, opacity: 0.8 }}
              >
                <MapPin
                  className="w-4 h-4"
                  style={{ color: cover.buttonColor || DEFAULT_THEME.primaryColor }}
                />
                <span>{event.venue}</span>
              </div>
            )}
          </div>
        )}

        {/* Countdown */}
        {cover.showCountdown && !countdown.isPast && (
          <div className="flex items-stretch gap-3 sm:gap-6 mb-10">
            {([
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
              { label: "Seconds", value: countdown.seconds },
            ] as const).map((unit) => (
              <div
                key={unit.label}
                className="flex flex-col items-center min-w-[64px] px-3 py-3"
                style={{
                  border: `1px solid ${cover.buttonColor || DEFAULT_THEME.primaryColor}`,
                  backgroundColor: hasBgImage ? "rgba(255,255,255,0.08)" : "transparent",
                }}
              >
                <span
                  className="font-heading text-3xl sm:text-4xl leading-none"
                  style={{ color: cover.textColor || DEFAULT_THEME.textColor }}
                >
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span
                  className="mt-1 text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: cover.buttonColor || DEFAULT_THEME.primaryColor }}
                >
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Enter button */}
        <Button
          onClick={handleEnter}
          size="lg"
          className={cn("mt-2 px-12 py-3.5 text-sm uppercase tracking-[0.25em] font-medium")}
          style={{
            backgroundColor: cover.buttonColor || DEFAULT_THEME.primaryColor,
            color: DEFAULT_THEME.bgColor,
            borderRadius: "var(--radius)",
          }}
        >
          {cover.buttonText || "Enter"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
