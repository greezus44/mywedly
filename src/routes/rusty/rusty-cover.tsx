import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { RUSTY_COVER_CONFIG } from "../../lib/theme";
import { formatDate } from "../../lib/utils";

const CREAM = "#F5ECD7";
const GOLD = "#B8962E";
const TEXT = "#3D3528";
const TEXT_MUTED = "#8B7355";

export function RustyCover() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading, isError } = useQuery<UserEvent>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId!)
        .single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  const config = event?.cover_config || RUSTY_COVER_CONFIG;

  const containerStyle: CSSProperties = {
    backgroundColor: config.bgColor || CREAM,
    color: config.textColor || TEXT,
    fontFamily: '"Cormorant Garamond", serif',
  };

  if (isLoading) {
    return (
      <div style={containerStyle} className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg" style={{ color: GOLD }}>
          Loading...
        </div>
      </div>
    );
  }

  if (isError || !event || !eventId) {
    return (
      <div style={containerStyle} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl" style={{ color: TEXT }}>Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={containerStyle}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      <div
        className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2"
        style={{ width: "1px", backgroundColor: GOLD, opacity: 0.3 }}
      />
      <div
        className="absolute left-8 top-0 bottom-0"
        style={{ width: "1px", backgroundColor: GOLD, opacity: 0.15 }}
      />
      <div
        className="absolute right-8 top-0 bottom-0"
        style={{ width: "1px", backgroundColor: GOLD, opacity: 0.15 }}
      />

      <div className="relative z-10 text-center px-6 max-w-lg animate-[fadeIn_1.2s_ease-out]">
        {config.customText && (
          <p
            className="text-base md:text-lg italic mb-4"
            style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT_MUTED }}
          >
            {config.customText}
          </p>
        )}

        <div className="flex items-center justify-center gap-4 mb-6">
          <span className="block h-px w-12" style={{ backgroundColor: GOLD }} />
          <span
            className="text-xs tracking-[0.3em] uppercase"
            style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}
          >
            {event.event_type}
          </span>
          <span className="block h-px w-12" style={{ backgroundColor: GOLD }} />
        </div>

        <h1
          className="text-4xl md:text-6xl mb-2"
          style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT, letterSpacing: "0.02em" }}
        >
          {event.name}
        </h1>

        {config.showDate && event.event_date && (
          <p
            className="text-lg md:text-xl mt-4 mb-8"
            style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT_MUTED }}
          >
            {formatDate(event.event_date)}
          </p>
        )}

        {event.venue && (
          <p
            className="text-base mb-10"
            style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT_MUTED }}
          >
            {event.venue}
          </p>
        )}

        <button
          onClick={() => navigate(`/${eventId}/login`)}
          className="mt-4 px-10 py-3 text-sm tracking-[0.2em] uppercase transition-all hover:opacity-80"
          style={{
            backgroundColor: config.buttonColor || GOLD,
            color: CREAM,
            fontFamily: '"Inter", sans-serif',
            border: `1px solid ${config.buttonColor || GOLD}`,
          }}
        >
          {config.buttonText || "Enter"}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default RustyCover;
