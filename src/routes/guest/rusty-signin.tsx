import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import { cn } from "../../lib/utils";

export default function RustySignIn() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guestId, eventId, signIn } = useGuestAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["published-event", slug],
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

  // Redirect if already signed in for this event
  useEffect(() => {
    if (event && guestId && eventId === event.id) {
      navigate(`/r/${slug}/home`, { replace: true });
    }
  }, [event, guestId, eventId, slug, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = username.trim();
    if (!trimmed || !event) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .ilike("username", trimmed)
        .eq("event_id", event.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setError("We couldn't find that username. Please check and try again.");
        return;
      }

      const guest = data as EventGuest;
      signIn(guest.name, event.id, guest.id, guest.token);
      // Navigate to /r/${slug}/home on success
      navigate(`/r/${slug}/home`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Invitation Not Found</h1>
        <p className="text-dash-muted">This invitation website could not be found or is no longer available.</p>
      </div>
    );
  }

  const theme = RUSTY_THEME;
  const loginConfig = (event.login_config ?? {}) as {
    heading?: string;
    subtitle?: string;
    placeholder?: string;
    buttonText?: string;
  };

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 animate-fadeIn">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="guest-eyebrow">{event.name}</p>
            <h1 className="guest-title">
              {loginConfig.heading || "Welcome"}
            </h1>
            <p className="guest-subtitle mx-auto">
              {loginConfig.subtitle || "Enter your username to view the invitation"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="event-card event-card-hover space-y-5">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={loginConfig.placeholder || "Your username"}
                className="event-input"
                autoComplete="off"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !username.trim()}
              className={cn("event-btn-primary w-full", (submitting || !username.trim()) && "opacity-60 cursor-not-allowed")}
            >
              {submitting ? "Signing in…" : loginConfig.buttonText || "View Invitation"}
            </button>
          </form>
        </div>
      </div>
    </EventThemeProvider>
  );
}
