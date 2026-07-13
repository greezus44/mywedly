import { type ReactNode, useEffect } from "react";
import { Outlet, useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home, CalendarCheck, Info, MessageSquare } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToCssVars, RUSTY_THEME } from "../../lib/theme";
import { cn } from "../../lib/utils";
import type { CSSProperties } from "react";

export type Lang = "en" | "bm";

export async function fetchPublicEvent(eventId: string): Promise<UserEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw error;
  return data as UserEvent | null;
}

const navItems = [
  { key: "home", labelEn: "Home", labelBm: "Utama", icon: Home, to: "" },
  { key: "rsvp", labelEn: "RSVP", labelBm: "RSVP", icon: CalendarCheck, to: "/rsvp" },
  { key: "info", labelEn: "Info", labelBm: "Info", icon: Info, to: "/info" },
  { key: "message", labelEn: "Message", labelBm: "Mesej", icon: MessageSquare, to: "/message" },
] as const;

export interface RustyOutletContext {
  event: UserEvent | null;
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export function useRustyEvent(eventId: string | undefined) {
  return useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    queryFn: () => fetchPublicEvent(eventId!),
    enabled: !!eventId,
  });
}

export function RustyLayout({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useGuestAuth();
  const { data: event, isLoading, isError } = useRustyEvent(eventId);

  useEffect(() => {
    if (!isAuthenticated && eventId) {
      navigate(`/${eventId}/login`, { replace: true });
    }
  }, [isAuthenticated, eventId, navigate]);

  const theme = event?.theme || event?.draft_theme || RUSTY_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;

  const basePath = `/${eventId}`;
  const currentPath = location.pathname.replace(basePath, "") || "/";

  const isActive = (to: string) => {
    if (to === "") return currentPath === "/" || currentPath === "";
    return currentPath.startsWith(to);
  };

  if (isLoading) {
    return (
      <div
        style={{ ...cssVars, backgroundColor: "#F5ECD7" }}
        className="min-h-screen flex items-center justify-center"
      >
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 border-2 border-[#B8962E] border-t-transparent rounded-full animate-spin" />
          <p className="font-serif text-lg text-[#8B7355]">Loading...</p>
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F5ECD7" }}
      >
        <div className="text-center max-w-sm px-6">
          <p className="font-serif text-2xl text-[#B8962E] mb-2">Event not found</p>
          <p className="text-sm text-[#8B7355]">The event you are looking for could not be loaded.</p>
        </div>
      </div>
    );
  }

  const outletContext: RustyOutletContext = { event, lang, setLang };

  return (
    <div style={{ ...cssVars, backgroundColor: "var(--color-bg)" }} className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-30 border-b"
        style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)" }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1
            className="font-serif text-xl tracking-wide"
            style={{ color: "var(--color-primary)" }}
          >
            {event.name}
          </h1>
          <div className="flex items-center gap-1 text-xs">
            {(["en", "bm"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "px-2.5 py-1 rounded font-medium uppercase tracking-wider transition-colors",
                  lang === l ? "text-white" : "text-[#8B7355] hover:text-[#3D3528]"
                )}
                style={lang === l ? { backgroundColor: "var(--color-primary)" } : undefined}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24">
        <Outlet context={outletContext} />
      </main>

      <nav
        className="fixed bottom-0 inset-x-0 z-30 border-t"
        style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)" }}
      >
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            const label = lang === "bm" ? item.labelBm : item.labelEn;
            return (
              <Link
                key={item.key}
                to={`${basePath}${item.to}`}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded transition-colors",
                  active ? "text-[#B8962E]" : "text-[#8B7355] hover:text-[#3D3528]"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default RustyLayout;
