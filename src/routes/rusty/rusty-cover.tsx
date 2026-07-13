import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, UserEvent, CoverConfig } from "../../lib/supabase";
import { RUSTY_COVER_CONFIG } from "../../lib/theme";
import { formatDate } from "../../lib/utils";
import type { CSSProperties } from "react";

function normalizeEvent(data: any): UserEvent {
  return {
    ...data,
    cover_config: data.cover_config || {},
    login_config: data.login_config || {},
    theme: data.theme || {},
    logo_config: data.logo_config || {},
    content: data.content || {},
    sharing_config: data.sharing_config || {},
    draft_cover_config: data.draft_cover_config || data.cover_config || {},
    draft_login_config: data.draft_login_config || data.login_config || {},
    draft_theme: data.draft_theme || data.theme || {},
    draft_logo_config: data.draft_logo_config || data.logo_config || {},
    draft_content: data.draft_content || data.content || {},
    draft_sharing_config: data.draft_sharing_config || data.sharing_config || {},
  };
}

export default function RustyCover() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading, error } = useQuery<UserEvent | null>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeEvent(data) : null;
    },
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5ECD7] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#B8962E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !event || !eventId) {
    return (
      <div className="min-h-screen bg-[#F5ECD7] flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-sm text-[#8B7355]">This invitation is no longer available.</p>
      </div>
    );
  }

  const config: CoverConfig = { ...RUSTY_COVER_CONFIG, ...event.cover_config };

  const handleEnter = () => navigate(`/${eventId}/login`);

  const bgStyle: CSSProperties = config.bgImage
    ? { backgroundImage: `url(${config.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: config.bgColor };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-16 animate-fade-in"
      style={{ ...bgStyle, color: config.textColor }}
    >
      {config.bgImage && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: config.overlayColor, opacity: config.overlayOpacity }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        <div className="flex items-center gap-3 mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
          <span className="h-px w-10 bg-[#C4A44A]" />
          <span
            className="text-xs uppercase tracking-[0.35em] text-[#C4A44A]"
            style={{ fontFamily: config.scriptFont }}
          >
            {config.customText || "The Wedding Of"}
          </span>
          <span className="h-px w-10 bg-[#C4A44A]" />
        </div>

        <div className="flex items-center gap-4 mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
          <span className="h-px w-16 bg-[#C4A44A]/40" />
          <span className="text-[10px] text-[#C4A44A]">✦</span>
          <span className="h-px w-16 bg-[#C4A44A]/40" />
        </div>

        <h1
          className="text-4xl sm:text-5xl font-medium leading-tight mb-2 opacity-0 animate-fade-in"
          style={{
            fontFamily: config.font,
            color: config.textColor,
            animationDelay: "0.6s",
            animationFillMode: "forwards",
          }}
        >
          {event.name}
        </h1>

        {config.showDate && (event.draft_event_date || event.event_date) && (
          <p
            className="text-sm mt-4 mb-8 opacity-0 animate-fade-in text-[#A07820]"
            style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}
          >
            {formatDate(event.draft_event_date || event.event_date)}
          </p>
        )}

        <div className="flex items-center gap-4 mb-10 opacity-0 animate-fade-in" style={{ animationDelay: "1s", animationFillMode: "forwards" }}>
          <span className="h-px w-16 bg-[#C4A44A]/40" />
          <span className="text-[10px] text-[#C4A44A]">✦</span>
          <span className="h-px w-16 bg-[#C4A44A]/40" />
        </div>

        <button
          onClick={handleEnter}
          className="opacity-0 animate-fade-in group"
          style={{ animationDelay: "1.2s", animationFillMode: "forwards" }}
        >
          <span
            className="inline-block px-12 py-3 text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:tracking-[0.3em] border"
            style={{
              backgroundColor: config.buttonColor,
              color: "#FFFFFF",
              borderColor: config.buttonColor,
              borderRadius: "2px",
            }}
          >
            {config.buttonText || "Enter"}
          </span>
        </button>
      </div>
    </div>
  );
}
