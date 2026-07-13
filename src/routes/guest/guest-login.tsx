import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui";

export default function GuestLogin() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const { signIn } = useGuestAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cfg = event.login_config || {};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (cfg.require_password && password !== cfg.password) { setError("Incorrect password"); return; }
    signIn(name.trim(), event.id);
    navigate(`/e/${event.slug}/home`);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-8">
      {cfg.background_image && <img src={cfg.background_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
      <div className="relative z-10 w-full max-w-md">
        {cfg.logo_image && <img src={cfg.logo_image} alt="logo" className="w-20 h-20 mx-auto mb-6 rounded-full object-cover" />}
        <h2 className="text-2xl font-serif text-center mb-2" style={{ color: "var(--event-primary)" }}>{cfg.heading || "Sign In"}</h2>
        {cfg.subheading && <p className="text-center text-sm mb-6" style={{ color: "var(--event-muted)" }}>{cfg.subheading}</p>}
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-3 text-center" />
          {cfg.require_password && <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="px-4 py-3 text-center" />}
          <Button type="submit" className="w-full py-3">Sign In</Button>
        </form>
      </div>
    </div>
  );
}
