import { Outlet, NavLink, useParams, useNavigate, NavigateFunction } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, UserEvent, ThemeConfig } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToCssVars } from "../../lib/theme";
import { Loader2 } from "lucide-react";
import type { CSSProperties } from "react";

export type Lang = "en" | "bm";

export const translations = {
  en: { home: "Home", rsvp: "RSVP", info: "Info", message: "Message" },
  bm: { home: "Laman Utama", rsvp: "RSVP", info: "Maklumat", message: "Mesej" },
};

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

export function getTheme(event: UserEvent): ThemeConfig {
  const theme = event.theme || ({} as ThemeConfig);
  if (theme.applyToAll) return theme;
  return theme;
}

export function RustyLayout({ lang }: { lang: Lang }) {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const auth = useGuestAuth();

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

  if (!eventId) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5ECD7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#B8962E]" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#F5ECD7] flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-sm text-[#8B7355]">Could not load this event.</p>
      </div>
    );
  }

  if (!auth.token || auth.eventId !== eventId) {
    navigate(`/${eventId}/login`);
    return null;
  }

  const theme = getTheme(event);
  const cssVars = themeToCssVars(theme) as CSSProperties;
  const t = translations[lang];

  const navItems = [
    { label: t.home, path: "home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2l-7 7m7-7v10a1 1 0 01-1 1h-3" },
    { label: t.rsvp, path: "rsvp", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: t.info, path: "info", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: t.message, path: "message", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  ];

  return (
    <div
      className="min-h-screen pb-20"
      style={{
        ...cssVars,
        backgroundColor: "var(--bg-color)",
        color: "var(--body-color)",
        fontFamily: "var(--body-font)",
      }}
    >
      <header className="text-center pt-8 pb-4 px-6">
        <h1
          className="text-2xl tracking-wide"
          style={{
            color: "var(--heading-color)",
            fontFamily: "var(--heading-font)",
            fontWeight: 500,
          }}
        >
          {event.name}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="h-px w-8 bg-[#C4A44A]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">Invitation</span>
          <span className="h-px w-8 bg-[#C4A44A]" />
        </div>
      </header>

      <main className="px-6">
        <Outlet context={{ event, lang }} />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#C4A44A]/30 bg-[#F5ECD7]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-md flex items-stretch justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={`/${eventId}/${item.path}`}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
                  isActive ? "text-[#B8962E]" : "text-[#8B7355]"
                }`
              }
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="text-[10px] tracking-wide">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default RustyLayout;
