import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import type { ThemeConfig } from "../../lib/theme";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { DEFAULT_THEME } from "../../lib/theme";
import { formatDate, getCountdown } from "../../lib/utils";

export default function GuestCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn, eventId: storedEventId } = useGuestAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: event, isLoading, error: queryError } = useQuery({
    queryKey: ["published_event", slug],
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

  // If guest is already signed in for this event, redirect to home
  useEffect(() => {
    if (event && storedEventId === event.id) {
      navigate(`/e/${slug}/home`, { replace: true });
    }
  }, [event, storedEventId, slug, navigate]);

  const coverConfig = (event?.cover_config || {}) as Record<string, any>;
  const loginConfig = (event?.login_config || {}) as Record<string, any>;
  const hasPassword = loginConfig.passwordMode && loginConfig.passwordMode !== "none";
  const theme = (event?.theme || DEFAULT_THEME) as ThemeConfig;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = username.trim();
    if (!trimmed || !event) return;

    setSubmitting(true);
    try {
      const { data: guest, error: guestError } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", event.id)
        .ilike("username", trimmed)
        .maybeSingle();

      if (guestError) throw guestError;

      if (!guest) {
        setError("Username not found. Please check your invitation for the correct username.");
        setSubmitting(false);
        return;
      }

      const foundGuest = guest as EventGuest;

      // If password mode is enabled, verify password
      if (hasPassword) {
        const expectedPassword = loginConfig.password || "";
        if (password !== expectedPassword) {
          setError("Incorrect password. Please try again.");
          setSubmitting(false);
          return;
        }
      }

      signIn(foundGuest.name, event.id, foundGuest.id);
      navigate(`/e/${slug}/home`, { replace: true });
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-2 border-amber-700 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Error state
  if (queryError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <p className="text-lg text-gray-700 mb-4">Something went wrong while loading the invitation.</p>
          <Link to="/" className="text-amber-700 underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  // Not found / not published
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <p className="text-lg text-gray-700 mb-4">
            This invitation website could not be found or is no longer available.
          </p>
          <Link to="/" className="text-amber-700 underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  const countdown = getCountdown(event.event_date);
  const subtitle = coverConfig.subtitle || "";

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="relative min-h-screen flex items-center justify-center">
        {/* Cover image background */}
        {event.cover_image ? (
          <div className="absolute inset-0">
            <img src={event.cover_image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--event-bg)] to-[var(--event-surface)]" />
        )}

        {/* Cover content */}
        <div className="relative z-10 w-full max-w-lg mx-auto px-6 py-16 text-center">
          {event.cover_image && (
            <>
              <h1 className="font-event text-4xl md:text-5xl text-white drop-shadow-lg mb-2">
                {event.name}
              </h1>
              {subtitle && (
                <p className="font-event-body text-lg text-white/90 drop-shadow mb-3">
                  {subtitle}
                </p>
              )}
              {event.event_date && (
                <p className="font-event-body text-sm text-white/80 mt-3 mb-2">
                  {formatDate(event.event_date)}
                </p>
              )}
              {!countdown.isPast && event.event_date && (
                <p className="font-event-body text-xs text-white/70 mb-8">
                  {countdown.days} days to go
                </p>
              )}
            </>
          )}

          {/* Sign-in form */}
          <div
            className="rounded-2xl p-6 shadow-xl"
            style={{
              backgroundColor: "var(--event-surface)",
              border: "1px solid var(--event-border)",
            }}
          >
            <h2 className="font-event text-xl mb-1" style={{ color: "var(--event-heading)" }}>
              Welcome
            </h2>
            <p className="text-sm mb-5" style={{ color: "var(--event-muted)" }}>
              Enter your username to view your invitation
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--event-muted)" }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="event-input"
                  autoComplete="username"
                  required
                />
              </div>

              {hasPassword && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--event-muted)" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="event-input"
                    autoComplete="current-password"
                    required
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="event-btn-primary w-full flex items-center justify-center gap-2"
              >
                {submitting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {submitting ? "Signing in..." : "Enter"}
              </button>
            </form>
          </div>

          {!event.cover_image && event.event_date && (
            <p className="font-event-body text-sm mt-6" style={{ color: "var(--event-muted)" }}>
              {formatDate(event.event_date)}
            </p>
          )}
        </div>
      </div>
    </EventThemeProvider>
  );
}
