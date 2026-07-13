import { useNavigate, useParams } from "react-router-dom";
import { useGuestContext } from "./guest-layout";
import { supabase, type UserEvent } from "../../lib/supabase";
import { formatDate, getCountdown, getEventStatus } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function GuestCover() {
  const { event } = useGuestContext();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const config = event.cover_config || {};
  const countdown = getCountdown(event.event_date);
  const status = getEventStatus(event.event_date);
  const [, setTick] = useState(0);

  // Re-render every second for live countdown
  useEffect(() => {
    if (!config.showCountdown || countdown.isPast) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [config.showCountdown, countdown.isPast]);

  const handleEnter = () => navigate(`./login`);

  const bgStyle: React.CSSProperties = config.bgImage
    ? { backgroundImage: `url(${config.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: config.bgColor || "var(--color-bg)" };

  const overlayStyle: React.CSSProperties = config.overlayColor
    ? { backgroundColor: config.overlayColor, opacity: config.overlayOpacity ?? 0.4 }
    : {};

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={bgStyle}>
      {config.overlayColor && <div className="absolute inset-0" style={overlayStyle} />}
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-20 text-center" style={{ color: config.textColor || "var(--color-text)" }}>
        {config.customText && (
          <p className="font-[var(--font-script)] text-lg md:text-xl italic mb-6 opacity-80">{config.customText}</p>
        )}
        <h1 className="font-[var(--font-heading)] text-4xl md:text-6xl tracking-tight leading-tight mb-4">
          {event.name}
        </h1>
        {event.event_type && (
          <p className="text-xs uppercase tracking-[0.3em] opacity-70 mb-8">{event.event_type}</p>
        )}

        {config.showDate && event.event_date && (
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="w-4 h-4 opacity-70" />
            <p className="text-sm uppercase tracking-wider">{formatDate(event.event_date)}</p>
          </div>
        )}
        {event.event_time && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <Clock className="w-4 h-4 opacity-70" />
            <p className="text-sm uppercase tracking-wider">{event.event_time}</p>
          </div>
        )}
        {event.venue && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <MapPin className="w-4 h-4 opacity-70" />
            <p className="text-sm">{event.venue}</p>
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
                <div className="font-[var(--font-heading)] text-3xl md:text-4xl">{String(u.value).padStart(2, "0")}</div>
                <div className="text-xs uppercase tracking-wider opacity-60 mt-1">{u.label}</div>
              </div>
            ))}
          </div>
        )}

        {status === "completed" && (
          <p className="text-sm uppercase tracking-wider opacity-70 mb-8">This event has concluded</p>
        )}

        <Button
          onClick={handleEnter}
          size="lg"
          className="mt-4"
          style={{ backgroundColor: config.buttonColor, color: config.textColor === "#ffffff" ? "#ffffff" : undefined }}
        >
          {config.buttonText || "Enter"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
