import { useEffect } from "react";
import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { DEFAULT_THEME, DEFAULT_LOGO_CONFIG, themeToCssVars } from "../../lib/theme";
import type { CSSProperties } from "react";
import { Home, CalendarCheck, MessageSquareHeart, Phone } from "lucide-react";

export default function GuestLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, eventId: authEventId } = useGuestAuth();

  const isAuthenticated = !!token && authEventId === eventId;

  useEffect(() => {
    if (!isAuthenticated && eventId) {
      navigate(`/${eventId}/login`, { replace: true });
    }
  }, [isAuthenticated, eventId, navigate]);

  const { data: event, isLoading, isError } = useQuery<UserEvent | null>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!eventId && isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">Event not found</h2>
          <p className="mt-1 text-sm text-gray-500">This event may be private or no longer available.</p>
        </div>
      </div>
    );
  }

  const theme = { ...DEFAULT_THEME, ...event.theme };
  const logoConfig = { ...DEFAULT_LOGO_CONFIG, ...event.logo_config };
  const cssVars = themeToCssVars(theme) as CSSProperties;

  const navItems = [
    { label: "Home", icon: Home, path: "home" },
    { label: "RSVP", icon: CalendarCheck, path: "rsvp" },
    { label: "Wishes", icon: MessageSquareHeart, path: "wishes" },
    { label: "Contact", icon: Phone, path: "contact" },
  ];

  return (
    <div className="min-h-screen pb-20" style={{ ...cssVars, background: theme.bgColor, fontFamily: theme.bodyFont } as CSSProperties}>
      <header
        className="sticky top-0 z-30 backdrop-blur-md border-b"
        style={{
          background: `${theme.bgColor}f5`,
          borderColor: `${theme.accentColor}30`,
          color: theme.headingColor,
        }}
      >
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center gap-3">
          {logoConfig.enabled && (
            <div className="flex items-center gap-2">
              {logoConfig.image ? (
                <img src={logoConfig.image} alt="Logo" className="h-8 w-8 object-contain rounded" />
              ) : (
                <span
                  className="font-bold leading-none"
                  style={{ color: logoConfig.color, fontSize: logoConfig.fontSize }}
                >
                  {logoConfig.text}
                </span>
              )}
            </div>
          )}
          <h1
            className="text-sm font-semibold truncate"
            style={{ color: theme.headingColor, fontFamily: theme.headingFont }}
          >
            {event.name}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto">
        <Outlet context={{ event }} />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-md"
        style={{
          background: `${theme.bgColor}f8`,
          borderColor: `${theme.accentColor}30`,
        }}
      >
        <div className="max-w-3xl mx-auto px-2 py-1.5 flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.endsWith(`/${item.path}`);
            return (
              <button
                key={item.path}
                onClick={() => navigate(`/${eventId}/${item.path}`)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  color: isActive ? theme.primaryColor : theme.bodyColor,
                }}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
