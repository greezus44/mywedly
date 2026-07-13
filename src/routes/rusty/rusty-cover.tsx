import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { RUSTY_COVER_CONFIG, RUSTY_THEME } from "../../lib/theme";
import { formatDate } from "../../lib/utils";
import { fetchPublicEvent } from "./rusty-layout";

export default function RustyCover() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const { data: event, isLoading, error } = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    queryFn: () => fetchPublicEvent(eventId!),
    enabled: !!eventId,
  });

  if (!eventId) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rusty-bg">
        <div className="w-12 h-12 rounded-full border-2 border-rusty-gold-dark border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rusty-bg px-6">
        <div className="text-center">
          <p className="font-serif text-2xl text-rusty-text mb-2">Invitation Not Found</p>
          <p className="text-sm text-rusty-text-light">The invitation you are looking for may no longer be available.</p>
        </div>
      </div>
    );
  }

  const config = event.cover_config || RUSTY_COVER_CONFIG;
  const theme = event.theme || RUSTY_THEME;
  const bgColor = config.bgColor || theme.bgColor || RUSTY_COVER_CONFIG.bgColor!;
  const textColor = config.textColor || theme.textColor || "#3D3528";
  const buttonColor = config.buttonColor || theme.primaryColor || RUSTY_COVER_CONFIG.buttonColor!;
  const buttonText = config.buttonText || RUSTY_COVER_CONFIG.buttonText!;
  const scriptFont = config.scriptFont || theme.scriptFont || "Cormorant Garamond";
  const headingFont = theme.headingFont || "Cormorant Garamond";

  const handleEnter = () => {
    navigate(`/${eventId}/login`);
  };

  return (
    <div
      className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-rusty-gold-dark/30 to-transparent" />
      <div className="absolute right-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-rusty-gold-dark/30 to-transparent" />

      <div
        className={`relative z-10 text-center px-8 max-w-lg transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        {config.customText && (
          <p
            className="text-base md:text-lg italic mb-6 animate-fade-in"
            style={{ color: textColor, fontFamily: `"${scriptFont}", serif` }}
          >
            {config.customText}
          </p>
        )}

        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="h-px w-16 bg-rusty-gold-dark/40" />
          <span className="w-2 h-2 rotate-45 border border-rusty-gold-dark/60" />
          <span className="h-px w-16 bg-rusty-gold-dark/40" />
        </div>

        <h1
          className="text-4xl md:text-6xl font-medium leading-tight mb-2 animate-fade-in-up"
          style={{ color: textColor, fontFamily: `"${headingFont}", serif` }}
        >
          {event.name}
        </h1>

        {config.showDate && event.event_date && (
          <p
            className="text-sm md:text-base tracking-[0.2em] uppercase mt-4 mb-8 animate-fade-in-up"
            style={{ color: textColor, opacity: 0.8 }}
          >
            {formatDate(event.event_date)}
          </p>
        )}

        {event.venue && (
          <p
            className="text-sm italic mb-10 animate-fade-in"
            style={{ color: textColor, opacity: 0.7, fontFamily: `"${scriptFont}", serif` }}
          >
            {event.venue}
          </p>
        )}

        <button
          onClick={handleEnter}
          className="group inline-flex items-center gap-2 px-10 py-3 text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:gap-4 animate-fade-in-up"
          style={{
            backgroundColor: buttonColor,
            color: "#FAF3E0",
            borderRadius: "2px",
          }}
        >
          {buttonText}
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>

      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p
          className="text-[10px] tracking-[0.3em] uppercase opacity-50"
          style={{ color: textColor }}
        >
          {event.event_type} Invitation
        </p>
      </div>
    </div>
  );
}
