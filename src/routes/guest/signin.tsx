import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { jsonToTheme, themeToEventCssVars } from "../../lib/theme";

export default function GuestSignIn() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn } = useGuestAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: event } = useQuery({
    queryKey: ["event_by_slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!slug,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !event) return;
    setLoading(true);
    setError(null);
    const { error: err } = await signIn(event.id, username.trim());
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      navigate(`/e/${slug}/home`);
    }
  };

  if (!event) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  const theme = jsonToTheme(event.theme as Record<string, unknown> | null);
  const loginConfig = (event.login_config ?? {}) as Record<string, unknown>;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ ...themeToEventCssVars(theme), backgroundColor: theme.background, color: theme.text, fontFamily: theme.bodyFont }}
    >
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2" style={{ fontFamily: theme.headingFont, color: theme.text }}>
            {(loginConfig.title as string) || "Welcome"}
          </h1>
          <p className="text-sm" style={{ color: theme.textMuted }}>
            {(loginConfig.subtitle as string) || "Please enter your name to continue"}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }}
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full py-3 rounded-lg text-base font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: theme.primary, color: "#fff", borderRadius: theme.buttonRadius }}
          >
            {loading ? "Signing in…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
