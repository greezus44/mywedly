import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase, UserEvent, CoverConfig } from "../../lib/supabase";
import { DEFAULT_COVER_CONFIG } from "../../lib/theme";
import { formatDate, getCountdown } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

function normalizeEvent(data: any): UserEvent {
  return {
    ...data,
    cover_config: data.cover_config || {},
    login_config: data.login_config || {},
    theme: data.theme || {},
    logo_config: data.logo_config || {},
    content: data.content || {},
    sharing_config: data.sharing_config || {},
    draft_cover_config: data.draft_cover_config || data.cover_config || {},
    draft_login_config: data.draft_login_config || data.login_config || {},
    draft_theme: data.draft_theme || data.theme || {},
    draft_logo_config: data.draft_logo_config || data.logo_config || {},
    draft_content: data.draft_content || data.content || {},
    draft_sharing_config: data.draft_sharing_config || data.sharing_config || {},
  };
}

export default function Cover() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading, error } = useQuery<UserEvent | null>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeEvent(data) : null;
    },
    enabled: !!eventId,
    staleTime: 30000,
  });

  const [countdown, setCountdown] = useState(getCountdown(null));

  useEffect(() => {
    if (!event?.event_date) return;
    setCountdown(getCountdown(event.event_date));
    const interval = setInterval(() => {
      setCountdown(getCountdown(event.event_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [event?.event_date]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 px-6">
        <p className="text-sm text-gray-500">This event could not be found.</p>
        <button onClick={() => navigate("/")} className="text-sm text-gray-700 underline">
          Go home
        </button>
      </div>
    );
  }

  const config: CoverConfig = {
    ...DEFAULT_COVER_CONFIG,
    ...event.cover_config,
  };

  const overlayStyle = config.overlayOpacity
    ? {
        backgroundColor: config.overlayColor,
        opacity: config.overlayOpacity,
      }
    : {};

  const bgStyle = config.bgImage
    ? { backgroundImage: `url(${config.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: config.bgColor };

  const countdownItems = [
    { label: "Days", value: countdown.days },
    { label: "Hours", value: countdown.hours },
    { label: "Minutes", value: countdown.minutes },
    { label: "Seconds", value: countdown.seconds },
  ];

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden" style={{ ...bgStyle, color: config.textColor }}>
      <div className="absolute inset-0 pointer-events-none" style={overlayStyle} />

      <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 max-w-2xl w-full">
        {config.customText && (
          <p
            className="text-sm sm:text-base uppercase tracking-[0.3em] mb-6 opacity-80"
            style={{ fontFamily: config.scriptFont }}
          >
            {config.customText}
          </p>
        )}

        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] mb-6"
          style={{ fontFamily: config.font }}
        >
          {event.name}
        </h1>

        {config.showDate && event.event_date && (
          <p className="text-base sm:text-lg mb-8 opacity-90" style={{ fontFamily: config.font }}>
            {formatDate(event.event_date)}
            {event.event_time && (
              <span className="block mt-1 text-sm opacity-75">{event.event_time}</span>
            )}
          </p>
        )}

        {config.showCountdown && event.event_date && !countdown.isPast && (
          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-10">
            {countdownItems.map((item) => (
              <div key={item.label} className="flex flex-col items-center">
                <span className="text-3xl sm:text-4xl font-bold tabular-nums" style={{ fontFamily: config.font }}>
                  {String(item.value).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs uppercase tracking-wider mt-1 opacity-70">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <Button
          size="lg"
          onClick={() => navigate(`/${eventId}/login`)}
          className="mt-2"
          style={{
            backgroundColor: config.buttonColor,
            color: config.textColor,
            borderRadius: "10px",
          }}
        >
          {config.buttonText}
        </Button>
      </div>
    </div>
  );
}
