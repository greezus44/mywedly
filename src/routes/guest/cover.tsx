import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { LoadingSpinner } from "../../components/ui";

export default function Cover(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guestName, eventId, signIn } = useGuestAuth();
  const [username, setUsername] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: event, isLoading, error } = useQuery({
    queryKey: ["guest-event", slug],
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

  // Auto-redirect if already signed in for this event
  useEffect(() => {
    if (event && eventId === event.id && guestName) {
      navigate(`/e/${slug}/home`, { replace: true });
    }
  }, [event, eventId, guestName, slug, navigate]);

  const handleSignIn = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!event || !username.trim()) return;
    setSubmitting(true);
    setSignInError(null);
    const trimmed = username.trim();
    try {
      const { data: guest, error: guestError } = await supabase
        .from("event_guests")
        .select("*")
        .ilike("username", trimmed)
        .eq("event_id", event.id)
        .maybeSingle();
      if (guestError) throw guestError;
      if (!guest) {
        setSignInError("We couldn't find that username. Please check and try again.");
        return;
      }
      signIn(guest.name, event.id, guest.id, guest.token);
      navigate(`/e/${slug}/home`, { replace: true });
    } catch {
      setSignInError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <LoadingSpinner className="h-8 w-8 text-white" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 px-6 text-center">
        <p className="text-lg text-white/80">
          This invitation website could not be found or is no longer available.
        </p>
      </div>
    );
  }

  const theme = jsonToTheme(event.theme);
  const coverConfig = (event.cover_config as Record<string, unknown> | null) ?? {};
  const overlay = typeof coverConfig.overlay === "number" ? coverConfig.overlay : 0.4;

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="event-themed relative min-h-screen overflow-hidden">
        {/* Background */}
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80" />
        )}
        <div
          className="absolute inset-0"
          style={{ background: `rgba(0,0,0,${overlay})` }}
        />

        {/* Content */}
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
          {/* Logo */}
          {(() => {
            const logoConfig = (event.logo_config as Record<string, unknown> | null) ?? {};
            if (logoConfig.url) {
              return (
                <img
                  src={logoConfig.url as string}
                  alt="Logo"
                  className="mb-8 h-16 w-auto object-contain animate-fadeIn"
                />
              );
            }
            return null;
          })()}

          {/* Eyebrow */}
          <p className="guest-eyebrow text-white/70 animate-fadeIn">
            {event.event_type || "Invitation"}
          </p>

          {/* Title */}
          <h1
            className="mt-4 text-4xl font-bold text-white drop-shadow-lg animate-slideUp md:text-6xl"
            style={{ fontFamily: theme.fontHeading }}
          >
            {event.name}
          </h1>

          {/* Date */}
          {event.event_date && (
            <p className="mt-6 text-lg text-white/90 drop-shadow animate-fadeIn">
              {new Date(event.event_date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}

          {/* Subtitle */}
          {event.venue && (
            <p className="mt-2 text-sm text-white/70 animate-fadeIn">{event.venue}</p>
          )}

          {/* Sign-in card */}
          <div className="mt-12 w-full max-w-sm animate-slideUp">
            <div
              className="rounded-2xl border border-white/20 p-8 shadow-2xl"
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              }}
            >
              <h2 className="text-xl font-semibold text-white">Welcome</h2>
              <p className="mt-1 text-sm text-white/70">
                Enter your username to view your invitation
              </p>
              <form onSubmit={handleSignIn} className="mt-6 space-y-4">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15"
                />
                {signInError && <p className="text-sm text-red-200">{signInError}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold uppercase tracking-wider text-gray-900 transition hover:bg-white/90 disabled:opacity-60"
                >
                  {submitting ? "Loading…" : "View Invitation"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}
