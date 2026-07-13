import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Outlet, useNavigate, useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home, CalendarCheck, MessageSquare, Phone } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { DEFAULT_THEME, themeToCssVars } from "../../lib/theme";
import { cn } from "../../lib/utils";

export interface GuestLayoutContext {
  event: UserEvent;
}

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: Home, path: "/home" },
  { key: "rsvp", label: "RSVP", icon: CalendarCheck, path: "/rsvp" },
  { key: "wishes", label: "Wishes", icon: MessageSquare, path: "/wishes" },
  { key: "contact", label: "Contact", icon: Phone, path: "/contact" },
] as const;

export default function GuestLayout({ children }: { children?: ReactNode }) {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, eventId: authEventId } = useGuestAuth();

  const { data: event, isLoading, isError } = useQuery<UserEvent>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId!)
        .single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  const theme = event?.theme || DEFAULT_THEME;
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
      <div style={{ ...cssVars, backgroundColor: "var(--color-bg-subtle)" }} className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg" style={{ color: "var(--color-text-muted)" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div style={{ ...cssVars, backgroundColor: "var(--color-bg-subtle)" }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg" style={{ color: "var(--color-text)" }}>
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
      style={{ ...cssVars, backgroundColor: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}
      className="min-h-screen pb-20"
    >
      <main className="mx-auto" style={{ maxWidth: "var(--max-width)" }}>
        {children ?? <Outlet context={{ event } satisfies GuestLayoutContext} />}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ backgroundColor: "var(--color-bg)", borderTop: "1px solid var(--color-border)" }}
      >
        <div className="mx-auto max-w-md flex items-stretch justify-around">
          {NAV_ITEMS.map((item) => {
            const fullPath = `${basePath}${item.path}`;
            const isActive = currentPath === fullPath;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => navigate(fullPath)}
                className={cn("flex flex-col items-center gap-1 py-3 px-2 flex-1 transition-colors")}
                style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-muted)" }}
              >
                <Icon className="w-5 h-5" style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-muted)" }} />
                <span className="text-xs" style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                  {item.label}
                </span>
                {isActive && <span className="block h-0.5 w-6 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
