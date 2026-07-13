import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME, type ThemeConfig } from "../../lib/theme";
import { formatDate } from "../../lib/utils";

interface CoverConfig { subtitle?: string; [k: string]: any }
interface LoginConfig { passwordMode?: string; password?: string; [k: string]: any }

export default function RustyCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guestName, eventId, signIn } = useGuestAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: event, isLoading, error: queryError } = useQuery({
    queryKey: ["rusty_event", slug],
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

  useEffect(() => {
    if (event && guestName && eventId === event.id) {
      navigate(`/r/${slug}/home`, { replace: true });
    }
  }, [event, guestName, eventId, slug, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed || !event) return;
    setError(null);
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
      const loginConfig = (event.login_config ?? {}) as LoginConfig;
      if (loginConfig.passwordMode && loginConfig.passwordMode !== "none") {
        const typedGuest = guest as EventGuest;
        if (loginConfig.passwordMode === "shared" && password !== loginConfig.password) {
          setError("Incorrect password");
          setSubmitting(false);
          return;
        }
        if (loginConfig.passwordMode === "per_guest" && password !== typedGuest.token) {
          setError("Incorrect password");
          setSubmitting(false);
          return;
        }
      }
      signIn((guest as EventGuest).name, event.id, (guest as EventGuest).id);
      navigate(`/r/${slug}/home`, { replace: true });
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-event-bg"><div className="animate-pulse text-event-muted">Loading…</div></div>;
  }

  if (queryError || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">This invitation website could not be found or is no longer available.</h1>
        <Link to="/" className="mt-6 text-dash-primary hover:underline">Return home</Link>
      </div>
    );
  }

  const theme = (event.theme ?? RUSTY_THEME) as ThemeConfig;
  const coverConfig = (event.cover_config ?? {}) as CoverConfig;
  const loginConfig = (event.login_config ?? {}) as LoginConfig;
  const hasPassword = loginConfig.passwordMode && loginConfig.passwordMode !== "none";

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {event.cover_image ? (
          <>
            <img src={event.cover_image} alt="Cover" className="absolute inset-0 w-full h-full object-cover sepia-[0.2]" />
            <div className="absolute inset-0 bg-black/40" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-event-bg to-event-surface" />
        )}
        <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6 py-12 text-center">
          <h1 className="font-event text-3xl md:text-5xl text-white drop-shadow-lg">{event.name}</h1>
          {coverConfig.subtitle && <p className="mt-3 font-event-body text-lg text-white/90 drop-shadow">{coverConfig.subtitle}</p>}
          {event.event_date && <p className="mt-4 font-event-body text-sm text-white/80">{formatDate(event.event_date)}</p>}

          <form onSubmit={handleSubmit} className="mt-8 w-full space-y-3 rounded-xl bg-event-surface/95 p-6 shadow-xl backdrop-blur border border-event-border">
            <h2 className="font-event text-xl text-event-heading">Enter your username to continue</h2>
            <input type="text" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} className="event-input" autoFocus />
            {hasPassword && <input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="event-input" />}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={submitting} className="event-btn-primary w-full">{submitting ? "Please wait…" : "Enter"}</button>
          </form>
        </div>
      </div>
    </EventThemeProvider>
  );
}
