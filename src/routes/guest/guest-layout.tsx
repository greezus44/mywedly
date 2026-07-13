import { useEffect, type CSSProperties } from "react";
import { Outlet, useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home, CalendarCheck, MessageSquare, Mail } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToCssVars, DEFAULT_THEME } from "../../lib/theme";
import { cn } from "../../lib/utils";

export interface GuestLayoutContext {
  event: UserEvent;
}

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: Home, path: "/home" },
  { key: "rsvp", label: "RSVP", icon: CalendarCheck, path: "/rsvp" },
  { key: "wishes", label: "Wishes", icon: MessageSquare, path: "/wishes" },
  { key: "contact", label: "Contact", icon: Mail, path: "/contact" },
] as const;

export async function fetchPublicEvent(eventId: string): Promise<UserEvent | null> {
  const { data, error } = await supabase
    .from("user_events")
    .select("*")
    .eq("id", eventId)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data as UserEvent | null;
}

export default function GuestLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useGuestAuth();

  const { data: event, isLoading, error } = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    queryFn: () => fetchPublicEvent(eventId!),
    enabled: !!eventId,
  });

  useEffect(() => {
    if (!isAuthenticated && eventId) {
      navigate(`/${eventId}/login`, { replace: true });
    }
  }, [isAuthenticated, eventId, navigate]);

  if (!eventId) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="text-center max-w-sm">
          <p className="text-2xl font-semibold text-slate-900 mb-2">Event Not Found</p>
          <p className="text-sm text-slate-500">The event you are looking for may no longer be available.</p>
        </div>
      </div>
    );
  }

  const theme = event.theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;

  const currentPath = location.pathname.replace(`/${eventId}`, "").replace(/^\//, "");
  const activeKey = currentPath === "" ? "home" : currentPath.split("/")[0];

  return (
    <div style={cssVars} className="min-h-screen pb-20" >
      <header className="text-center pt-8 pb-4 px-6">
        <p
          className="text-xs tracking-[0.3em] uppercase mb-1"
          style={{ color: "var(--color-accent)" }}
        >
          {event.event_type}
        </p>
        <h1
          className="text-2xl md:text-3xl"
          style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
        >
          {event.name}
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-6">
        <Outlet context={{ event } satisfies GuestLayoutContext} />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-sm border-t"
        style={{
          backgroundColor: "var(--color-bg)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeKey === item.key;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={`/${eventId}${item.path}`}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
                )}
                style={{
                  color: isActive ? "var(--color-accent)" : "var(--color-text-muted)",
                }}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.75} />
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
