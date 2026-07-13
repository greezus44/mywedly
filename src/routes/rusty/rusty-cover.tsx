import { useNavigate } from "react-router-dom";
import { useRustyContext } from "./rusty-layout";
import { RUSTY_COVER_CONFIG, RUSTY_THEME } from "../../lib/theme";
import { supabase, type UserEvent } from "../../lib/supabase";
import { formatDate, getCountdown } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export type Lang = "en" | "id";

export default function RustyCover() {
  const { event } = useRustyContext();
  const navigate = useNavigate();
  const config = { ...RUSTY_COVER_CONFIG, ...(event.cover_config || {}) };
  const countdown = getCountdown(event.event_date);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (config.showCountdown || countdown.isPast) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [config.showCountdown, countdown.isPast]);

  const handleEnter = () => navigate("./login");

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: config.bgColor || RUSTY_THEME.bgColor! }}>
      {/* Gold ornamental border */}
      <div className="absolute inset-4 border pointer-events-none" style={{ borderColor: RUSTY_THEME.accentColor, borderRadius: "2px" }} />
      <div className="absolute inset-6 border pointer-events-none opacity-40" style={{ borderColor: RUSTY_THEME.accentColor, borderRadius: "2px" }} />

      <div className="relative z-10 max-w-xl mx-auto px-8 py-20 text-center" style={{ color: config.textColor || RUSTY_THEME.textColor! }}>
        {/* Ornamental divider top */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-16" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
          <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
          <div className="h-px w-16" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
        </div>

        {config.customText && (
          <p className="font-serif text-base md:text-lg italic mb-6 opacity-80" style={{ fontFamily: RUSTY_THEME.scriptFont }}>
            {config.customText}
          </p>
        )}

        <h1 className="font-serif text-4xl md:text-6xl tracking-tight leading-tight mb-4" style={{ fontFamily: RUSTY_THEME.headingFont, color: RUSTY_THEME.textColor }}>
          {event.name}
        </h1>

        {event.event_type && (
          <p className="text-xs uppercase tracking-[0.3em] mb-8 opacity-70" style={{ color: RUSTY_THEME.accentColor! }}>
            {event.event_type}
          </p>
        )}

        {config.showDate && event.event_date && (
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="w-4 h-4 opacity-70" style={{ color: RUSTY_THEME.accentColor! }} />
            <p className="text-sm uppercase tracking-wider">{formatDate(event.event_date)}</p>
          </div>
        )}
        {event.event_time && (
          <div className="flex items-center justify-center gap-2 mb-10">
            <Clock className="w-4 h-4 opacity-70" style={{ color: RUSTY_THEME.accentColor! }} />
            <p className="text-sm uppercase tracking-wider">{event.event_time}</p>
          </div>
        )}

        {config.showCountdown && !countdown.isPast && (
          <div className="grid grid-cols-4 gap-4 max-w-md mx-auto mb-10">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
              { label: "Seconds", value: countdown.seconds },
            ].map((u) => (
              <div key={u.label} className="text-center">
                <div className="font-serif text-3xl md:text-4xl" style={{ fontFamily: RUSTY_THEME.headingFont, color: RUSTY_THEME.accentColor }}>
                  {String(u.value).padStart(2, "0")}
                </div>
                <div className="text-xs uppercase tracking-wider opacity-60 mt-1">{u.label}</div>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleEnter}
          size="lg"
          className="mt-4"
          style={{ backgroundColor: config.buttonColor || RUSTY_THEME.accentColor!, color: "#F5ECD7", borderRadius: "2px" }}
        >
          {config.buttonText || "Enter"}
          <ArrowRight className="w-4 h-4" />
        </Button>

        {/* Ornamental divider bottom */}
        <div className="flex items-center justify-center gap-3 mt-10">
          <div className="h-px w-16" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
          <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
          <div className="h-px w-16" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
        </div>
      </div>
    </div>
  );
}
