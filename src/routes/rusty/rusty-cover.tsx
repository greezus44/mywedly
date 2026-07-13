import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { formatDate, getCountdown } from "../../lib/utils";
import { RUSTY_COVER_CONFIG } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { useRustyOutletContext } from "./rusty-layout";

export type Lang = "en" | "id";

/**
 * RustyCover — luxury cover page with cream background and gold accents.
 */
export default function RustyCover() {
  const { event } = useRustyOutletContext();
  const navigate = useNavigate();
  const cc = { ...RUSTY_COVER_CONFIG, ...(event.cover_config || {}) };
  const [countdown, setCountdown] = useState(getCountdown(event.event_date));

  useEffect(() => {
    if (!event.event_date) return;
    const t = setInterval(() => setCountdown(getCountdown(event.event_date)), 1000);
    return () => clearInterval(t);
  }, [event.event_date]);

  const headingFont: React.CSSProperties = { fontFamily: "var(--event-font-heading)" };
  const scriptFont: React.CSSProperties = { fontFamily: "var(--event-font-script)" };

  return (
    <div
      className="min-h-screen relative flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: cc.bgColor || "var(--event-bg)", color: cc.textColor || "var(--event-text)" }}
    >
      {/* Decorative gold top border */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: "var(--event-primary)" }} />

      <div className="max-w-2xl mx-auto py-20 relative z-10">
        {cc.logo && (
          <img
            src={cc.logo}
            alt="logo"
            className="mx-auto mb-10"
            style={{ width: cc.logoWidth ? `${cc.logoWidth}px` : "90px" }}
          />
        )}

        {/* Ornamental divider */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16" style={{ backgroundColor: "var(--event-primary)" }} />
          <div className="w-2 h-2 rotate-45" style={{ backgroundColor: "var(--event-primary)" }} />
          <div className="h-px w-16" style={{ backgroundColor: "var(--event-primary)" }} />
        </div>

        {cc.customText && (
          <p className="text-sm uppercase tracking-[0.3em] mb-6 opacity-80" style={scriptFont}>
            {cc.customText}
          </p>
        )}

        <h1 className="text-5xl md:text-7xl leading-tight mb-6" style={headingFont}>
          {event.name}
        </h1>

        {cc.showDate !== false && event.event_date && (
          <p className="text-lg mb-2 opacity-90" style={scriptFont}>
            {formatDate(event.event_date)}
            {event.event_time ? ` · ${event.event_time}` : ""}
          </p>
        )}

        {event.venue && (
          <p className="text-sm mb-8 opacity-75" style={scriptFont}>{event.venue}</p>
        )}

        {cc.showCountdown !== false && event.event_date && !countdown.isPast && (
          <div className="flex items-center justify-center gap-6 mb-10">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Mins", value: countdown.minutes },
              { label: "Secs", value: countdown.seconds },
            ].map((u) => (
              <div key={u.label} className="text-center">
                <div className="text-3xl" style={{ ...headingFont, color: "var(--event-primary)" }}>{u.value}</div>
                <div className="text-xs uppercase tracking-wider opacity-60 mt-1">{u.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Ornamental divider */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16" style={{ backgroundColor: "var(--event-primary)" }} />
          <div className="w-2 h-2 rotate-45" style={{ backgroundColor: "var(--event-primary)" }} />
          <div className="h-px w-16" style={{ backgroundColor: "var(--event-primary)" }} />
        </div>

        <Button
          onClick={() => navigate("login")}
          className="mt-2"
          style={{
            backgroundColor: cc.buttonColor || "var(--event-primary)",
            color: "#fff",
            borderRadius: "var(--event-radius)",
          }}
        >
          {cc.buttonText || "Enter"}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      {/* Decorative gold bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: "var(--event-primary)" }} />
    </div>
  );
}
