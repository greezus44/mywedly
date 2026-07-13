import React, { useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";
import { formatDate, formatTime12 } from "../../lib/utils";

export default function GuestCover() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const cfg = event.cover_config || {};

  useEffect(() => {
    const timer = setTimeout(() => navigate(`/e/${event.slug}/login`), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-center p-8">
      {cfg.cover_image && <img src={cfg.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
      <div className="relative z-10">
        {cfg.logo_image && <img src={cfg.logo_image} alt="logo" className="w-24 h-24 mx-auto mb-4 rounded-full object-cover" />}
        <h1 className="text-4xl md:text-5xl font-serif mb-4" style={{ color: "var(--event-primary)" }}>{cfg.title || event.name}</h1>
        {cfg.subtitle && <p className="text-xl mb-4" style={{ color: "var(--event-muted)" }}>{cfg.subtitle}</p>}
        {cfg.date && <p className="text-lg mb-1">{formatDate(cfg.date)}</p>}
        {cfg.time && <p className="text-lg mb-1">{formatTime12(cfg.time)}</p>}
        {cfg.venue && <p className="text-lg">{cfg.venue}</p>}
      </div>
    </div>
  );
}
