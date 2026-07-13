import React, { useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

export default function GuestCoverPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();

  const config = event.cover_config || {};
  const image = event.cover_image;
  const name = event.name || "Our Event";
  const eventType = event.event_type || "Event";
  const date = event.event_date;
  const time = event.event_time;
  const venue = event.venue;

  const bgImage = config.bgImage || image;
  const bgColor = config.bgColor || "#1a1a2e";
  const overlayColor = config.overlayColor || "#000000";
  const overlayOpacity = config.overlayOpacity ?? 0.3;
  const textColor = config.textColor || "#ffffff";
  const buttonColor = config.buttonColor || "#ffffff";
  const buttonText = config.buttonText || "Enter";
  const headingFont = config.font || "Cormorant Garamond";
  const scriptFont = config.scriptFont || "Dancing Script";
  const showDate = config.showDate ?? true;
  const showCountdown = config.showCountdown ?? false;

  const countdown = getCountdown(date);

  // Auto-redirect to login after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("login");
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const containerStyle: React.CSSProperties = {
    backgroundImage: bgImage ? `url(${bgImage})` : undefined,
    backgroundColor: bgColor,
    color: textColor,
  };

  const overlayStyle: React.CSSProperties = {
    backgroundColor: overlayColor,
    opacity: overlayOpacity,
  };

  const handleEnter = () => {
    navigate("login");
  };

  return (
    <div
      className="event-themed relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-8 text-center"
      style={containerStyle}
    >
      <div className="absolute inset-0" style={overlayStyle} />

      <div className="relative z-10 flex flex-col items-center gap-4">
        {config.logo && (
          <img
            src={config.logo}
            alt="Logo"
            style={{ width: config.logoWidth || 120 }}
            className="mb-2 max-w-[60%] object-contain"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        )}

        <p
          className="text-sm uppercase tracking-[0.3em] opacity-80"
          style={{ fontFamily: `"${scriptFont}", cursive` }}
        >
          {eventType}
        </p>

        <h1
          className="text-4xl font-semibold md:text-5xl"
          style={{ fontFamily: `"${headingFont}", serif` }}
        >
          {name}
        </h1>

        {showDate && date && (
          <p
            className="text-lg opacity-90"
            style={{ fontFamily: `"${headingFont}", serif` }}
          >
            {formatDate(date)}
            {time ? ` at ${formatTime12(time)}` : ""}
          </p>
        )}

        {venue && <p className="text-sm opacity-70">{venue}</p>}

        {showCountdown && !countdown.isPast && (
          <div className="mt-2 flex gap-4 text-center">
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <div key={unit} className="flex flex-col">
                <span className="text-2xl font-semibold">{countdown[unit]}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-70">
                  {unit}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleEnter}
          className="mt-4 rounded px-8 py-3 text-sm font-medium uppercase tracking-wider transition-opacity hover:opacity-90"
          style={{
            backgroundColor: buttonColor,
            color: textColor,
            borderRadius: "var(--event-button-radius, 6px)",
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
