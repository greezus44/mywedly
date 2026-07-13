import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { DEFAULT_THEME, type ThemeConfig } from "../../lib/theme";
import { formatDate, getCountdown } from "../../lib/utils";

interface CoverConfig {
  subtitle?: string;
  showCountdown?: boolean;
}

interface LoginConfig {
  passwordMode?: "none" | "optional" | "required";
  password?: string;
}

function parseTheme(theme: Json | null | undefined): ThemeConfig {
  if (theme && typeof theme === "object" && !Array.isArray(theme)) {
    return { ...DEFAULT_THEME, ...(theme as Partial<ThemeConfig>) };
  }
  return DEFAULT_THEME;
}

function parseCoverConfig(cfg: Json | null | undefined): CoverConfig {
  if (cfg && typeof cfg === "object" && !Array.isArray(cfg)) {
    return cfg as CoverConfig;
  }
  return {};
}

function parseLoginConfig(cfg: Json | null | undefined): LoginConfig {
  if (cfg && typeof cfg === "object" && !Array.isArray(cfg)) {
    return cfg as LoginConfig;
  }
  return { passwordMode: "none" };
}

export default function CoverPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guestName, eventId, signIn } = useGuestAuth();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["user_events", "slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!slug,
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Auto-redirect to home if already signed in for this event
  useEffect(() => {
    if (event && guestName && eventId === event.id) {
      navigate(`/e/${slug}/home`, { replace: true });
    }
  }, [event, guestName, eventId, slug, navigate]);

  const loginConfig = parseLoginConfig(event?.login_config);
  const coverConfig = parseCoverConfig(event?.cover_config);
  const theme = parseTheme(event?.theme);
  const countdown = getCountdown(event?.event_date);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event || !username.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const trimmed = username.trim();
      const { data: guest, error: guestError } = await supabase
        .from("event_guests")
        .select("id, name, username")
        .ilike("username", trimmed)
        .eq("event_id", event.id)
        .maybeSingle();
      if (guestError) throw guestError;
      if (!guest) {
        setError("Username not found");
        return;
      }
      signIn(guest.name, event.id, guest.id);
      navigate(`/e/${slug}/home`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="animate-pulse text-dash-muted">Loading…</div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Invitation not found</h1>
        <p className="max-w-md text-dash-muted">
          This invitation website could not be found or is no longer available.
        </p>
        <Link to="/" className="text-dash-primary underline">
          Go to homepage
        </Link>
      </div>
    );
  }

  const showPassword = loginConfig.passwordMode && loginConfig.passwordMode !== "none";

  return (
    <EventThemeProvider theme={theme}>
      <div className="flex min-h-screen flex-col">
        {event.cover_image ? (
          <div className="relative flex-1">
            <img
              src={event.cover_image}
              alt={event.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="relative flex min-h-screen flex-col items-center justify-end px-4 pb-16 text-center text-white">
              <h1 className="text-4xl font-bold drop-shadow sm:text-5xl">{event.name}</h1>
              {coverConfig.subtitle && (
                <p className="mt-3 text-lg text-white/90 drop-shadow">{coverConfig.subtitle}</p>
              )}
              {event.event_date && (
                <p className="mt-2 text-base text-white/90 drop-shadow">
                  {formatDate(event.event_date)}
                </p>
              )}
              {!countdown.isPast && coverConfig.showCountdown !== false && event.event_date && (
                <div className="mt-6 flex justify-center gap-6">
                  {[
                    { label: "Days", value: countdown.days },
                    { label: "Hours", value: countdown.hours },
                    { label: "Mins", value: countdown.minutes },
                    { label: "Secs", value: countdown.seconds },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="text-3xl font-bold drop-shadow">{item.value}</div>
                      <div className="text-xs uppercase tracking-wide text-white/80">{item.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">{event.name}</h1>
            {coverConfig.subtitle && (
              <p className="mt-3 text-lg opacity-80">{coverConfig.subtitle}</p>
            )}
            {event.event_date && <p className="mt-2 text-base opacity-80">{formatDate(event.event_date)}</p>}
          </div>
        )}

        {/* Sign-in */}
        <div className="mx-auto w-full max-w-sm px-4 py-10">
          <div className="event-card space-y-4">
            <h2 className="text-center text-xl font-semibold">Welcome</h2>
            <p className="text-center text-sm opacity-80">
              Please enter your username to find your invitation.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="event-input"
                autoComplete="username"
                required
              />
              {showPassword && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="event-input"
                  autoComplete="current-password"
                  required={loginConfig.passwordMode === "required"}
                />
              )}
              {error && <p className="text-center text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="event-btn-primary w-full disabled:opacity-50"
              >
                {submitting ? "Checking…" : "Find My Invitation"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}
