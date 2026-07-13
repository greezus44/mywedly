import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { DEFAULT_THEME, themeToCssVars } from "../../lib/theme";
import { formatDate, getCountdown } from "../../lib/utils";

export default function GuestCover() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading, isError } = useQuery<UserEvent>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId!)
        .single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  const [countdown, setCountdown] = useState(getCountdown(event?.event_date ?? null));

  useEffect(() => {
    if (!event?.event_date) return;
    const timer = setInterval(() => setCountdown(getCountdown(event.event_date)), 1000);
    return () => clearInterval(timer);
  }, [event?.event_date]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-lg text-slate-400">Loading...</div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-lg text-slate-700">Event not found</p>
          <button onClick={() => navigate("/")} className="mt-3 text-sm text-slate-500 underline">Go home</button>
        </div>
      </div>
    );
  }

  const config = event.cover_config || {};
  const theme = event.theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;

  const bgImage = config.bgImage || event.cover_image;
  const bgColor = config.bgColor || "#0f172a";
  const overlayColor = config.overlayColor || "#000000";
  const overlayOpacity = config.overlayOpacity ?? 0.4;
  const textColor = config.textColor || "#ffffff";
  const buttonColor = config.buttonColor || theme.primaryColor || "#0ea5e9";
  const buttonText = config.buttonText || "Enter";
  const scriptFont = config.scriptFont || theme.scriptFont || "Cormorant Garamond";
  const showDate = config.showDate !== false;
  const showCountdown = config.showCountdown === true;

  const heroStyle: CSSProperties = {
    ...cssVars,
    backgroundColor: bgColor,
    backgroundImage: bgImage ? `url(${bgImage})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: textColor,
    fontFamily: `"${scriptFont}", serif`,
  };

  return (
    <div style={heroStyle} className="min-h-screen flex flex-col items-center justify-center relative px-4 text-center">
      {bgImage && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
        />
      )}
      <div className="relative z-10 max-w-2xl mx-auto">
        {config.customText && (
          <p className="text-base md:text-lg mb-4 opacity-90" style={{ fontFamily: `"${scriptFont}", serif` }}>
            {config.customText}
          </p>
        )}
        <h1 className="text-4xl md:text-6xl font-medium mb-4" style={{ fontFamily: `"${scriptFont}", serif` }}>
          {event.name}
        </h1>
        {showDate && event.event_date && (
          <div className="flex items-center justify-center gap-2 mb-6 opacity-90">
            <Calendar className="w-5 h-5" />
            <span className="text-base md:text-lg" style={{ fontFamily: `"${theme.bodyFont || "Inter"}", sans-serif` }}>
              {formatDate(event.event_date)}
            </span>
          </div>
        )}
        {showCountdown && !countdown.isPast && (
          <div className="flex items-center justify-center gap-6 mb-8">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
              { label: "Seconds", value: countdown.seconds },
            ].map((unit) => (
              <div key={unit.label} className="flex flex-col items-center">
                <span className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: `"${theme.bodyFont || "Inter"}", sans-serif` }}>
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="text-xs uppercase tracking-wider opacity-70" style={{ fontFamily: `"${theme.bodyFont || "Inter"}", sans-serif` }}>
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => navigate(`/${eventId}/login`)}
          className="px-8 py-3 rounded-lg text-base font-medium transition-transform hover:scale-105"
          style={{ backgroundColor: buttonColor, color: "#ffffff", borderRadius: "var(--radius)" }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
