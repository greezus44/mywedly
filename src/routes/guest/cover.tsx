import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { supabase, UserEvent } from "../../lib/supabase";
import {
  DEFAULT_COVER_CONFIG,
  DEFAULT_LOGO_CONFIG,
  shouldShowLogo,
  getLogoStyle,
} from "../../lib/theme";
import { getCountdown, formatDate, formatTime } from "../../lib/utils";
import { ErrorState, Skeleton } from "../../components/ui/index";

export default function Cover() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading, error, refetch } = useQuery<UserEvent | null>({
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

  const [countdown, setCountdown] = useState(
    getCountdown(event?.event_date || null)
  );

  useEffect(() => {
    if (!event?.event_date) return;
    setCountdown(getCountdown(event.event_date));
    const interval = setInterval(
      () => setCountdown(getCountdown(event.event_date!)),
      1000
    );
    return () => clearInterval(interval);
  }, [event?.event_date]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 space-y-6">
        <Skeleton className="h-96 w-full max-w-3xl mx-auto" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <ErrorState
          message={error ? error.message : "Event not found or not published."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const cover = event.cover_config || DEFAULT_COVER_CONFIG;
  const logo = event.logo_config || DEFAULT_LOGO_CONFIG;
  const loginConfig = event.login_config;
  const welcomeText =
    loginConfig?.welcomeMessage || cover.customText || "You are cordially invited";

  const handleEnter = () => navigate(`/${eventId}/login`);

  const countdownItems = [
    { label: "Days", value: countdown.days },
    { label: "Hours", value: countdown.hours },
    { label: "Minutes", value: countdown.minutes },
    { label: "Seconds", value: countdown.seconds },
  ];

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center"
      style={{
        backgroundColor: cover.bgColor,
        color: cover.textColor,
        fontFamily: `"${cover.font}", serif`,
      }}
    >
      {cover.bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${cover.bgImage})` }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: cover.overlayColor,
          opacity: cover.overlayOpacity,
        }}
      />

      <div className="relative z-10 text-center px-6 py-16 max-w-2xl mx-auto flex flex-col items-center">
        {shouldShowLogo(logo) && (
          <div className="mb-8">
            {logo.image ? (
              <img
                src={logo.image}
                alt={event.name}
                className="max-h-20 object-contain mx-auto"
              />
            ) : (
              <div
                style={{
                  ...getLogoStyle(logo),
                  fontSize: `${logo.fontSize * 1.5}px`,
                }}
              >
                {logo.text}
              </div>
            )}
          </div>
        )}

        <p
          className="text-sm uppercase tracking-[0.3em] mb-4 opacity-80"
          style={{ fontFamily: `"${cover.font}", serif` }}
        >
          {welcomeText}
        </p>

        <div
          className="w-16 h-px mb-6"
          style={{ backgroundColor: cover.textColor, opacity: 0.4 }}
        />

        <p
          className="text-xl mb-3 opacity-90"
          style={{ fontFamily: `"${cover.scriptFont}", cursive` }}
        >
          The {event.event_type}
        </p>

        <h1
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          style={{ fontFamily: `"${cover.font}", serif` }}
        >
          {event.name}
        </h1>

        {cover.showDate && event.event_date && (
          <p className="text-base md:text-lg opacity-90 mb-2 tracking-wide">
            {formatDate(event.event_date)}
          </p>
        )}
        {event.event_time && (
          <p className="text-sm opacity-70 mb-8 tracking-wide">
            {formatTime(event.event_time)}
          </p>
        )}

        {cover.showCountdown && !countdown.expired && (
          <div className="flex justify-center gap-4 md:gap-8 mt-4 mb-8">
            {countdownItems.map((item) => (
              <div key={item.label} className="text-center">
                <div
                  className="text-3xl md:text-4xl font-bold tabular-nums"
                  style={{ fontFamily: `"${cover.font}", serif` }}
                >
                  {String(item.value).padStart(2, "0")}
                </div>
                <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] opacity-70 mt-1">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {cover.buttonText && (
          <button
            onClick={handleEnter}
            className="mt-4 group inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-medium text-sm tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              backgroundColor: cover.buttonColor,
              color: "#ffffff",
              borderRadius: "8px",
            }}
          >
            {cover.buttonText}
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>
    </div>
  );
}
