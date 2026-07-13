import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { DEFAULT_LOGIN_CONFIG, DEFAULT_LOGO_CONFIG } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { FormEvent } from "react";

export default function GuestLogin() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { token, eventId: authEventId, signIn } = useGuestAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: event, isLoading } = useQuery<UserEvent | null>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!eventId,
  });

  const isAuthenticated = !!token && authEventId === eventId;

  useEffect(() => {
    if (isAuthenticated && eventId) {
      navigate(`/${eventId}/home`, { replace: true });
    }
  }, [isAuthenticated, eventId, navigate]);

  const config = event ? { ...DEFAULT_LOGIN_CONFIG, ...event.login_config } : DEFAULT_LOGIN_CONFIG;
  const logoConfig = event ? { ...DEFAULT_LOGO_CONFIG, ...event.logo_config } : DEFAULT_LOGO_CONFIG;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !eventId) return;
    setSubmitting(true);
    setError(null);
    try {
      await signIn(name.trim(), eventId);
      navigate(`/${eventId}/home`, { replace: true });
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-pulse text-white/60 text-sm">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">Event not found</h2>
          <p className="mt-1 text-sm text-gray-500">This event may be private or no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-6 py-12"
      style={{
        background: config.bgImage
          ? `linear-gradient(rgba(0,0,0,${config.overlayOpacity}), rgba(0,0,0,${config.overlayOpacity})), url(${config.bgImage}) center/cover no-repeat`
          : config.bgColor,
        color: config.textColor,
        fontFamily: config.font,
      }}
    >
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl shadow-2xl"
        style={{
          background: config.cardBgColor,
          border: `1px solid ${config.borderColor}`,
        }}
      >
        <div className="p-8 space-y-5">
          {config.showLogo && logoConfig.enabled && (
            <div className="text-center">
              {logoConfig.image ? (
                <img src={logoConfig.image} alt="Logo" className="h-14 mx-auto object-contain" />
              ) : (
                <div
                  className="font-bold leading-none"
                  style={{ color: logoConfig.color, fontSize: logoConfig.fontSize }}
                >
                  {logoConfig.text}
                </div>
              )}
            </div>
          )}

          <div className="text-center space-y-1">
            <h2
              className="font-bold"
              style={{
                fontFamily: config.headingFont,
                fontSize: config.headingFontSize,
                fontWeight: config.headingWeight,
                color: config.textColor,
              }}
            >
              {config.title}
            </h2>
            <p className="text-sm opacity-70" style={{ color: config.textColor }}>
              {config.subtitle}
            </p>
          </div>

          <p className="text-sm text-center opacity-80" style={{ color: config.textColor }}>
            {config.welcomeMessage}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={config.inputPlaceholder}
              disabled={submitting}
              required
              autoFocus
              className="text-center"
              style={{
                background: config.inputBgColor,
                color: config.textColor,
                border: `1px solid ${config.borderColor}`,
              }}
            />
            <Button
              type="submit"
              loading={submitting}
              disabled={!name.trim()}
              className="w-full"
              style={{
                background: config.buttonColor,
                color: "#ffffff",
                border: `1px solid ${config.buttonColor}`,
              }}
            >
              {config.buttonText}
            </Button>
          </form>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
