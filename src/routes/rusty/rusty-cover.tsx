import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { themeToCssVars, RUSTY_THEME, RUSTY_COVER_CONFIG } from "../../lib/theme";
import { formatDate } from "../../lib/utils";
import type { CSSProperties } from "react";

export async function fetchCoverEvent(eventId: string): Promise<UserEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw error;
  return data as UserEvent | null;
}

export default function RustyCover() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const { data: event, isLoading, isError } = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    queryFn: () => fetchCoverEvent(eventId!),
    enabled: !!eventId,
  });

  const theme = event?.theme || event?.draft_theme || RUSTY_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;
  const config = event?.cover_config || event?.draft_cover_config || RUSTY_COVER_CONFIG;
  const eventName = event?.draft_name || event?.name || "Our Wedding";
  const eventDate = event?.draft_event_date || event?.event_date;

  const handleEnter = () => {
    if (eventId) navigate(`/${eventId}/login`);
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: config.bgColor || "#F5ECD7" }}
      >
        <div className="w-10 h-10 border-2 border-[#B8962E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F5ECD7" }}
      >
        <div className="text-center px-6">
          <p className="font-serif text-2xl text-[#B8962E] mb-2">Event not found</p>
          <p className="text-sm text-[#8B7355]">The invitation you are looking for could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ ...cssVars, backgroundColor: config.bgColor || "#F5ECD7" }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div className="absolute left-6 top-0 bottom-0 w-px" style={{ backgroundColor: "#B8962E", opacity: 0.4 }} />
      <div className="absolute right-6 top-0 bottom-0 w-px" style={{ backgroundColor: "#B8962E", opacity: 0.4 }} />
      <div className="absolute left-10 top-0 bottom-0 w-px" style={{ backgroundColor: "#B8962E", opacity: 0.2 }} />
      <div className="absolute right-10 top-0 bottom-0 w-px" style={{ backgroundColor: "#B8962E", opacity: 0.2 }} />

      <div
        className={`relative z-10 text-center px-8 max-w-2xl transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {config.customText && (
          <p
            className="font-serif italic text-lg md:text-xl mb-4 tracking-wide"
            style={{ color: config.textColor || "#3D3528", fontFamily: `"${config.scriptFont || "Cormorant Garamond"}", serif` }}
          >
            {config.customText}
          </p>
        )}

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-16" style={{ backgroundColor: "#B8962E" }} />
          <div className="w-2 h-2 rotate-45" style={{ backgroundColor: "#B8962E" }} />
          <div className="h-px w-16" style={{ backgroundColor: "#B8962E" }} />
        </div>

        <h1
          className="font-serif text-5xl md:text-7xl font-light leading-tight mb-4"
          style={{
            color: config.textColor || "#3D3528",
            fontFamily: `"${config.scriptFont || "Cormorant Garamond"}", serif`,
          }}
        >
          {eventName}
        </h1>

        {config.showDate && eventDate && (
          <p
            className="font-serif text-lg md:text-xl tracking-[0.2em] uppercase mb-8"
            style={{ color: config.textColor || "#3D3528" }}
          >
            {formatDate(eventDate)}
          </p>
        )}

        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="h-px w-20" style={{ backgroundColor: "#B8962E", opacity: 0.6 }} />
          <div className="h-px w-20" style={{ backgroundColor: "#B8962E", opacity: 0.6 }} />
        </div>

        <button
          onClick={handleEnter}
          className="px-12 py-3 font-serif text-lg tracking-[0.3em] uppercase transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: config.buttonColor || "#B8962E",
            color: "#FAF3E0",
            border: `1px solid ${config.buttonColor || "#B8962E"}`,
          }}
        >
          {config.buttonText || "Enter"}
        </button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-px h-12" style={{ backgroundColor: "#B8962E", opacity: 0.5 }} />
      </div>
    </div>
  );
}
