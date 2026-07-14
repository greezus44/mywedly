import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { jsonToTheme, themeToEventCssVars } from "../../lib/theme";

export default function GuestCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: event } = useQuery({
    queryKey: ["event_by_slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!slug,
  });

  if (!event) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  const theme = jsonToTheme(event.theme as Record<string, unknown> | null);
  const coverConfig = (event.cover_config ?? {}) as Record<string, unknown>;
  const logoConfig = (event.logo_config ?? {}) as Record<string, unknown>;
  const coverImage = event.cover_image;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{ ...themeToEventCssVars(theme), backgroundColor: theme.background, color: theme.text, fontFamily: theme.bodyFont }}
    >
      {coverImage && (
        <div className="absolute inset-0 overflow-hidden">
          <img src={coverImage} alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0" style={{ backgroundColor: theme.background, opacity: 0.3 }} />
        </div>
      )}
      <div className="relative z-10 text-center px-4 max-w-2xl">
        {typeof logoConfig?.imageUrl === "string" && logoConfig.imageUrl && (
          <img src={logoConfig.imageUrl} alt="Logo" className="mx-auto mb-6 max-h-24 object-contain" />
        )}
        <p className="text-sm tracking-widest uppercase mb-2" style={{ color: theme.accent }}>
          {(coverConfig.subtitle as string) || "We're getting married"}
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold mb-4" style={{ fontFamily: theme.headingFont, color: theme.text }}>
          {event.name}
        </h1>
        {event.event_date && (
          <p className="text-lg mb-8" style={{ color: theme.textMuted }}>
            {new Date(event.event_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        )}
        <button
          type="button"
          onClick={() => navigate(`/e/${slug}/signin`)}
          className="px-8 py-3 rounded-lg text-base font-medium transition-colors"
          style={{ backgroundColor: theme.primary, color: "#fff", borderRadius: theme.buttonRadius }}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
