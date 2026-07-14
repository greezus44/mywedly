import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type Json } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme, DEFAULT_THEME } from "../../lib/theme";
import { formatDate, to12Hour } from "../../lib/utils";

interface CoverConfig {
  subtitle?: string;
  showCountdown?: boolean;
}

interface LoginConfig {
  passwordMode?: "none" | "optional" | "required";
  password?: string;
}

function getCoverConfig(event: UserEvent): CoverConfig {
  const cfg = event.cover_config as Record<string, unknown> | null;
  if (!cfg || typeof cfg !== "object") return {};
  return cfg as unknown as CoverConfig;
}

function getLoginConfig(event: UserEvent): LoginConfig {
  const cfg = event.login_config as Record<string, unknown> | null;
  if (!cfg || typeof cfg !== "object") return {};
  return cfg as unknown as LoginConfig;
}

export default function Cover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn, isAuthenticated, eventId } = useGuestAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["guest_event", slug],
    enabled: !!slug,
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
  });

  // Auto-redirect to home if already signed in for this event
  useEffect(() => {
    if (event && isAuthenticated && eventId === event.id) {
      navigate(`/e/${slug}/home`, { replace: true });
    }
  }, [event, isAuthenticated, eventId, navigate, slug]);

  const loginConfig = event ? getLoginConfig(event) : {};
  const coverConfig = event ? getCoverConfig(event) : {};
  const needsPassword = loginConfig.passwordMode !== "none";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter your username.");
      return;
    }
    if (needsPassword && loginConfig.passwordMode === "required" && !password) {
      setError("Please enter the password.");
      return;
    }
    if (
      needsPassword &&
      loginConfig.password &&
      password !== loginConfig.password
    ) {
      setError("Incorrect password.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const { data: guest, error: guestError } = await supabase
        .from("event_guests")
        .select("*")
        .ilike("username", trimmed)
        .eq("event_id", event.id)
        .maybeSingle();
      if (guestError) throw guestError;
      if (!guest) {
        setError("Username not found");
        return;
      }
      const g = guest as EventGuest;
      signIn(g.name, event.id, g.id, g.token);
      navigate(`/e/${slug}/home`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setSubmitting(false);
    }
  };

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
        <p className="max-w-md text-lg text-dash-text">
          This invitation website could not be found or is no longer available.
        </p>
        <Link
          to="/"
          className="text-sm font-medium text-dash-primary hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  const theme = jsonToTheme(event.theme as Json | null);

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {event.cover_image && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${event.cover_image})` }}
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 w-full max-w-md text-center text-white">
          {event.event_type && (
            <p className="mb-2 text-sm uppercase tracking-widest text-white/80">
              {event.event_type}
            </p>
          )}
          <h1 className="mb-3 text-4xl font-bold">{event.name}</h1>
          {coverConfig.subtitle && (
            <p className="mb-3 text-lg text-white/90">{coverConfig.subtitle}</p>
          )}
          {event.event_date && (
            <p className="mb-1 text-base text-white/90">
              {formatDate(event.event_date)}
              {event.event_time && ` at ${to12Hour(event.event_time)}`}
            </p>
          )}
          {event.venue && <p className="text-sm text-white/80">{event.venue}</p>}

          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col gap-3 rounded-lg bg-white/10 p-6 backdrop-blur"
          >
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full rounded-md border border-white/30 bg-white/20 px-3 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              autoComplete="username"
            />
            {needsPassword && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-md border border-white/30 bg-white/20 px-3 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                autoComplete="current-password"
              />
            )}
            {error && (
              <p className="text-sm text-red-200">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-event-primary px-4 py-2 font-semibold text-event-primary-fg transition-colors hover:bg-event-primary-hover disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Enter"}
            </button>
          </form>
        </div>
      </div>
    </EventThemeProvider>
  );
}
