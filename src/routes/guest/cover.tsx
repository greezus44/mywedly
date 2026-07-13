import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import type { UserEvent, CoverConfig } from "../../lib/supabase";
import { DEFAULT_THEME } from "../../lib/theme";
import { formatDate, getCountdown } from "../../lib/utils";
import { fetchPublicEvent } from "./guest-layout";

const DEFAULT_COVER_CONFIG: CoverConfig = {
  bgColor: "#0f172a",
  textColor: "#ffffff",
  buttonColor: "#0ea5e9",
  buttonText: "Enter",
  showDate: true,
  showCountdown: true,
  overlayOpacity: 0.4,
};

export default function Cover() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(getCountdown(null));

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const { data: event, isLoading, error } = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    queryFn: () => fetchPublicEvent(eventId!),
    enabled: !!eventId,
  });

  useEffect(() => {
    if (!event?.event_date) return;
    const interval = setInterval(() => {
      setCountdown(getCountdown(event.event_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [event?.event_date]);

  if (!eventId) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-12 h-12 rounded-full border-2 border-slate-600 border-t-white animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-6">
        <div className="text-center">
          <p className="text-2xl font-semibold text-white mb-2">Event Not Found</p>
          <p className="text-sm text-slate-400">The event you are looking for may no longer be available.</p>
        </div>
      </div>
    );
  }

  const config = { ...DEFAULT_COVER_CONFIG, ...(event.cover_config || {}) };
  const theme = event.theme || DEFAULT_THEME;
  const bgImage = config.bgImage || event.cover_image;
  const bgColor = config.bgColor || theme.bgColor || DEFAULT_COVER_CONFIG.bgColor!;
  const overlayColor = config.overlayColor || "#000000";
  const overlayOpacity = config.overlayOpacity ?? DEFAULT_COVER_CONFIG.overlayOpacity!;
  const textColor = config.textColor || "#ffffff";
  const buttonColor = config.buttonColor || theme.accentColor || DEFAULT_COVER_CONFIG.buttonColor!;
  const buttonText = config.buttonText || DEFAULT_COVER_CONFIG.buttonText!;
  const headingFont = theme.headingFont || "Inter";
  const scriptFont = config.scriptFont || theme.scriptFont || "Inter";

  const handleEnter = () => {
    navigate(`/${eventId}/login`);
  };

  return (
    <div
      className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      {bgImage && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
        />
      )}

      <div
        className={`relative z-10 text-center px-8 max-w-lg transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {config.customText && (
          <p
            className="text-base md:text-lg italic mb-6"
            style={{ color: textColor, fontFamily: `"${scriptFont}", serif` }}
          >
            {config.customText}
          </p>
        )}

        <h1
          className="text-4xl md:text-6xl font-medium leading-tight mb-2"
          style={{ color: textColor, fontFamily: `"${headingFont}", sans-serif` }}
        >
          {event.name}
        </h1>

        {config.showDate && event.event_date && (
          <p
            className="text-sm md:text-base tracking-[0.2em] uppercase mt-4 mb-8"
            style={{ color: textColor, opacity: 0.85 }}
          >
            {formatDate(event.event_date)}
          </p>
        )}

        {config.showCountdown && event.event_date && !countdown.isPast && (
          <div className="flex items-center justify-center gap-6 mb-10">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
              { label: "Seconds", value: countdown.seconds },
            ].map((unit) => (
              <div key={unit.label} className="text-center">
                <div
                  className="text-2xl md:text-3xl font-semibold tabular-nums"
                  style={{ color: textColor }}
                >
                  {String(unit.value).padStart(2, "0")}
                </div>
                <div
                  className="text-[10px] tracking-[0.15em] uppercase mt-1"
                  style={{ color: textColor, opacity: 0.7 }}
                >
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {event.venue && (
          <p
            className="text-sm italic mb-10"
            style={{ color: textColor, opacity: 0.75, fontFamily: `"${scriptFont}", serif` }}
          >
            {event.venue}
          </p>
        )}

        <button
          onClick={handleEnter}
          className="group inline-flex items-center gap-2 px-10 py-3 text-sm tracking-[0.2em] uppercase font-medium transition-all duration-300 hover:gap-4"
          style={{
            backgroundColor: buttonColor,
            color: "#ffffff",
            borderRadius: "var(--radius, 8px)",
          }}
        >
          {buttonText}
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>

      <div className="absolute bottom-6 left-0 right-0 text-center z-10">
        <p
          className="text-[10px] tracking-[0.3em] uppercase opacity-50"
          style={{ color: textColor }}
        >
          {event.event_type} Invitation
        </p>
      </div>
    </div>
  );
}
