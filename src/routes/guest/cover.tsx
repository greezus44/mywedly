import { useParams, useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase, type UserEvent, type SubEvent, type ScheduleItem } from "../../lib/supabase";
import { cn, formatDate, getCountdown, getEventStatus } from "../../lib/utils";
import { DEFAULT_THEME, themeToCssVars } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { ArrowRight } from "lucide-react";
import { type CSSProperties } from "react";

interface OutletContext {
  event: UserEvent;
  subEvents: SubEvent[];
  schedule: ScheduleItem[];
}

export default function GuestCover() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { event } = useOutletContext<OutletContext>();
  const [countdown, setCountdown] = useState(getCountdown(event.event_date));

  useEffect(() => {
    const id = setInterval(() => setCountdown(getCountdown(event.event_date)), 1000);
    return () => clearInterval(id);
  }, [event.event_date]);

  const cover = event.cover_config || {};
  const theme = event.theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;

  const bgStyle: CSSProperties = {
    ...(cover.bgImage ? { backgroundImage: `url(${cover.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
    backgroundColor: cover.bgColor || theme.bgColor || "#ffffff",
  };

  const overlayStyle: CSSProperties = cover.bgImage
    ? {
        backgroundColor: cover.overlayColor || "#000000",
        opacity: cover.overlayOpacity ?? 0.4,
      }
    : {};

  const textColor = cover.textColor || theme.textColor || "#1a1a1a";
  const buttonColor = cover.buttonColor || theme.primaryColor || "#1a1a1a";
  const buttonText = cover.buttonText || "Enter";
  const status = getEventStatus(event.event_date);

  return (
    <div style={{ ...cssVars, ...bgStyle, color: textColor }} className="min-h-screen relative flex flex-col items-center justify-center px-6 text-center">
      {cover.bgImage && <div className="absolute inset-0" style={overlayStyle} />}

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
        {cover.customText && (
          <p
            className="text-sm uppercase tracking-[0.25em] mb-6 opacity-80"
            style={{ fontFamily: cover.scriptFont ? `"${cover.scriptFont}", serif` : "var(--font-script)" }}
          >
            {cover.customText}
          </p>
        )}

        <h1
          className="font-heading text-5xl md:text-7xl leading-[1.05] tracking-tight"
          style={{ fontFamily: cover.font ? `"${cover.font}", serif` : "var(--font-heading)" }}
        >
          {event.name}
        </h1>

        {cover.showDate !== false && event.event_date && (
          <p className="mt-6 text-base md:text-lg tracking-wide opacity-80">
            {formatDate(event.event_date)}
            {event.event_time && <> · {event.event_time}</>}
          </p>
        )}

        {cover.showCountdown !== false && !countdown.isPast && (
          <div className="mt-10 flex items-center gap-6 md:gap-10">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
              { label: "Seconds", value: countdown.seconds },
            ].map((unit) => (
              <div key={unit.label} className="flex flex-col items-center">
                <span className="font-heading text-3xl md:text-4xl tabular-nums">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="text-xs uppercase tracking-wider mt-1 opacity-60">{unit.label}</span>
              </div>
            ))}
          </div>
        )}

        {status === "completed" && (
          <p className="mt-8 text-sm uppercase tracking-[0.2em] opacity-70">This event has passed</p>
        )}

        <div className="mt-12">
          <Button
            onClick={() => navigate(`./login`)}
            size="lg"
            className={cn("px-10 py-3.5")}
            style={{ backgroundColor: buttonColor, color: theme.bgColor || "#ffffff", borderRadius: "var(--radius)" }}
          >
            {buttonText} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
