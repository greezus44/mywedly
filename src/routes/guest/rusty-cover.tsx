import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import { formatDate, getCountdown } from "../../lib/utils";

export default function RustyCover() {
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

  useEffect(() => {
    if (event && storedEventId === event.id) {
      navigate(`/r/${slug}/home`, { replace: true });
    }
  }, [event, storedEventId, slug, navigate]);

  const coverConfig = (event?.cover_config || {}) as Record<string, any>;
  const loginConfig = (event?.login_config || {}) as Record<string, any>;
  const hasPassword = loginConfig.passwordMode && loginConfig.passwordMode !== "none";

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
        setError("Username not found");
        setSubmitting(false);
        return;
      }

      const foundGuest = guest as EventGuest;

      if (hasPassword) {
        const expectedPassword = loginConfig.password || "";
        if (password !== expectedPassword) {
          setError("Incorrect password. Please try again.");
          setSubmitting(false);
          return;
        }
      }

      signIn(foundGuest.name, event.id, foundGuest.id);
      navigate(`/r/${slug}/home`, { replace: true });
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: RUSTY_THEME.bg }}>
        <div className="animate-spin h-8 w-8 border-2 rounded-full" style={{ borderColor: RUSTY_THEME.primary, borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: RUSTY_THEME.bg }}>
        <div className="text-center max-w-md">
          <p className="text-lg mb-4" style={{ color: RUSTY_THEME.text, fontFamily: RUSTY_THEME.fontHeading }}>
            Something went wrong while loading the invitation.
          </p>
          <Link to="/" className="underline" style={{ color: RUSTY_THEME.primary }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: RUSTY_THEME.bg }}>
        <div className="text-center max-w-md">
          <p className="text-lg mb-4" style={{ color: RUSTY_THEME.text, fontFamily: RUSTY_THEME.fontHeading }}>
            This invitation website could not be found or is no longer available.
          </p>
          <Link to="/" className="underline" style={{ color: RUSTY_THEME.primary }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  const countdown = getCountdown(event.event_date);
  const subtitle = coverConfig.subtitle || "";

  return (
    <EventThemeProvider initialTheme={RUSTY_THEME}>
      <div className="relative min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--event-bg)", fontFamily: "var(--event-font-body)" }}>
        {event.cover_image ? (
          <div className="absolute inset-0">
            <img src={event.cover_image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(61, 43, 28, 0.5)" }} />
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${RUSTY_THEME.bg}, ${RUSTY_THEME.surface})` }}
          />
        )}

        <div className="relative z-10 w-full max-w-lg mx-auto px-6 py-16 text-center">
          {event.cover_image && (
            <>
              <h1 className="text-4xl md:text-5xl mb-2" style={{ color: "#ffffff", fontFamily: "var(--event-font-heading)", textShadow: "2px 2px 8px rgba(0,0,0,0.6)" }}>
                {event.name}
              </h1>
              {subtitle && (
                <p className="text-lg mb-3" style={{ color: "rgba(255,255,255,0.9)", fontFamily: "var(--event-font-body)" }}>
                  {subtitle}
                </p>
              )}
              {event.event_date && (
                <p className="text-sm mt-3 mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {formatDate(event.event_date)}
                </p>
              )}
              {!countdown.isPast && event.event_date && (
                <p className="text-xs mb-8" style={{ color: "rgba(255,255,255,0.75)" }}>
                  {countdown.days} days to go
                </p>
              )}
            </>
          )}

          {/* Sign-in card */}
          <div
            className="rounded-lg p-6 shadow-xl"
            style={{
              backgroundColor: "var(--event-surface)",
              border: `1px solid var(--event-border)`,
            }}
          >
            <h2 className="text-xl mb-1" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>
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
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: "var(--event-bg)",
                    border: "1px solid var(--event-border)",
                    color: "var(--event-text)",
                  }}
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
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "var(--event-bg)",
                      border: "1px solid var(--event-border)",
                      color: "var(--event-text)",
                    }}
                    autoComplete="current-password"
                    required
                  />
                </div>
              )}

              {error && (
                <p className="text-sm" style={{ color: "#a54434" }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "var(--event-primary)",
                  color: "var(--event-primary-fg)",
                }}
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
            <p className="text-sm mt-6" style={{ color: "var(--event-muted)" }}>
              {formatDate(event.event_date)}
            </p>
          )}
        </div>
      </div>
    </EventThemeProvider>
  );
}
