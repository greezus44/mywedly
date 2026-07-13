import { useEffect } from "react";
import { Outlet, useNavigate, useParams, NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home, CalendarCheck, MessageSquare, Mail } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToCssVars, DEFAULT_THEME } from "../../lib/theme";
import { cn } from "../../lib/utils";
import type { CSSProperties } from "react";

export interface GuestLayoutContext {
  event: UserEvent;
}

const NAV_ITEMS = [
  { label: "Home", icon: Home, to: "home" },
  { label: "RSVP", icon: CalendarCheck, to: "rsvp" },
  { label: "Wishes", icon: MessageSquare, to: "wishes" },
  { label: "Contact", icon: Mail, to: "contact" },
] as const;

export default function GuestLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useGuestAuth();

  const { data: event, isLoading, isError } = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  const isLoginRoute = location.pathname.endsWith("/login");
  const isCoverRoute = location.pathname === `/${eventId}`;

  useEffect(() => {
    if (!isAuthenticated && eventId && !isLoginRoute && !isCoverRoute) {
      navigate(`/${eventId}/login`, { replace: true });
    }
  }, [isAuthenticated, eventId, isLoginRoute, isCoverRoute, navigate]);

  const theme = event?.theme || event?.draft_theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;

  if (isLoading) {
    return (
      <div style={{ ...cssVars, backgroundColor: "var(--color-bg)" }} className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm px-6">
          <p className="text-xl font-semibold text-slate-900 mb-2">Event not found</p>
          <p className="text-sm text-slate-500">The event you are looking for could not be loaded.</p>
        </div>
      </div>
    );
  }

  const showNav = isAuthenticated && !isCoverRoute && !isLoginRoute;

  return (
    <div style={{ ...cssVars, backgroundColor: "var(--color-bg)" }} className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20">
        <Outlet context={{ event } satisfies GuestLayoutContext} />
      </main>

      {showNav && (
        <nav className="fixed bottom-0 inset-x-0 z-30 border-t" style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)" }}>
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-around">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={`/${eventId}/${item.to}`}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
                      isActive ? "text-slate-900" : "text-slate-400 hover:text-slate-700"
                    )
                  }
                  style={({ isActive }) => (isActive ? { color: "var(--color-primary)" } : undefined)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
