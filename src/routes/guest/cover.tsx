import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { DEFAULT_COVER_CONFIG, DEFAULT_LOGO_CONFIG } from "../../lib/theme";
import { formatDate, getCountdown } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

export default function Cover() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(getCountdown(null));

  const { data: event, isLoading, isError } = useQuery<UserEvent | null>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!eventId,
  });

  const eventDate = event?.event_date ?? null;
  const config = event ? { ...DEFAULT_COVER_CONFIG, ...event.cover_config } : DEFAULT_COVER_CONFIG;
  const logoConfig = event ? { ...DEFAULT_LOGO_CONFIG, ...event.logo_config } : DEFAULT_LOGO_CONFIG;

  useEffect(() => {
    if (!eventDate) return;
    setCountdown(getCountdown(eventDate));
    const interval = setInterval(() => {
      setCountdown(getCountdown(eventDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [eventDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-pulse text-white/60 text-sm">Loading...</div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">Event not found</h2>
          <p className="mt-1 text-sm text-gray-500">This event may be private or no longer available.</p>
        </div>
      </div>
    );
  }

  const handleEnter = () => {
    navigate(`/${eventId}/login`);
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-12"
      style={{
        background: config.bgImage
          ? `linear-gradient(${config.overlayColor} 0%, ${config.overlayColor} 100%), url(${config.bgImage}) center/cover no-repeat`
          : config.bgColor,
        color: config.textColor,
        fontFamily: config.font,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: config.overlayColor,
          opacity: config.overlayOpacity,
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto space-y-6">
        {logoConfig.enabled && (
          <div className="mb-2">
            {logoConfig.image ? (
              <img
                src={logoConfig.image}
                alt="Logo"
                className="h-16 w-16 object-contain rounded-full mx-auto"
                style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))" }}
              />
            ) : (
              <div
                className="font-bold leading-none"
                style={{
                  color: logoConfig.color,
                  fontSize: logoConfig.fontSize,
                  textShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                {logoConfig.text}
              </div>
            )}
          </div>
        )}

        {config.customText && (
          <p
            className="text-base opacity-80 tracking-wider uppercase"
            style={{ fontFamily: config.scriptFont }}
          >
            {config.customText}
          </p>
        )}

        <h1
          className="text-4xl sm:text-5xl font-bold leading-tight"
          style={{
            fontFamily: config.font,
            textShadow: "0 2px 12px rgba(0,0,0,0.15)",
          }}
        >
          {event.name}
        </h1>

        <div
          className="w-16 h-px"
          style={{ background: config.textColor, opacity: 0.4 }}
        />

        {config.showDate && event.event_date && (
          <p className="text-base opacity-80 tracking-wide">{formatDate(event.event_date)}</p>
        )}

        {config.showCountdown && !countdown.isPast && (
          <div className="flex gap-6 sm:gap-10 text-center pt-2">
            {(["days", "hours", "minutes", "seconds"] as const).map((key) => (
              <div key={key} className="flex flex-col items-center">
                <div
                  className="text-3xl sm:text-4xl font-bold tabular-nums"
                  style={{ fontFamily: config.font }}
                >
                  {String(countdown[key]).padStart(2, "0")}
                </div>
                <div className="text-[10px] sm:text-xs opacity-60 uppercase tracking-widest mt-1">
                  {key}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleEnter}
          className="mt-6 px-10 py-3.5 rounded-full text-base font-medium tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-xl"
          style={{
            background: config.buttonColor,
            color: config.bgColor,
            border: `1px solid ${config.buttonColor}`,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          {config.buttonText}
        </button>
      </div>
    </div>
  );
}
