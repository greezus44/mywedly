import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { cn, formatDate, formatTime, getCountdown } from "../../lib/utils";
import { RUSTY_COVER_CONFIG } from "../../lib/theme";
import { Button } from "../../components/ui/Button";

export type Lang = "en" | "id";

async function fetchEventBySlug(slug: string): Promise<UserEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .or(`slug.eq.${slug},draft_slug.eq.${slug}`)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as UserEvent | null) ?? null;
}

export default function RustyCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: event } = useQuery({
    queryKey: ["rusty-event", slug],
    queryFn: () => fetchEventBySlug(slug || ""),
    enabled: !!slug,
  });

  const cover = { ...RUSTY_COVER_CONFIG, ...(event?.cover_config || {}) };
  const hasBgImage = Boolean(cover.bgImage || event?.cover_image);

  // live countdown
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!cover.showCountdown || !event?.event_date) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [cover.showCountdown, event?.event_date]);

  const countdown = getCountdown(event?.event_date || null);

  const handleEnter = () => {
    navigate(`/${slug || event?.slug || event?.id || ""}/login`);
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: cover.bgColor || "#F5ECD7",
        color: cover.textColor || "#3D3528",
      }}
    >
      {/* Background image with overlay */}
      {hasBgImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${cover.bgImage || event?.cover_image})`,
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: cover.overlayColor || "#3D3528",
              opacity: cover.overlayOpacity ?? 0.45,
            }}
            aria-hidden
          />
        </>
      )}

      {/* Decorative top border */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: cover.buttonColor || "#B8962E" }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 max-w-3xl mx-auto animate-fade-in-up">
        {cover.customText && (
          <p
            className="font-heading italic text-lg sm:text-xl tracking-wide mb-6"
            style={{ color: cover.buttonColor || "#B8962E" }}
          >
            {cover.customText}
          </p>
        )}

        {/* Ornamental divider */}
        <div className="flex items-center gap-3 mb-8" aria-hidden>
          <span
            className="block h-px w-12"
            style={{ backgroundColor: cover.buttonColor || "#B8962E" }}
          />
          <span
            className="text-xl"
            style={{ color: cover.buttonColor || "#B8962E" }}
          >
            ❦
          </span>
          <span
            className="block h-px w-12"
            style={{ backgroundColor: cover.buttonColor || "#B8962E" }}
          />
        </div>

        {/* Event name */}
        <h1
          className="font-heading text-5xl sm:text-6xl md:text-7xl leading-tight tracking-wide mb-6"
          style={{ color: cover.textColor || "#3D3528" }}
        >
          {event?.name || "Our Wedding"}
        </h1>

        {/* Date & venue */}
        {cover.showDate && event?.event_date && (
          <div className="flex flex-col items-center gap-2 mb-8">
            <div
              className="flex items-center gap-2 text-base sm:text-lg"
              style={{ color: cover.textColor || "#3D3528" }}
            >
              <CalendarDays
                className="w-4 h-4"
                style={{ color: cover.buttonColor || "#B8962E" }}
              />
              <span>{formatDate(event.event_date)}</span>
              {event?.event_time && (
                <>
                  <span
                    className="mx-1"
                    style={{ color: cover.buttonColor || "#B8962E" }}
                  >
                    •
                  </span>
                  <Clock
                    className="w-4 h-4"
                    style={{ color: cover.buttonColor || "#B8962E" }}
                  />
                  <span>{formatTime(event.event_time)}</span>
                </>
              )}
            </div>
            {event?.venue && (
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: cover.textColor || "#3D3528", opacity: 0.85 }}
              >
                <MapPin
                  className="w-4 h-4"
                  style={{ color: cover.buttonColor || "#B8962E" }}
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
                  border: `1px solid ${cover.buttonColor || "#B8962E"}`,
                  backgroundColor: hasBgImage
                    ? "rgba(245, 236, 215, 0.12)"
                    : "transparent",
                }}
              >
                <span
                  className="font-heading text-3xl sm:text-4xl leading-none"
                  style={{ color: cover.textColor || "#3D3528" }}
                >
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span
                  className="mt-1 text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: cover.buttonColor || "#B8962E" }}
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
          className={cn(
            "mt-2 px-12 py-3.5 text-sm uppercase tracking-[0.25em] font-medium",
          )}
          style={{
            backgroundColor: cover.buttonColor || "#B8962E",
            color: "#FAF3E0",
            borderRadius: 0,
          }}
        >
          {cover.buttonText || "Enter"}
        </Button>
      </div>

      {/* Decorative bottom border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ backgroundColor: cover.buttonColor || "#B8962E" }}
        aria-hidden
      />
    </div>
  );
}
