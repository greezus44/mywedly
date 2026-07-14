import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type Json } from "../../lib/supabase";
import { useGuestAuth, useSignIn } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME, jsonToTheme, type ThemeConfig } from "../../lib/theme";
import { formatDate, getCountdown } from "../../lib/utils";

interface CoverConfig {
  headline?: string;
  subheadline?: string;
  showDate?: boolean;
  showVenue?: boolean;
  showCountdown?: boolean;
}
interface LoginConfig {
  heading?: string;
  subtitle?: string;
  buttonText?: string;
  passwordMode?: "none" | "optional" | "required";
  password?: string;
}

function parseJson<T>(json: Json | null | undefined, defaults: T): T {
  if (!json || typeof json !== "object") return defaults;
  return { ...defaults, ...(json as object) } as T;
}

const defaultCover: CoverConfig = {
  headline: "", subheadline: "", showDate: true, showVenue: true, showCountdown: true,
};
const defaultLogin: LoginConfig = {
  heading: "Enter your username",
  subtitle: "Please enter the username from your invitation",
  buttonText: "Continue",
  passwordMode: "none",
};

export default function RustyCoverPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const auth = useGuestAuth();
  const signIn = useSignIn();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["guest-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  // Auto-redirect to home if already signed in for this event
  useEffect(() => {
    if (event && auth.isAuthenticated && auth.eventId === event.id) {
      navigate(`/r/${slug}/home`, { replace: true });
    }
  }, [event, auth, slug, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter your username.");
      return;
    }
    if (!event) return;
    const loginConfig = parseJson(event.login_config, defaultLogin);
    if (loginConfig.passwordMode === "required" && !password) {
      setError("Please enter the password.");
      return;
    }
    if (
      loginConfig.passwordMode !== "none" &&
      loginConfig.password &&
      password !== loginConfig.password
    ) {
      setError("Incorrect password.");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error: queryError } = await supabase
        .from("event_guests")
        .select("*")
        .ilike("username", trimmed)
        .eq("event_id", event.id)
        .maybeSingle();
      if (queryError) throw queryError;
      if (!data) {
        setError("Username not found");
        return;
      }
      const guest = data as EventGuest;
      signIn(guest.name, event.id, guest.id, guest.token);
      navigate(`/r/${slug}/home`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-dash-primary border-t-transparent" />
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
        <Link
          to="/"
          className="rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover"
        >
          Go home
        </Link>
      </div>
    );
  }

  // Rusty cover always starts from RUSTY_THEME, but merges any saved theme
  const savedTheme = jsonToTheme(event.theme as Json | null);
  const theme: ThemeConfig = { ...RUSTY_THEME, ...savedTheme };
  const coverConfig = parseJson(event.cover_config as Json | null, defaultCover);
  const loginConfig = parseJson(event.login_config as Json | null, defaultLogin);
  const countdown = getCountdown(event.event_date);
  const headline = coverConfig.headline || event.name;
  const subheadline = coverConfig.subheadline || "";

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="event-themed relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
        {event.cover_image && (
          <img
            src={event.cover_image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-full max-w-md px-6 py-12 text-center text-white">
          {subheadline && (
            <p className="mb-2 text-sm uppercase tracking-widest opacity-90">{subheadline}</p>
          )}
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">{headline}</h1>
          {coverConfig.showDate && event.event_date && (
            <p className="mb-1 text-lg opacity-95">{formatDate(event.event_date)}</p>
          )}
          {coverConfig.showVenue && event.venue && (
            <p className="mb-4 text-base opacity-90">{event.venue}</p>
          )}
          {coverConfig.showCountdown && !countdown.isPast && (
            <div className="mt-6 mb-8 flex justify-center gap-4">
              {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
                <div key={unit} className="flex flex-col items-center">
                  <span className="text-2xl font-bold">
                    {countdown[unit].toString().padStart(2, "0")}
                  </span>
                  <span className="text-xs uppercase tracking-wide opacity-80">{unit}</span>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 w-full max-w-sm space-y-3 rounded-lg bg-black/30 p-6 backdrop-blur-sm"
          >
            <h2 className="text-xl font-semibold text-white">{loginConfig.heading}</h2>
            {loginConfig.subtitle && (
              <p className="text-sm text-white/80">{loginConfig.subtitle}</p>
            )}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="event-input w-full"
              autoComplete="username"
              autoFocus
            />
            {loginConfig.passwordMode !== "none" && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="event-input w-full"
                autoComplete="current-password"
              />
            )}
            {error && (
              <p className="text-sm text-red-200" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="event-btn-primary w-full disabled:opacity-60"
            >
              {submitting ? "Checking…" : loginConfig.buttonText || "Continue"}
            </button>
          </form>
        </div>
      </div>
    </EventThemeProvider>
  );
}
