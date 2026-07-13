import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase, UserEvent, LoginConfig } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { DEFAULT_LOGIN_CONFIG } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { CSSProperties, FormEvent } from "react";

function normalizeEvent(data: any): UserEvent {
  return {
    ...data,
    cover_config: data.cover_config || {},
    login_config: data.login_config || {},
    theme: data.theme || {},
    logo_config: data.logo_config || {},
    content: data.content || {},
    sharing_config: data.sharing_config || {},
    draft_cover_config: data.draft_cover_config || data.cover_config || {},
    draft_login_config: data.draft_login_config || data.login_config || {},
    draft_theme: data.draft_theme || data.theme || {},
    draft_logo_config: data.draft_logo_config || data.logo_config || {},
    draft_content: data.draft_content || data.content || {},
    draft_sharing_config: data.draft_sharing_config || data.sharing_config || {},
  };
}

export default function GuestLogin() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { signIn, token, eventId: authEventId, guestName } = useGuestAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: event, isLoading } = useQuery<UserEvent | null>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeEvent(data) : null;
    },
    enabled: !!eventId,
    staleTime: 30000,
  });

  useEffect(() => {
    if (token && authEventId === eventId && guestName) {
      navigate(`/${eventId}/home`, { replace: true });
    }
  }, [token, authEventId, eventId, guestName, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !eventId) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn(name.trim(), eventId);
      navigate(`/${eventId}/home`, { replace: true });
    } catch (err: any) {
      setError(err.message || "Could not sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 px-6">
        <p className="text-sm text-gray-500">This event could not be found.</p>
        <button onClick={() => navigate("/")} className="text-sm text-gray-700 underline">
          Go home
        </button>
      </div>
    );
  }

  const config: LoginConfig = {
    ...DEFAULT_LOGIN_CONFIG,
    ...event.login_config,
  };

  const bgStyle: CSSProperties = config.bgImage
    ? { backgroundImage: `url(${config.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: config.bgColor };

  const overlayStyle = config.bgImage && config.overlayOpacity
    ? { backgroundColor: "rgba(0,0,0,0.4)", opacity: config.overlayOpacity }
    : {};

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-12" style={{ ...bgStyle, color: config.textColor }}>
      {config.bgImage && <div className="absolute inset-0 pointer-events-none" style={overlayStyle} />}

      <div className="relative z-10 w-full max-w-sm">
        <div
          className="rounded-2xl border p-8 sm:p-10 shadow-xl"
          style={{
            backgroundColor: config.cardBgColor,
            borderColor: config.borderColor,
            color: config.textColor,
          }}
        >
          {config.showLogo && event.logo_config?.enabled && (
            <div className="flex justify-center mb-6">
              {event.logo_config.image ? (
                <img
                  src={event.logo_config.image}
                  alt={event.logo_config.text || event.name}
                  className="max-h-16 object-contain"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold"
                  style={{
                    backgroundColor: config.buttonColor,
                    color: config.cardBgColor,
                    fontSize: `${event.logo_config.fontSize || 32}px`,
                  }}
                >
                  {event.logo_config.text || event.name.charAt(0)}
                </div>
              )}
            </div>
          )}

          <h1
            className="text-center mb-2 font-bold"
            style={{
              fontFamily: config.headingFont,
              fontSize: `${config.headingFontSize}px`,
              fontWeight: config.headingWeight,
              color: config.textColor,
            }}
          >
            {config.title}
          </h1>

          {config.subtitle && (
            <p className="text-center text-sm mb-1 opacity-70" style={{ fontFamily: config.font }}>
              {config.subtitle}
            </p>
          )}

          {config.welcomeMessage && (
            <p className="text-center text-sm mb-8 opacity-60 italic" style={{ fontFamily: config.font }}>
              {config.welcomeMessage}
            </p>
          )}

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={config.inputPlaceholder}
              required
              autoFocus
              className="text-center"
              style={{
                backgroundColor: config.inputBgColor,
                borderColor: config.borderColor,
                color: config.textColor,
              }}
            />
            <Button
              type="submit"
              size="lg"
              loading={submitting}
              className="w-full"
              style={{
                backgroundColor: config.buttonColor,
                color: config.cardBgColor,
                borderRadius: "10px",
              }}
            >
              {config.buttonText}
            </Button>
          </form>

          <p className="text-center text-xs mt-6 opacity-50" style={{ fontFamily: config.font }}>
            {event.name}
          </p>
        </div>
      </div>
    </div>
  );
}
