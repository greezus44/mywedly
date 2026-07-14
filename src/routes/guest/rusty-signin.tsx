import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { resolveTypography } from "../../lib/typography";

interface LoginConfig {
  heading?: unknown;
  subheading?: unknown;
  placeholder?: string;
  buttonLabel?: string;
}

export default function RustySignIn() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guest, eventId, signIn } = useGuestAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["published-event", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  useEffect(() => { if (event && guest && eventId === event.id) navigate(`/r/${slug}/home`, { replace: true }); }, [event, guest, eventId, slug, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setError(null); setSubmitting(true);
    const result = await signIn(event.id, username.trim());
    setSubmitting(false);
    if (result.error) setError(result.error);
    else navigate(`/r/${slug}/home`, { replace: true });
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-dash-bg"><div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
  if (!event) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center"><h1 className="text-2xl font-bold text-dash-text">Invitation Not Found</h1><Link to="/" className="text-dash-primary hover:underline">Return home</Link></div>;

  const loginConfig = (event.login_config ?? {}) as LoginConfig;
  const heading = resolveTypography(loginConfig.heading, event.name || "Welcome");
  const subheading = resolveTypography(loginConfig.subheading, "Please sign in to view your invitation");
  const placeholder = loginConfig.placeholder || "Enter your username";
  const buttonLabel = loginConfig.buttonLabel || "Sign In";

  return (
    <EventThemeProvider theme={event.theme}>
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="guest-title mb-2" style={heading.style}>{heading.text}</h1>
            <p className="guest-subtitle" style={subheading.style}>{subheading.text}</p>
          </div>
          <form onSubmit={handleSubmit} className="event-card space-y-4">
            <div>
              <label className="mb-1.5 block text-center text-sm font-medium" style={{ color: "var(--event-text)" }}>{placeholder}</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="event-input" placeholder={placeholder} required autoFocus style={{ textAlign: "center" }} />
            </div>
            {error && <p className="text-center text-sm" style={{ color: "var(--event-primary)" }}>{error}</p>}
            <button type="submit" disabled={submitting} className="event-btn-primary w-full" style={{ opacity: submitting ? 0.6 : 1 }}>{submitting ? "Signing in..." : buttonLabel}</button>
          </form>
          <div className="mt-6 text-center"><Link to={`/r/${slug}`} className="text-sm hover:underline" style={{ color: "var(--event-muted)" }}>Back to cover</Link></div>
        </div>
      </div>
    </EventThemeProvider>
  );
}
