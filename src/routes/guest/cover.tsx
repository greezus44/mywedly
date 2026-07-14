import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { DEFAULT_THEME, jsonToTheme } from "../../lib/theme";
import { formatDate } from "../../lib/utils";

export default function GuestCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guestId, eventId, signIn } = useGuestAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    if (event && guestId && eventId === event.id) {
      navigate(`/e/${slug}/home`, { replace: true });
    }
  }, [event, guestId, eventId, slug, navigate]);

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
        <Link to="/" className="text-dash-primary hover:underline">Return home</Link>
      </div>
    );
  }

  const theme = jsonToTheme(event.theme);
  const coverConfig = (event.cover_config ?? {}) as { subtitle?: string; overlayOpacity?: number };
  const loginConfig = (event.login_config ?? {}) as { passwordMode?: string; password?: string; signInText?: string };
  const logoConfig = (event.logo_config ?? {}) as { url?: string };
  const overlay = coverConfig.overlayOpacity ?? 0.3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (loginConfig.passwordMode && loginConfig.passwordMode !== "none" && password !== (loginConfig.password ?? "")) {
        setError("Incorrect password.");
        setSubmitting(false);
        return;
      }
      const { data: guest, error: gError } = await supabase
        .from("event_guests")
        .select("id, name, username")
        .ilike("username", username.trim())
        .eq("event_id", event.id)
        .maybeSingle();
      if (gError) throw gError;
      if (!guest) {
        setError("Username not found. Please check your invitation.");
        setSubmitting(false);
        return;
      }
      signIn(guest.name, event.id, guest.id);
      navigate(`/e/${slug}/home`, { replace: true });
    } catch {
      setError("Sign-in failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
        {event.cover_image ? (
          <>
            <div className="absolute inset-0">
              <img src={event.cover_image} alt={event.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />
            </div>
          </>
        ) : null}

        <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6 py-16 text-center animate-fadeIn">
          {logoConfig.url && (
            <img src={logoConfig.url} alt="Logo" className="mb-8 h-16 w-auto object-contain opacity-90" />
          )}

          <p className="guest-eyebrow" style={{ color: "var(--event-primary-fg)" }}>
            {event.event_type || "Invitation"}
          </p>

          <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl" style={{ color: "var(--event-primary-fg)" }}>
            {event.name}
          </h1>

          {event.event_date && (
            <p className="mb-2 text-lg opacity-90" style={{ color: "var(--event-primary-fg)" }}>
              {formatDate(event.event_date)}
            </p>
          )}

          {coverConfig.subtitle && (
            <p className="mb-10 text-base opacity-80" style={{ color: "var(--event-primary-fg)" }}>
              {coverConfig.subtitle}
            </p>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md" style={{ borderColor: "var(--event-primary-fg)", opacity: 0.95 }}>
            <div className="text-left">
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-primary-fg)" }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="event-input"
                style={{ backgroundColor: "rgba(255,255,255,0.95)" }}
                required
              />
            </div>
            {loginConfig.passwordMode && loginConfig.passwordMode !== "none" && (
              <div className="text-left">
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-primary-fg)" }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="event-input"
                  style={{ backgroundColor: "rgba(255,255,255,0.95)" }}
                  required
                />
              </div>
            )}
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="event-btn-primary w-full disabled:opacity-50"
            >
              {submitting ? "Signing in..." : (loginConfig.signInText || "Enter")}
            </button>
          </form>
        </div>
      </div>
    </EventThemeProvider>
  );
}
