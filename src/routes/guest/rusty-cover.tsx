import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDate, formatTime12 } from "../../lib/utils";

export default function RustyCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn } = useGuestAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (loginCfg.require_password && password !== loginCfg.password) { setError("Incorrect password"); return; }
    signIn(name.trim(), event.id);
    navigate(`/e/${slug}/home`);
  };

  return (
    <EventThemeProvider initialTheme={event.theme || RUSTY_THEME}>
      <div className="min-h-screen relative flex flex-col items-center justify-center text-center px-4" style={{ background: "var(--event-bg)", color: "var(--event-text)", fontFamily: "var(--event-font)" }}>
        {cfg.cover_image && <img src={cfg.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />}
        <div className="relative z-10 max-w-md w-full p-8 rounded-2xl" style={{ background: "var(--event-surface)", border: "2px solid var(--event-border)" }}>
          {cfg.logo_image && <img src={cfg.logo_image} alt="logo" className="w-24 h-24 mx-auto mb-6 rounded-full object-cover" style={{ border: "3px solid var(--event-primary)" }} />}
          <h1 className="text-4xl font-serif mb-3" style={{ color: "var(--event-primary)" }}>{cfg.title || event.name}</h1>
          {cfg.subtitle && <p className="text-lg mb-4 event-muted-text">{cfg.subtitle}</p>}
          {cfg.date && <p className="text-base mb-1">{formatDate(cfg.date)}</p>}
          {cfg.time && <p className="text-base mb-1">{formatTime12(cfg.time)}</p>}
          {cfg.venue && <p className="text-base mb-6">{cfg.venue}</p>}
          <form onSubmit={handleEnter} className="mt-6 space-y-3">
            {loginCfg.heading && <h2 className="text-xl font-serif" style={{ color: "var(--event-primary)" }}>{loginCfg.heading}</h2>}
            {loginCfg.subheading && <p className="text-sm event-muted-text">{loginCfg.subheading}</p>}
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className="w-full px-4 py-2.5 rounded-lg border bg-white text-center" style={{ borderColor: "var(--event-border)" }} />
            {loginCfg.require_password && <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="w-full px-4 py-2.5 rounded-lg border bg-white text-center" style={{ borderColor: "var(--event-border)" }} />}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full px-6 py-2.5 rounded-lg text-white font-medium" style={{ background: "var(--event-primary)" }}>Enter</button>
          </form>
        </div>
      </div>
    </EventThemeProvider>
  );
}
