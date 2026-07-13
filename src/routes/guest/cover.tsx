import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CoverConfig } from "../../lib/supabase";
import { themeToCssVars, DEFAULT_THEME } from "../../lib/theme";
import { formatDate, getCountdown } from "../../lib/utils";
import type { CSSProperties } from "react";

export default function Cover() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const { data: event, isLoading, isError } = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  const theme = event?.theme || event?.draft_theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;
  const config: CoverConfig = event?.cover_config || event?.draft_cover_config || {};
  const eventName = event?.name || event?.draft_name || "Our Event";
  const eventDate = event?.event_date || event?.draft_event_date || null;

  const bgImage = config.bgImage || event?.cover_image || event?.draft_cover_image || "";
  const bgColor = config.bgColor || "#0f172a";
  const overlayColor = config.overlayColor || "#000000";
  const overlayOpacity = config.overlayOpacity ?? 0.4;
  const textColor = config.textColor || "#ffffff";
  const buttonColor = config.buttonColor || "#ffffff";
  const buttonText = config.buttonText || "Enter";
  const scriptFont = config.scriptFont || theme.scriptFont || "Cormorant Garamond";

  const handleEnter = () => {
    if (eventId) navigate(`/${eventId}/login`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="w-10 h-10 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center px-6">
          <p className="text-xl font-semibold text-slate-900 mb-2">Event not found</p>
          <p className="text-sm text-slate-500">The invitation you are looking for could not be found.</p>
        </div>
      </div>
    );
  }

  const countdown = config.showCountdown && eventDate ? getCountdown(eventDate) : null;

  const backgroundStyle: CSSProperties = bgImage
    ? {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { backgroundColor: bgColor };

  return (
    <div
      style={{ ...cssVars, ...backgroundStyle }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: overlayColor, opacity: bgImage ? overlayOpacity : 0 }}
      />

      <div
        className={`relative z-10 text-center px-8 max-w-2xl transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {config.customText && (
          <p
            className="italic text-lg md:text-xl mb-4 tracking-wide"
            style={{ color: textColor, fontFamily: `"${scriptFont}", serif` }}
          >
            {config.customText}
          </p>
        )}

        <h1
          className="text-5xl md:text-7xl font-light leading-tight mb-4"
          style={{ color: textColor, fontFamily: `"${scriptFont}", serif` }}
        >
          {eventName}
        </h1>

        {config.showDate && eventDate && (
          <p className="text-lg md:text-xl tracking-[0.2em] uppercase mb-8" style={{ color: textColor }}>
            {formatDate(eventDate)}
          </p>
        )}

        {countdown && !countdown.isPast && (
          <div className="flex items-center justify-center gap-6 mb-10">
            {([
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
              { label: "Seconds", value: countdown.seconds },
            ]).map((unit) => (
              <div key={unit.label} className="text-center">
                <div className="text-3xl md:text-4xl font-light" style={{ color: textColor }}>
                  {String(unit.value).padStart(2, "0")}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] mt-1" style={{ color: textColor, opacity: 0.7 }}>
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleEnter}
          className="px-12 py-3 text-lg tracking-[0.2em] uppercase transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: buttonColor,
            color: bgColor,
            border: `1px solid ${buttonColor}`,
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
