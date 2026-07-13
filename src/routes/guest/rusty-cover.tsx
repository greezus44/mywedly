import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import { formatDate, formatTime12 } from "../../lib/utils";
import { useGuestAuth } from "../../lib/guest-auth";

interface CoverConfig {
  subtitle?: string;
  overlayOpacity?: number;
  titleColor?: string;
}

interface LoginConfig {
  passwordMode?: "none" | "optional" | "required";
  password?: string;
  heading?: string;
  subheading?: string;
  cta?: string;
}

export default function RustyCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guestName, eventId, signIn } = useGuestAuth();

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
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!slug,
  });

  // Auto-redirect to home if already signed in for this event
  useEffect(() => {
    if (event && guestName && eventId === event.id) {
      navigate(`/r/${slug}/home`, { replace: true });
    }
  }, [event, guestName, eventId, slug, navigate]);

  const loginConfig = (event?.login_config ?? {}) as unknown as LoginConfig;
  const coverConfig = (event?.cover_config ?? {}) as unknown as CoverConfig;
  const showPassword = loginConfig.passwordMode && loginConfig.passwordMode !== "none";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !username.trim()) return;
    setError(null);
    setSubmitting(true);

    try {
      if (showPassword && loginConfig.passwordMode === "required") {
        if (password !== (loginConfig.password ?? "")) {
          setError("Incorrect password.");
          setSubmitting(false);
          return;
        }
      }

      const { data: guest, error: guestError } = await supabase
        .from("event_guests")
        .select("*")
        .ilike("username", username.trim())
        .eq("event_id", event.id)
        .maybeSingle();

      if (guestError) throw guestError;

      if (!guest) {
        setError("Username not found");
        setSubmitting(false);
        return;
      }

      signIn((guest as EventGuest).name, event.id, (guest as EventGuest).id);
      navigate(`/r/${slug}/home`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading…</div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center">
        <p className="text-lg text-gray-600">
          This invitation website could not be found or is no longer available.
        </p>
        <Link to="/" className="text-sm font-semibold text-blue-600 hover:underline">
          Go to homepage
        </Link>
      </div>
    );
  }

  const overlayOpacity = coverConfig.overlayOpacity ?? 0.3;
  const titleColor = coverConfig.titleColor || "#ffffff";

  return (
    <EventThemeProvider initialTheme={RUSTY_THEME}>
      <div
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
        style={{
          backgroundImage: event.cover_image ? `url(${event.cover_image})` : undefined,
          backgroundColor: event.cover_image ? undefined : "var(--event-surface)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {event.cover_image && (
          <div className="absolute inset-0" style={{ backgroundColor: "#000", opacity: overlayOpacity }} />
        )}

        <div className="relative z-10 w-full max-w-md px-6 text-center">
          {/* Cover info */}
          <div className="mb-10" style={{ color: titleColor }}>
            <p className="text-sm uppercase tracking-widest" style={{ opacity: 0.85 }}>
              {event.event_type || "Invitation"}
            </p>
            <h1 className="mt-2 text-4xl font-bold" style={{ fontFamily: "var(--event-font-heading)" }}>
              {event.name}
            </h1>
            {coverConfig.subtitle && (
              <p className="mt-3 text-lg" style={{ opacity: 0.9 }}>
                {coverConfig.subtitle}
              </p>
            )}
            <p className="mt-2 text-base" style={{ opacity: 0.85 }}>
              {formatDate(event.event_date)}
              {event.event_time ? ` at ${formatTime12(event.event_time)}` : ""}
            </p>
            {event.venue && (
              <p className="mt-1 text-sm" style={{ opacity: 0.8 }}>
                {event.venue}
              </p>
            )}
          </div>

          {/* Sign-in form */}
          <div className="event-card text-left">
            <h2 className="text-center text-xl font-bold" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>
              {loginConfig.heading ?? "Enter your username to continue"}
            </h2>
            <p className="mt-1 text-center text-sm" style={{ color: "var(--event-muted)" }}>
              {loginConfig.subheading ?? "Please enter the username on your invitation"}
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="event-input"
                autoComplete="username"
              />

              {showPassword && (
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="event-input"
                  autoComplete="current-password"
                />
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting || !username.trim()}
                className="event-btn-primary w-full disabled:opacity-50"
              >
                {submitting ? "Checking…" : (loginConfig.cta ?? "Continue")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}
