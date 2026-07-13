import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";

export default function GuestLoginPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const { signIn } = useGuestAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const config = event.login_config || {};
  const bgImage = config.bgImage;
  const bgColor = config.bgColor || "#1a1a2e";
  const overlayColor = config.overlayColor || "#000000";
  const overlayOpacity = config.overlayOpacity ?? 0.2;
  const textColor = config.textColor || "#ffffff";
  const buttonColor = config.buttonColor || "#ffffff";
  const buttonText = config.buttonText || "Continue";
  const heading = config.heading || `Welcome to ${event.name || "Our Event"}`;
  const subheading = config.subheading || "Please enter your name to continue";
  const inputPlaceholder = config.inputPlaceholder || "Your full name";
  const eventType = event.event_type || "Event";

  const containerStyle: React.CSSProperties = {
    backgroundImage: bgImage ? `url(${bgImage})` : undefined,
    backgroundColor: bgColor,
    color: textColor,
  };

  const overlayStyle: React.CSSProperties = {
    backgroundColor: overlayColor,
    opacity: overlayOpacity,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    signIn(name.trim(), event.id);
    navigate("home");
  };

  return (
    <div
      className="event-themed relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-8 text-center"
      style={containerStyle}
    >
      <div className="absolute inset-0" style={overlayStyle} />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-4">
        {config.logo && (
          <img
            src={config.logo}
            alt="Logo"
            style={{ width: config.logoWidth || 100 }}
            className="mb-2 max-w-[60%] object-contain"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        )}

        <h2
          className="text-3xl font-semibold"
          style={{ fontFamily: "var(--event-heading-font)" }}
        >
          {heading}
        </h2>

        <p className="text-sm opacity-80">{subheading}</p>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder={inputPlaceholder}
            className="w-full rounded-md border px-4 py-3 text-center text-sm text-gray-900 placeholder:text-gray-400"
            style={{ borderColor: "rgba(255,255,255,0.3)" }}
            autoFocus
          />

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            className="w-full rounded px-6 py-3 text-sm font-medium uppercase tracking-wider transition-opacity hover:opacity-90"
            style={{
              backgroundColor: buttonColor,
              color: textColor,
              borderRadius: "var(--event-button-radius, 6px)",
            }}
          >
            {buttonText}
          </button>
        </form>

        <p className="text-xs opacity-60">{eventType}</p>
      </div>
    </div>
  );
}
