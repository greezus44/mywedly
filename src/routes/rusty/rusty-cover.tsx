import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { type UserEvent, type SubEvent, type ScheduleItem } from "../../lib/supabase";
import { getCountdown } from "../../lib/utils";
import { RUSTY_COVER_CONFIG, RUSTY_THEME } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { ArrowRight } from "lucide-react";

export type Lang = "en" | "id";

interface OutletContext {
  event: UserEvent;
  subEvents: SubEvent[];
  schedule: ScheduleItem[];
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export default function RustyCover() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { event } = useOutletContext<OutletContext>();
  const [countdown, setCountdown] = useState(getCountdown(event.event_date));

  useEffect(() => {
    const id = setInterval(() => setCountdown(getCountdown(event.event_date)), 1000);
    return () => clearInterval(id);
  }, [event.event_date]);

  const cover = { ...RUSTY_COVER_CONFIG, ...(event.cover_config || {}) };

  return (
    <div
      className="min-h-screen relative flex flex-col items-center justify-center px-6 text-center"
      style={{
        backgroundColor: cover.bgColor || RUSTY_THEME.bgColor || "#F5ECD7",
        color: cover.textColor || RUSTY_THEME.textColor || "#3D3528",
      }}
    >
      {/* Decorative top border */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }}
      />

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
        {/* Ornamental divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-px" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
          <div className="w-2 h-2 rotate-45" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
          <div className="w-16 h-px" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
        </div>

        {cover.customText && (
          <p
            className="text-sm uppercase tracking-[0.3em] mb-6 opacity-70"
            style={{ fontFamily: `"${cover.scriptFont || "Cormorant Garamond"}", serif`, fontStyle: "italic" }}
          >
            {cover.customText}
          </p>
        )}

        <h1
          className="font-heading text-5xl md:text-7xl leading-[1.1] tracking-tight"
          style={{ fontFamily: `"${cover.scriptFont || "Cormorant Garamond"}", serif` }}
        >
          {event.name}
        </h1>

        {cover.showDate !== false && event.event_date && (
          <p className="mt-8 text-base md:text-lg tracking-[0.1em] opacity-80 font-heading">
            {new Date(event.event_date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}

        {cover.showCountdown !== false && !countdown.isPast && (
          <div className="mt-12 flex items-center gap-8 md:gap-12">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
              { label: "Seconds", value: countdown.seconds },
            ].map((unit) => (
              <div key={unit.label} className="flex flex-col items-center">
                <span
                  className="font-heading text-3xl md:text-5xl tabular-nums"
                  style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }}
                >
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] mt-2 opacity-60">{unit.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-14">
          <Button
            onClick={() => navigate(`./login`)}
            size="lg"
            className="px-12 py-3.5 uppercase tracking-[0.2em]"
            style={{
              backgroundColor: cover.buttonColor || RUSTY_THEME.primaryColor || "#B8962E",
              color: RUSTY_THEME.bgColor || "#F5ECD7",
              borderRadius: 2,
            }}
          >
            {cover.buttonText || "Enter"} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Bottom ornamental divider */}
        <div className="flex items-center gap-4 mt-12">
          <div className="w-16 h-px" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
          <div className="w-2 h-2 rotate-45" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
          <div className="w-16 h-px" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
        </div>
      </div>

      {/* Decorative bottom border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }}
      />
    </div>
  );
}
