import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { formatDate, getCountdown } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { useGuestOutletContext } from "./guest-layout";

/**
 * GuestCover — the cover/landing page for a published event.
 * Uses cover_config for background/colors/text and event CSS vars for theming.
 */
export default function GuestCover() {
  const { event } = useGuestOutletContext();
  const navigate = useNavigate();
  const cc = event.cover_config || {};
  const [countdown, setCountdown] = useState(getCountdown(event.event_date));

  useEffect(() => {
    if (!event.event_date) return;
    const t = setInterval(() => setCountdown(getCountdown(event.event_date)), 1000);
    return () => clearInterval(t);
  }, [event.event_date]);

  const bgStyle: React.CSSProperties = {};
  if (cc.bgImage) {
    bgStyle.backgroundImage = `url(${cc.bgImage})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else if (cc.bgColor) {
    bgStyle.backgroundColor = cc.bgColor;
  } else {
    bgStyle.backgroundColor = "var(--event-bg)";
  }
  const overlay = cc.overlayColor
    ? { backgroundColor: cc.overlayColor, opacity: cc.overlayOpacity ?? 0.3 }
    : undefined;
  const textColor = cc.textColor || "var(--event-text)";
  const buttonColor = cc.buttonColor || "var(--event-primary)";
  const scriptFont: React.CSSProperties = { fontFamily: "var(--event-font-script)" };
  const headingFont: React.CSSProperties = { fontFamily: "var(--event-font-heading)" };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-6 text-center" style={bgStyle}>
      {overlay && <div className="absolute inset-0" style={overlay} />}
      <div className="relative z-10 max-w-2xl mx-auto py-20" style={{ color: textColor }}>
        {cc.logo && (
          <img
            src={cc.logo}
            alt="logo"
            className="mx-auto mb-8"
            style={{ width: cc.logoWidth ? `${cc.logoWidth}px` : "80px" }}
          />
        )}
        {cc.customText && (
          <p className="text-sm uppercase tracking-[0.3em] mb-6 opacity-80" style={scriptFont}>
            {cc.customText}
          </p>
        )}
        <h1 className="text-5xl md:text-7xl leading-tight mb-4" style={headingFont}>
          {event.name}
        </h1>
        {cc.showDate !== false && event.event_date && (
          <p className="text-lg mb-2 opacity-90" style={scriptFont}>
            {formatDate(event.event_date)}
            {event.event_time ? ` · ${event.event_time}` : ""}
          </p>
        )}
        {event.venue && <p className="text-sm mb-8 opacity-75">{event.venue}</p>}
        {cc.showCountdown !== false && event.event_date && !countdown.isPast && (
          <div className="flex items-center justify-center gap-6 mb-10">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Mins", value: countdown.minutes },
              { label: "Secs", value: countdown.seconds },
            ].map((u) => (
              <div key={u.label} className="text-center">
                <div className="text-3xl font-heading" style={headingFont}>{u.value}</div>
                <div className="text-xs uppercase tracking-wider opacity-60 mt-1">{u.label}</div>
              </div>
            ))}
          </div>
        )}
        <Button
          onClick={() => navigate("login")}
          className="mt-4"
          style={{ backgroundColor: buttonColor, color: "#fff", borderRadius: "var(--event-radius)" }}
        >
          {cc.buttonText || "Enter"}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
