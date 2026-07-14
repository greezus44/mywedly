import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import type { Json } from "../../lib/supabase";

const RUSTY_THEME_JSON = RUSTY_THEME as unknown as Json;

export default function RustySignIn() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guest, eventId, signIn } = useGuestAuth();
  const [email, setEmail] = useState("");
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

  useEffect(() => {
    if (event && guest && eventId === event.id) {
      navigate(`/r/${slug}/home`, { replace: true });
    }
  }, [event, guest, eventId, slug, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setError(null);
    setSubmitting(true);
    const result = await signIn(event.id, email.trim());
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate(`/r/${slug}/home`, { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: RUSTY_THEME.colors.bg }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: RUSTY_THEME.colors.primary }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center" style={{ backgroundColor: RUSTY_THEME.colors.bg, color: RUSTY_THEME.colors.text }}>
        <h1 className="text-2xl font-bold" style={{ color: RUSTY_THEME.colors.heading }}>Invitation Not Found</h1>
        <Link to="/" className="hover:underline" style={{ color: RUSTY_THEME.colors.primary }}>Return home</Link>
      </div>
    );
  }

  return (
    <EventThemeProvider theme={RUSTY_THEME_JSON}>
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="guest-title mb-2">{event.name}</h1>
            <p className="guest-subtitle">Sign in to view your invitation</p>
          </div>

          <form onSubmit={handleSubmit} className="event-card space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="event-input"
                placeholder="your@email.com"
                required
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm" style={{ color: "var(--event-primary)" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="event-btn-primary w-full"
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to={`/r/${slug}`} className="text-sm hover:underline" style={{ color: "var(--event-muted)" }}>
              Back to cover
            </Link>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}
