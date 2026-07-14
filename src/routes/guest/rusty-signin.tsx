import { useState, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";

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

  if (event && guestId && eventId === event.id) {
    navigate(`/r/${slug}/home`, { replace: true });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = username.trim();
    if (!trimmed || !event) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", event.id)
        .ilike("username", trimmed)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setError("We couldn't find that username. Please check your invitation and try again.");
        return;
      }
      signIn(event.id, data.id, data.name, data.email ?? undefined);
      navigate(`/r/${slug}/home`, { replace: true });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: RUSTY_THEME.bg }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: RUSTY_THEME.primary }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center" style={{ backgroundColor: RUSTY_THEME.bg }}>
        <h1 className="text-2xl font-bold" style={{ color: RUSTY_THEME.heading }}>Invitation Not Found</h1>
        <p style={{ color: RUSTY_THEME.muted }}>This invitation website could not be found or is no longer available.</p>
        <Link to="/" className="hover:underline" style={{ color: RUSTY_THEME.primary }}>Return home</Link>
      </div>
    );
  }

  return (
    <EventThemeProvider theme={event.theme}>
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16 animate-fadeIn">
        <div className="w-full max-w-sm">
          <p className="guest-eyebrow text-center">{event.title || "Our Wedding"}</p>
          <h1 className="guest-title text-center" style={{ marginBottom: "0.5rem" }}>Welcome</h1>
          <p className="guest-subtitle text-center" style={{ marginBottom: "2rem" }}>
            Enter the username from your invitation to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              required
              autoFocus
              autoComplete="username"
              className="event-input"
              disabled={submitting}
            />

            {error && (
              <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="event-btn-primary w-full"
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to={`/r/${slug}`}
              className="text-sm hover:underline"
              style={{ color: "var(--event-muted)" }}
            >
              ← Back to cover
            </Link>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}
