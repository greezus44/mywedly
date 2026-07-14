import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME, jsonToTheme } from "../../lib/theme";
import { formatDate } from "../../lib/utils";

export default function RustyCover() {
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
      navigate(`/r/${slug}/home`, { replace: true });
    }
  }, [event, guestId, eventId, slug, navigate]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold">Invitation Not Found</h1>
        <p className="text-dash-muted">This invitation website could not be found or is no longer available.</p>
        <Link to="/" className="text-dash-primary hover:underline">Return home</Link>
      </div>
    );
  }

  const theme = RUSTY_THEME;
  const coverConfig = (event.cover_config ?? {}) as { subtitle?: string };
  const loginConfig = (event.login_config ?? {}) as { passwordMode?: string; password?: string; signInText?: string };

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
      navigate(`/r/${slug}/home`, { replace: true });
    } catch {
      setError("Sign-in failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {event.cover_image && (
          <div className="mb-8 w-full max-w-2xl overflow-hidden rounded-2xl">
            <img src={event.cover_image} alt={event.name} className="h-64 w-full object-cover" />
          </div>
        )}
        <h1 className="mb-2 text-4xl font-bold">{event.name}</h1>
        {event.event_date && <p className="mb-1 text-lg opacity-80">{formatDate(event.event_date)}</p>}
        {coverConfig.subtitle && <p className="mb-8 text-lg opacity-70">{coverConfig.subtitle}</p>}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium opacity-80">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" className="event-input" required />
          </div>
          {loginConfig.passwordMode && loginConfig.passwordMode !== "none" && (
            <div>
              <label className="mb-1 block text-sm font-medium opacity-80">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="event-input" required />
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="event-btn-primary w-full disabled:opacity-50">
            {submitting ? "Signing in..." : (loginConfig.signInText || "Enter")}
          </button>
        </form>
      </div>
    </EventThemeProvider>
  );
}
