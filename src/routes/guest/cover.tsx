import { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type Json } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme, DEFAULT_THEME } from "../../lib/theme";
import { LoadingSpinner } from "../../components/ui";
import { formatDate } from "../../lib/utils";

interface CoverConfig {
  subtitle?: string;
}

interface LoginConfig {
  passwordMode?: "none" | "optional" | "required";
  password?: string;
}

function jsonToCoverConfig(json: Json | null | undefined): CoverConfig {
  if (!json || typeof json !== "object") return {};
  return json as CoverConfig;
}

function jsonToLoginConfig(json: Json | null | undefined): LoginConfig {
  if (!json || typeof json !== "object") return { passwordMode: "none" };
  return json as LoginConfig;
}

export default function Cover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { eventId, guestId, signIn } = useGuestAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["public-event", slug],
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
    enabled: !!slug,
  });

  const loginConfig: LoginConfig = event
    ? jsonToLoginConfig(event.login_config)
    : { passwordMode: "none" };
  const coverConfig = event ? jsonToCoverConfig(event.cover_config) : {};
  const theme = event ? jsonToTheme(event.theme) : DEFAULT_THEME;

  // Auto-redirect to home if already signed in for this event
  useEffect(() => {
    if (event && eventId === event.id && guestId) {
      navigate(`/e/${slug}/home`, { replace: true });
    }
  }, [event, eventId, guestId, slug, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = username.trim();
    if (!trimmed || !event) return;

    // Check password if required
    if (loginConfig.passwordMode === "required") {
      if (!password) {
        setError("Please enter the password.");
        return;
      }
      if (loginConfig.password && password !== loginConfig.password) {
        setError("Incorrect password.");
        return;
      }
    }

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
        setSubmitting(false);
        return;
      }

      signIn((guest as EventGuest).name, event.id, (guest as EventGuest).id);
      navigate(`/e/${slug}/home`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-semibold text-dash-text">
          This invitation website could not be found or is no longer available.
        </h1>
        <Link to="/" className="text-dash-primary underline hover:opacity-80">
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
        {event.cover_image && (
          <img
            src={event.cover_image}
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {event.cover_image && (
          <div className="absolute inset-0 bg-black/40" />
        )}
        <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 p-6 text-center">
          {coverConfig.subtitle && (
            <p className="text-sm uppercase tracking-[0.3em] text-event-accent">
              {coverConfig.subtitle}
            </p>
          )}
          <h1
            className="text-4xl font-bold text-event-heading md:text-5xl"
            style={{ fontFamily: "var(--event-font-heading)" }}
          >
            {event.name}
          </h1>
          {event.event_date && (
            <p className="text-base text-event-text">
              {formatDate(event.event_date)}
              {event.venue ? ` · ${event.venue}` : ""}
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-4 flex w-full flex-col gap-3 rounded-lg bg-event-surface/90 p-6 backdrop-blur"
          >
            <p className="text-sm text-event-muted">Enter your username to continue</p>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="event-input"
              autoComplete="username"
              autoFocus
            />
            {loginConfig.passwordMode && loginConfig.passwordMode !== "none" && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="event-input"
                autoComplete="current-password"
              />
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="event-btn-primary mt-2"
            >
              {submitting ? "Entering..." : "Enter"}
            </button>
          </form>
        </div>
      </div>
    </EventThemeProvider>
  );
}
