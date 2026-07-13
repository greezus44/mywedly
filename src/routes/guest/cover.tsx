import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { type UserEvent, type CoverConfig } from "../../lib/supabase";
import { getCountdown } from "../../lib/utils";

export default function GuestCoverPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const cfg: CoverConfig = event.cover_config ?? {};
  const date = event.event_date;

  const [countdown, setCountdown] = useState(getCountdown(date));

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("login");
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  useEffect(() => {
    if (!date) return;
    const interval = setInterval(() => {
      setCountdown(getCountdown(date));
    }, 1000);
    return () => clearInterval(interval);
  }, [date]);

  const bg: CSSProperties = cfg.bgImage
    ? { backgroundImage: `url(${cfg.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: cfg.bgColor || "#1a1a1a" };

  const overlay: CSSProperties = cfg.overlayColor
    ? { backgroundColor: cfg.overlayColor, opacity: cfg.overlayOpacity ?? 0.4 }
    : {};

  const textColor = cfg.textColor || "#ffffff";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center" style={bg}>
      <div className="absolute inset-0" style={overlay} />
      <div className="relative z-10 flex flex-col items-center gap-4">
        {cfg.logo && (
          <img
            src={cfg.logo}
            alt="logo"
            style={{ width: cfg.logoWidth ? `${cfg.logoWidth}px` : undefined }}
            className="mb-2"
          />
        )}
        {cfg.customText && (
          <p
            style={{ color: textColor, fontFamily: cfg.scriptFont ? `"${cfg.scriptFont}", serif` : undefined }}
            className="text-sm italic"
          >
            {cfg.customText}
          </p>
        )}
        <h1
          style={{ color: textColor, fontFamily: cfg.scriptFont ? `"${cfg.scriptFont}", serif` : undefined }}
          className="text-4xl font-semibold sm:text-5xl"
        >
          {event.name || "Your Event"}
        </h1>
        {cfg.showDate && date && (
          <p style={{ color: textColor }} className="text-base">
            {new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        )}
        {event.venue && (
          <p style={{ color: textColor }} className="text-sm opacity-90">
            {event.venue}
          </p>
        )}
        {cfg.showCountdown && !countdown.isPast && (
          <div className="mt-4 flex gap-4">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Min", value: countdown.minutes },
              { label: "Sec", value: countdown.seconds },
            ].map((u) => (
              <div key={u.label} className="flex flex-col items-center">
                <span className="text-2xl font-bold" style={{ color: textColor }}>
                  {u.value}
                </span>
                <span className="text-xs uppercase opacity-75" style={{ color: textColor }}>
                  {u.label}
                </span>
              </div>
            ))}
          </div>
        )}
        {cfg.buttonText && (
          <button
            type="button"
            onClick={() => navigate("login")}
            style={{ backgroundColor: cfg.buttonColor || "#fff", color: textColor === "#fff" ? "#1a1a1a" : "#fff" }}
            className="mt-6 rounded px-8 py-3 text-sm font-medium transition-transform hover:scale-105"
          >
            {cfg.buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
