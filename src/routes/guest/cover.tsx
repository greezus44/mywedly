import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDate, formatTime12 } from "../../lib/utils";

export default function GuestCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn } = useGuestAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center text-red-600">Event not found</div>;

  const cfg = event.cover_config || {};
  const loginCfg = event.login_config || {};

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedUsername = username.trim();
    if (!trimmedUsername) { setError("Please enter your username"); return; }
    setLoading(true);
    try {
      const { data: guest, error: guestError } = await supabase.from("event_guests").select("*").eq("event_id", event.id).ilike("username", trimmedUsername).maybeSingle();
      if (guestError) throw guestError;
      if (!guest) { setError("Username not found. Please check with the host."); setLoading(false); return; }
      if (loginCfg.require_password && password !== loginCfg.password) { setError("Incorrect password"); setLoading(false); return; }
      signIn(guest.name, event.id, guest.id);
      navigate(`/e/${slug}/home`);
    } catch (err: any) {
      setError("Unable to sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <EventThemeProvider initialTheme={event.theme}>
      <div className="min-h-screen relative flex flex-col items-center justify-center text-center px-4" style={{ background: "var(--event-bg)", color: "var(--event-text)", fontFamily: "var(--event-font)" }}>
        {cfg.cover_image && <img src={cfg.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
        <div className="relative z-10 max-w-md w-full">
          {cfg.logo_image && <img src={cfg.logo_image} alt="logo" className="w-24 h-24 mx-auto mb-6 rounded-full object-cover" />}
          <h1 className="text-4xl md:text-5xl font-serif mb-3" style={{ color: "var(--event-primary)" }}>{cfg.title || event.name}</h1>
          {cfg.subtitle && <p className="text-lg mb-4 event-muted-text">{cfg.subtitle}</p>}
          {cfg.date && <p className="text-base mb-1">{formatDate(cfg.date)}</p>}
          {cfg.time && <p className="text-base mb-1">{formatTime12(cfg.time)}</p>}
          {cfg.venue && <p className="text-base mb-6">{cfg.venue}</p>}
          <form onSubmit={handleEnter} className="mt-8 space-y-3">
            {loginCfg.heading && <h2 className="text-xl font-serif" style={{ color: "var(--event-primary)" }}>{loginCfg.heading}</h2>}
            {loginCfg.subheading && <p className="text-sm event-muted-text">{loginCfg.subheading}</p>}
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" className="w-full px-4 py-2.5 rounded-lg border bg-white/80 text-center" style={{ borderColor: "var(--event-border)" }} />
            {loginCfg.require_password && <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="w-full px-4 py-2.5 rounded-lg border bg-white/80 text-center" style={{ borderColor: "var(--event-border)" }} />}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full px-6 py-2.5 rounded-lg text-white font-medium disabled:opacity-50" style={{ background: "var(--event-primary)" }}>{loading ? "Signing in..." : "Enter"}</button>
          </form>
        </div>
      </div>
    </EventThemeProvider>
  );
}
