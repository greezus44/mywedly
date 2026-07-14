import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import { useGuestAuth } from "../../lib/guest-auth";
import { LoadingSpinner } from "../../components/ui";

export default function RustySignInPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn } = useGuestAuth();

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: event, isLoading } = useQuery({
    queryKey: ["rusty-event", slug],
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event || !username.trim()) return;
    setError(null);
    setLoading(true);
    const result = await signIn(event.id, username.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate(`/r/${slug}/home`);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: RUSTY_THEME.colors.bg }}>
        <LoadingSpinner />
      </div>
    );
  }

  const loginConfig = (event?.login_config ?? {}) as Record<string, unknown>;
  const headingRaw = loginConfig.heading;
  const headingText = typeof headingRaw === "object" && headingRaw !== null
    ? ((headingRaw as Record<string, unknown>).text as string) ?? "Welcome"
    : typeof headingRaw === "string" ? headingRaw : "Welcome";
  const placeholder = (loginConfig.placeholder as string) ?? "Enter your username";
  const buttonLabel = (loginConfig.buttonLabel as string) ?? "Sign In";

  return (
    <EventThemeProvider theme={RUSTY_THEME}>
      <div
        className="flex min-h-screen flex-col items-center justify-center px-6 py-12"
        style={{ backgroundColor: RUSTY_THEME.colors.bg }}
      >
        <div className="w-full max-w-sm text-center">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: RUSTY_THEME.fonts.heading, color: RUSTY_THEME.colors.heading }}
          >
            {headingText}
          </h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={placeholder}
              required
              className="w-full rounded px-4 py-3 text-center text-base focus:outline-none"
              style={{
                border: `1px solid ${RUSTY_THEME.colors.border}`,
                backgroundColor: RUSTY_THEME.colors.surface,
                color: RUSTY_THEME.colors.text,
                borderRadius: RUSTY_THEME.radius,
              }}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full py-3 text-base font-semibold transition-colors disabled:opacity-50"
              style={{
                backgroundColor: RUSTY_THEME.colors.primary,
                color: RUSTY_THEME.colors.primaryFg,
                borderRadius: RUSTY_THEME.radius,
              }}
            >
              {loading ? "Signing in…" : buttonLabel}
            </button>
          </form>
        </div>
      </div>
    </EventThemeProvider>
  );
}
