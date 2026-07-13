import { Outlet, useNavigate, useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { CSSProperties } from "react";
import { Home, CalendarCheck, Info, MessageSquare } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { RUSTY_THEME, themeToCssVars } from "../../lib/theme";
import { cn } from "../../lib/utils";

export type Lang = "en" | "bm";

const CREAM = "#F5ECD7";
const GOLD = "#B8962E";
const GOLD_LIGHT = "#C4A44A";
const TEXT = "#3D3528";
const TEXT_MUTED = "#8B7355";
const BORDER = "#D4C695";

const NAV_ITEMS = [
  { key: "home", labelEn: "Home", labelBm: "Utama", icon: Home, path: "" },
  { key: "rsvp", labelEn: "RSVP", labelBm: "RSVP", icon: CalendarCheck, path: "/rsvp" },
  { key: "info", labelEn: "Info", labelBm: "Maklumat", icon: Info, path: "/info" },
  { key: "message", labelEn: "Message", labelBm: "Mesej", icon: MessageSquare, path: "/message" },
];

export function RustyLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, eventId: authEventId } = useGuestAuth();

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

  const theme = event?.theme || RUSTY_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;

  useEffect(() => {
    if (!isAuthenticated || (authEventId && eventId && authEventId !== eventId)) {
      navigate(`/${eventId}/login`, { replace: true });
    }
  }, [isAuthenticated, authEventId, eventId, navigate]);

  if (!eventId) return <Navigate to="/" replace />;
  if (!isAuthenticated) return <Navigate to={`/${eventId}/login`} replace />;

  if (isLoading) {
    return (
      <div style={{ backgroundColor: CREAM }} className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg" style={{ fontFamily: '"Cormorant Garamond", serif', color: GOLD }}>
          Loading...
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div style={{ backgroundColor: CREAM }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg" style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT }}>
            Event not found
          </p>
        </div>
      </div>
    );
  }

  const currentPath = window.location.pathname;
  const basePath = `/${eventId}`;

  return (
    <div
      style={{ ...cssVars, backgroundColor: CREAM, color: TEXT, fontFamily: '"Cormorant Garamond", serif' }}
      className="min-h-screen pb-20"
    >
      <header className="text-center pt-8 pb-4 px-4">
        <div className="inline-block">
          <div className="flex items-center justify-center gap-3">
            <span className="block h-px w-8" style={{ backgroundColor: GOLD }} />
            <span className="text-xs tracking-[0.3em] uppercase" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
              {event.event_type}
            </span>
            <span className="block h-px w-8" style={{ backgroundColor: GOLD }} />
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl" style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT }}>
            {event.name}
          </h1>
        </div>
      </header>

      <main className="px-4">
        <Outlet context={{ event, eventId: eventId! }} />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ backgroundColor: CREAM, borderTop: `1px solid ${BORDER}` }}
      >
        <div className="mx-auto max-w-md flex items-stretch justify-around">
          {NAV_ITEMS.map((item) => {
            const fullPath = `${basePath}${item.path}`;
            const isActive = currentPath === fullPath || (item.path === "" && currentPath === basePath);
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => navigate(fullPath)}
                className={cn("flex flex-col items-center gap-1 py-3 px-2 flex-1 transition-colors")}
                style={{ color: isActive ? GOLD : TEXT_MUTED }}
              >
                <Icon className="w-5 h-5" style={{ color: isActive ? GOLD : TEXT_MUTED }} />
                <span className="text-xs" style={{ fontFamily: '"Inter", sans-serif', color: isActive ? GOLD : TEXT_MUTED }}>
                  {item.labelEn}
                </span>
                {isActive && <span className="block h-0.5 w-6 rounded-full" style={{ backgroundColor: GOLD }} />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
