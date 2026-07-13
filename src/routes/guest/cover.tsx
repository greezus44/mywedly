import { useEffect, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";
import { themeToEventCssVars } from "../../lib/theme";

export default function GuestCoverPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = event.cover_config ?? {};
  const cssVars = themeToEventCssVars(event.theme);
  const countdown = getCountdown(event.event_date);

  useEffect(() => {
    // Auto-redirect to login after 5 seconds
    timerRef.current = setTimeout(() => {
      navigate("login");
    }, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate]);

  const bgStyle: React.CSSProperties = {};
  if (config.bgImage || event.cover_image) {
    bgStyle.backgroundImage = `url(${config.bgImage ?? event.cover_image})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else if (config.bgColor) {
    bgStyle.backgroundColor = config.bgColor;
  }

  const overlayStyle: React.CSSProperties = {};
  if (config.overlayColor) {
    overlayStyle.backgroundColor = config.overlayColor;
    overlayStyle.opacity = config.overlayOpacity ?? 0.3;
  }

  return (
    <div
      className="event-themed relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center"
      style={cssVars}
    >
      <div className="absolute inset-0" style={bgStyle} />
      <div className="absolute inset-0" style={overlayStyle} />

      <div className="relative z-10 flex flex-col items-center">
        {config.logo && (
          <img
            src={config.logo}
            alt="Logo"
            style={{ width: config.logoWidth ?? 120 }}
            className="mb-6"
          />
        )}

        {config.customText && (
          <p
            className="font-script mb-4 text-lg"
            style={{ color: config.textColor ?? "inherit" }}
          >
            {config.customText}
          </p>
        )}

        <h1
          className="font-heading text-4xl md:text-6xl"
          style={{ color: config.textColor ?? "inherit" }}
        >
          {event.name}
        </h1>

        {config.showDate && event.event_date && (
          <p
            className="font-body mt-4 text-sm uppercase tracking-widest"
            style={{ color: config.textColor ?? "inherit" }}
          >
            {formatDate(event.event_date)}
            {event.event_time && ` • ${formatTime12(event.event_time)}`}
          </p>
        )}

        {config.showCountdown && !countdown.isPast && event.event_date && (
          <div
            className="font-body mt-6 flex gap-4 text-sm"
            style={{ color: config.textColor ?? "inherit" }}
          >
            <div>
              <span className="text-2xl font-bold">{countdown.days}</span>
              <span className="ml-1 text-xs uppercase">Days</span>
            </div>
            <div>
              <span className="text-2xl font-bold">{countdown.hours}</span>
              <span className="ml-1 text-xs uppercase">Hrs</span>
            </div>
            <div>
              <span className="text-2xl font-bold">{countdown.minutes}</span>
              <span className="ml-1 text-xs uppercase">Min</span>
            </div>
          </div>
        )}

        {event.venue && (
          <p
            className="font-body mt-4 text-sm"
            style={{ color: config.textColor ?? "inherit" }}
          >
            {event.venue}
          </p>
        )}

        {config.buttonText && (
          <button
            onClick={() => navigate("login")}
            className="font-body mt-8 rounded-md px-8 py-3 text-sm font-medium uppercase tracking-wider transition-transform hover:scale-105"
            style={{
              backgroundColor: config.buttonColor ?? "var(--event-primary)",
              color: config.textColor === "#ffffff" ? "#ffffff" : "var(--event-bg)",
              borderRadius: "var(--event-button-radius)",
            }}
          >
            {config.buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
