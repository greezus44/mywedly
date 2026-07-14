import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";

export default function GuestSignIn() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn } = useGuestAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(event.id, username.trim());
    if (signInError) {
      setError(signInError);
      setSubmitting(false);
      return;
    }
    navigate(`/e/${slug}/home`);
  };

  const coverImage = event.cover_image;

  return (
    <EventThemeProvider theme={event.theme}>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {coverImage && (
            <div className="mb-6 overflow-hidden rounded-t-xl">
              <img src={coverImage} alt="" className="h-40 w-full object-cover" />
            </div>
          )}
          <div className="event-card">
            <h1 className="guest-title text-center">{event.name}</h1>
            <p className="guest-subtitle text-center mb-6">
              Enter your username to continue
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                className="event-input"
                autoComplete="username"
                disabled={submitting}
              />
              {error && (
                <p className="text-sm" style={{ color: "var(--event-primary)" }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="event-btn-primary w-full"
                disabled={submitting}
              >
                {submitting ? "Signing in…" : "Continue"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}
