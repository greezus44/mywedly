import { useEffect, type CSSProperties } from "react";
import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home, CalendarHeart, MessageSquareHeart, Phone } from "lucide-react";
import { supabase, UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToCssVars, shouldShowLogo, getLogoStyle } from "../../lib/theme";
import { ErrorState, Skeleton } from "../../components/ui/index";

export type GuestLayoutContext = { event: UserEvent };

const NAV_ITEMS = [
  { label: "Home", path: "home", icon: Home },
  { label: "RSVP", path: "rsvp", icon: CalendarHeart },
  { label: "Wishes", path: "wishes", icon: MessageSquareHeart },
  { label: "Contact", path: "contact", icon: Phone },
];

export default function GuestLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useGuestAuth();
  const isAuthenticated = !!token;

  const { data: event, isLoading, error, refetch } = useQuery<UserEvent | null>({
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
    enabled: !!eventId,
  });

  useEffect(() => {
    if (!isAuthenticated && eventId) {
      navigate(`/${eventId}/login`, { replace: true });
    }
  }, [isAuthenticated, eventId, navigate]);

  if (!eventId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <ErrorState message="Event ID is missing from the URL." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 space-y-6">
        <Skeleton className="h-20 w-full max-w-3xl mx-auto" />
        <Skeleton className="h-64 w-full max-w-3xl mx-auto" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <ErrorState
          message={error ? error.message : "Event not found or not published."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const theme = event.theme;
  const cssVars = themeToCssVars(theme) as CSSProperties;
  const currentPath = location.pathname.split("/").pop() || "home";

  return (
    <div className="min-h-screen flex flex-col" style={cssVars}>
      <header
        className="sticky top-0 z-30 backdrop-blur-md border-b"
        style={{
          backgroundColor: `color-mix(in srgb, ${theme.bgColor} 88%, transparent)`,
          borderColor: `color-mix(in srgb, ${theme.accentColor} 25%, transparent)`,
        }}
      >
        <div
          className="mx-auto flex items-center justify-center py-4 px-6"
          style={{ maxWidth: `${theme.maxWidth}px` }}
        >
          {shouldShowLogo(event.logo_config) ? (
            event.logo_config.image ? (
              <img
                src={event.logo_config.image}
                alt={event.name}
                className="max-h-10 object-contain"
              />
            ) : (
              <span
                style={{
                  ...getLogoStyle(event.logo_config),
                  fontSize: `${event.logo_config.fontSize}px`,
                }}
              >
                {event.logo_config.text}
              </span>
            )
          ) : (
            <h1
              className="text-lg font-semibold tracking-wide"
              style={{
                fontFamily: `var(--wed-heading-font)`,
                color: theme.headingColor,
              }}
            >
              {event.name}
            </h1>
          )}
        </div>
      </header>

      <main className="flex-1 w-full" style={{ backgroundColor: theme.bgColor }}>
        <Outlet context={{ event } satisfies GuestLayoutContext} />
      </main>

      <nav
        className="sticky bottom-0 z-30 border-t backdrop-blur-md"
        style={{
          backgroundColor: `color-mix(in srgb, ${theme.bgColor} 92%, transparent)`,
          borderColor: `color-mix(in srgb, ${theme.accentColor} 25%, transparent)`,
        }}
      >
        <div
          className="mx-auto flex items-center justify-around px-2"
          style={{ maxWidth: `${theme.maxWidth}px` }}
        >
          {NAV_ITEMS.map((item) => {
            const active = currentPath === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(`/${eventId}/${item.path}`)}
                className="flex flex-col items-center gap-1 py-3 px-4 transition-colors"
                style={{
                  color: active ? theme.primaryColor : theme.bodyColor,
                }}
              >
                <Icon
                  className="w-5 h-5"
                  strokeWidth={active ? 2.5 : 1.75}
                />
                <span
                  className="text-[11px] font-medium tracking-wide"
                  style={{ fontWeight: active ? 600 : 400 }}
                >
                  {item.label}
                </span>
                {active && (
                  <span
                    className="absolute -mt-3 h-0.5 w-6 rounded-full"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {event.content.footer_enabled && event.content.footer_text && (
        <footer
          className="py-6 px-6 text-center text-xs"
          style={{
            color: theme.bodyColor,
            opacity: 0.6,
            fontFamily: `var(--wed-body-font)`,
          }}
        >
          {event.content.footer_text}
        </footer>
      )}
    </div>
  );
}
