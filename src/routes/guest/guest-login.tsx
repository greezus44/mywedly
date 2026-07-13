import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type LoginConfig, type LogoConfig } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToCssVars, DEFAULT_THEME } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { CSSProperties, FormEvent } from "react";

export default function GuestLogin() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { signIn, isAuthenticated, eventId: authEventId } = useGuestAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const { data: event, isLoading } = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  useEffect(() => {
    if (isAuthenticated && eventId && authEventId === eventId) {
      navigate(`/${eventId}/home`, { replace: true });
    }
  }, [isAuthenticated, authEventId, eventId, navigate]);

  const theme = event?.theme || event?.draft_theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;
  const config: LoginConfig = event?.login_config || event?.draft_login_config || {};
  const logo: LogoConfig = event?.logo_config || event?.draft_logo_config || { enabled: false };
  const eventName = event?.name || event?.draft_name || "";

  const bgImage = config.bgImage || "";
  const bgColor = config.bgColor || "#f8fafc";
  const overlayColor = config.overlayColor || "#000000";
  const overlayOpacity = config.overlayOpacity ?? 0.4;
  const textColor = config.textColor || "#1e293b";
  const buttonColor = config.buttonColor || "#0f172a";
  const buttonText = config.buttonText || "Continue";
  const heading = config.heading || "Welcome";
  const subheading = config.subheading || "Please enter your name to continue";
  const inputPlaceholder = config.inputPlaceholder || "Your full name";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !eventId) return;
    setSubmitting(true);
    signIn(name.trim(), eventId);
    setTimeout(() => {
      navigate(`/${eventId}/home`, { replace: true });
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
      </div>
    );
  }

  const backgroundStyle: CSSProperties = bgImage
    ? { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: bgColor };

  return (
    <div
      style={{ ...cssVars, ...backgroundStyle }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-6"
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: overlayColor, opacity: bgImage ? overlayOpacity : 0 }}
      />

      <div
        className={`relative z-10 w-full max-w-md transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div
          className="rounded-2xl p-8 shadow-xl border"
          style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)" }}
        >
          {logo.enabled && (logo.image || logo.text) && (
            <div className="flex justify-center mb-6">
              {logo.image ? (
                <img
                  src={logo.image}
                  alt={logo.text || eventName}
                  className="max-h-16 object-contain"
                  style={logo.fontSize ? { maxHeight: logo.fontSize } : undefined}
                />
              ) : (
                <p
                  className="font-semibold"
                  style={{
                    color: logo.color || textColor,
                    fontSize: `${logo.fontSize || 18}px`,
                  }}
                >
                  {logo.text}
                </p>
              )}
            </div>
          )}

          <div className="text-center mb-8">
            {eventName && (
              <p className="italic text-sm mb-2" style={{ color: "var(--color-text-muted)" }}>
                {eventName}
              </p>
            )}
            <h1 className="text-3xl font-light mb-2" style={{ color: textColor, fontFamily: "var(--font-heading)" }}>
              {heading}
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {subheading}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={inputPlaceholder}
              required
              autoFocus
              className="text-center text-base py-3"
            />
            <Button
              type="submit"
              disabled={!name.trim() || submitting}
              loading={submitting}
              size="lg"
              className="w-full"
              style={{ backgroundColor: buttonColor, color: bgColor }}
            >
              {buttonText}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
