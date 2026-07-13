import { Outlet, NavLink, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Home, CalendarCheck, MessageCircle, MapPin } from "lucide-react";
import { supabase, UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToCssVars } from "../../lib/theme";
import { cn } from "../../lib/utils";
import type { CSSProperties } from "react";

export interface GuestLayoutContext {
  event: UserEvent;
}

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

export default function GuestLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { token, eventId: authEventId } = useGuestAuth();

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
    enabled: !!eventId,
    staleTime: 30000,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!eventId) return;
    if (!token || authEventId !== eventId) {
      navigate(`/${eventId}/login`, { replace: true });
    }
  }, [token, authEventId, eventId, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 px-6">
        <p className="text-sm text-gray-500">This event could not be found.</p>
        <button onClick={() => navigate("/")} className="text-sm text-gray-700 underline">
          Go home
        </button>
      </div>
    );
  }

  const cssVars = themeToCssVars(event.theme) as CSSProperties;
  const theme = event.theme;

  const navItems = [
    { label: "Home", path: "home", icon: Home },
    { label: "RSVP", path: "rsvp", icon: CalendarCheck },
    { label: "Wishes", path: "wishes", icon: MessageCircle },
    { label: "Contact", path: "contact", icon: MapPin },
  ];

  return (
    <div
      className="min-h-screen pb-20"
      style={{
        ...cssVars,
        backgroundColor: theme.bgColor,
        fontFamily: theme.bodyFont,
      }}
    >
      <main className="mx-auto" style={{ maxWidth: `${theme.maxWidth}px` }}>
        <Outlet context={{ event } satisfies GuestLayoutContext} />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 backdrop-blur-md" style={{ backgroundColor: theme.bgColor }}>
        <div className="mx-auto max-w-md flex items-center justify-around px-2 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={`/${eventId}/${item.path}`}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
                  isActive
                    ? "opacity-100"
                    : "opacity-50 hover:opacity-80"
                )
              }
              style={({ isActive }) => ({
                color: isActive ? theme.primaryColor : theme.bodyColor,
              })}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[11px] font-medium tracking-wide">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
