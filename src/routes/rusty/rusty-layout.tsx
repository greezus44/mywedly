import { useEffect, type ReactNode, type CSSProperties } from "react";
import { Outlet, useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home, CalendarCheck, Info, MessageSquare } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToCssVars, RUSTY_THEME } from "../../lib/theme";
import { cn } from "../../lib/utils";

export type Lang = "en" | "bm";

const NAV_ITEMS = [
  { key: "home", labelEn: "Home", labelBm: "Utama", icon: Home, path: "" },
  { key: "rsvp", labelEn: "RSVP", labelBm: "RSVP", icon: CalendarCheck, path: "/rsvp" },
  { key: "info", labelEn: "Info", labelBm: "Maklumat", icon: Info, path: "/info" },
  { key: "message", labelEn: "Message", labelBm: "Mesej", icon: MessageSquare, path: "/message" },
] as const;

export async function fetchPublicEvent(eventId: string): Promise<UserEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data as UserEvent | null;
}

export function RustyLayout({ lang }: { lang: Lang }) {
  return <Outlet context={{ lang }} />;
}

export function RustyLayoutShell({ children, lang }: { children: ReactNode; lang: Lang }) {
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
      <div className="min-h-screen flex items-center justify-center bg-rusty-bg">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-rusty-gold-dark border-t-transparent animate-spin" />
          <p className="font-serif text-lg text-rusty-text-light">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rusty-bg px-6">
        <div className="text-center max-w-sm animate-fade-in-up">
          <p className="font-serif text-2xl text-rusty-text mb-2">Invitation Not Found</p>
          <p className="text-sm text-rusty-text-light">The invitation you are looking for may no longer be available.</p>
        </div>
      </div>
    );
  }

  const theme = event.theme || RUSTY_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;

  const currentPath = location.pathname.replace(`/${eventId}`, "").replace(/^\//, "");
  const activeKey = currentPath === "" ? "home" : currentPath.split("/")[0];

  return (
    <div
      style={cssVars}
      className="min-h-screen bg-rusty-bg pb-20"
    >
      <header className="text-center pt-8 pb-4 px-6 animate-fade-in-down">
        <p className="font-serif text-xs tracking-[0.3em] uppercase text-rusty-gold-dark mb-1">
          {event.event_type}
        </p>
        <h1 className="font-serif text-2xl md:text-3xl text-rusty-text">
          {event.name}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="h-px w-12 bg-rusty-gold-dark/40" />
          <span className="w-1.5 h-1.5 rounded-full bg-rusty-gold-dark" />
          <span className="h-px w-12 bg-rusty-gold-dark/40" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-rusty-cream/95 backdrop-blur-sm border-t border-rusty-border">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeKey === item.key;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={`/${eventId}${item.path}`}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
                  isActive ? "text-rusty-gold-dark" : "text-rusty-text-light hover:text-rusty-text"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.75} />
                <span className="text-[10px] font-medium tracking-wide">
                  {lang === "bm" ? item.labelBm : item.labelEn}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
