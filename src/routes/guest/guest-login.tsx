import { useState, useEffect, type FormEvent, type CSSProperties } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase, UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import {
  DEFAULT_LOGIN_CONFIG,
  DEFAULT_LOGO_CONFIG,
  shouldShowLogo,
  getLogoStyle,
} from "../../lib/theme";
import { ErrorState, Skeleton } from "../../components/ui/index";

export default function GuestLogin() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { signIn, token, guestName } = useGuestAuth();
  const isAuthenticated = !!token;

  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: event, isLoading, error: queryError, refetch } = useQuery<
    UserEvent | null
  >({
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

  useEffect(() => {
    if (isAuthenticated && eventId) {
      navigate(`/${eventId}/home`, { replace: true });
    }
  }, [isAuthenticated, eventId, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !eventId) return;
    setSubmitting(true);
    setError(null);
    const result = await signIn(name, eventId);
    if (result.success) {
      navigate(`/${eventId}/home`, { replace: true });
    } else {
      setError(result.error || "Unable to sign in. Please check your name.");
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 space-y-6">
        <Skeleton className="h-96 w-full max-w-md mx-auto" />
      </div>
    );
  }

  if (queryError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <ErrorState
          message={
            queryError ? queryError.message : "Event not found or not published."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const loginConfig = event.login_config || DEFAULT_LOGIN_CONFIG;
  const logo = event.logo_config || DEFAULT_LOGO_CONFIG;

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center p-6"
      style={{
        backgroundColor: loginConfig.bgColor,
        color: loginConfig.textColor,
        fontFamily: `"${loginConfig.font}", sans-serif`,
      }}
    >
      {loginConfig.bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${loginConfig.bgImage})` }}
        />
      )}
      {loginConfig.bgImage && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "#000", opacity: loginConfig.overlayOpacity }}
        />
      )}

      <div
        className="relative z-10 w-full max-w-sm p-8 md:p-10 rounded-2xl shadow-2xl"
        style={{
          backgroundColor: loginConfig.cardBgColor,
          border: `1px solid ${loginConfig.borderColor}`,
        }}
      >
        {loginConfig.showLogo && shouldShowLogo(logo) && (
          <div className="text-center mb-6">
            {logo.image ? (
              <img
                src={logo.image}
                alt={event.name}
                className="mx-auto max-h-16 object-contain"
              />
            ) : (
              <div
                style={{
                  ...getLogoStyle(logo),
                  fontSize: `${loginConfig.logoSize * 1.5}px`,
                  color: loginConfig.accentColor,
                }}
              >
                {logo.text}
              </div>
            )}
          </div>
        )}

        <h2
          className="text-center mb-2"
          style={{
            fontFamily: `"${loginConfig.headingFont}", serif`,
            fontSize: `${loginConfig.headingFontSize}px`,
            fontWeight: loginConfig.headingWeight as CSSProperties["fontWeight"],
            color: loginConfig.textColor,
          }}
        >
          {loginConfig.title}
        </h2>

        <p
          className="text-center mb-1 opacity-70"
          style={{ fontSize: `${loginConfig.bodyFontSize}px` }}
        >
          {loginConfig.subtitle}
        </p>

        {loginConfig.welcomeMessage && (
          <p
            className="text-center mb-6 opacity-60 italic"
            style={{
              fontSize: `${loginConfig.bodyFontSize}px`,
              fontFamily: `"${loginConfig.headingFont}", serif`,
            }}
          >
            {loginConfig.welcomeMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={loginConfig.inputPlaceholder}
            autoFocus
            disabled={submitting}
            className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{
              borderColor: loginConfig.borderColor,
              backgroundColor: loginConfig.inputBgColor,
              color: loginConfig.textColor,
              fontSize: `${loginConfig.bodyFontSize + 2}px`,
            }}
          />

          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
              style={{
                backgroundColor: `color-mix(in srgb, #dc2626 10%, transparent)`,
                color: "#dc2626",
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: loginConfig.buttonColor,
              color: "#ffffff",
              fontSize: `${loginConfig.bodyFontSize + 1}px`,
            }}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {loginConfig.buttonText}
          </button>
        </form>

        {guestName && (
          <p className="text-center mt-4 text-xs opacity-50">
            Signed in as {guestName}
          </p>
        )}
      </div>

      <button
        onClick={() => navigate(`/${eventId}`)}
        className="relative z-10 mt-6 text-xs opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: loginConfig.textColor }}
      >
        ← Back to cover
      </button>
    </div>
  );
}
