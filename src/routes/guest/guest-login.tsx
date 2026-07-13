import { useState, useEffect, CSSProperties } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, Wedding } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { loginToCssVars, DEFAULT_LOGIN_CONFIG } from "../../lib/theme";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ErrorState } from "../../components/ui/index";

/**
 * GuestLogin — the guest sign-in page at `/:weddingId/login`.
 *
 * Guests enter their name; we call `signIn(name, weddingId)` which looks them
 * up in the `guests` table. On success we navigate to the home page. If the
 * name isn't found, an error is shown.
 */
export default function GuestLogin() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const navigate = useNavigate();
  const { signIn, weddingId: authWeddingId } = useGuestAuth();
  const { t } = useLang();

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    // If already authenticated for this wedding, skip straight to home
    if (authWeddingId && weddingId && authWeddingId === weddingId) {
      navigate(`/${weddingId}/home`, { replace: true });
      return;
    }

    if (!weddingId) {
      setError("No wedding specified");
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("weddings")
          .select("*")
          .eq("id", weddingId)
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        if (fetchError) throw fetchError;
        if (!data) throw new Error("Wedding not found");

        setWedding(data as Wedding);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load wedding");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [weddingId, authWeddingId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !weddingId) return;

    setFormError("");
    setSubmitting(true);

    try {
      const result = await signIn(name, weddingId);
      if (!result.success) {
        setFormError(result.error || t("nameNotFound"));
      } else {
        navigate(`/${weddingId}/home`, { replace: true });
      }
    } catch (err: any) {
      setFormError(err.message || t("nameNotFound"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--wed-login-bg, #faf8f5)" }}>
        <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
        <ErrorState message={error || "Wedding not found"} onRetry={() => navigate("/")} />
      </div>
    );
  }

  const login = wedding.login_config || DEFAULT_LOGIN_CONFIG;
  const loginVars = loginToCssVars(login) as CSSProperties;

  const hasBgImage = !!login.bgImage;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
      style={{
        ...loginVars,
        background: hasBgImage
          ? `linear-gradient(rgba(0,0,0,${login.overlayOpacity}), rgba(0,0,0,${login.overlayOpacity})), url(${login.bgImage})`
          : login.bgColor,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: hasBgImage ? "#ffffff" : login.textColor,
      }}
    >
      <div
        className="w-full max-w-md animate-fade-in"
        style={{
          background: hasBgImage ? "rgba(255,255,255,0.95)" : login.cardBgColor,
          borderRadius: "12px",
          padding: "2.5rem",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        {/* Logo */}
        {login.showLogo && (
          <div className="text-center mb-6">
            <div
              className="inline-block"
              style={{
                fontSize: `${login.logoSize}px`,
                color: login.accentColor,
                fontFamily: `"Great Vibes", cursive`,
              }}
            >
              {wedding.groom_name?.[0]}&{wedding.bride_name?.[0]}
            </div>
          </div>
        )}

        {/* Title */}
        <div className="text-center mb-8">
          <h1
            className="mb-2"
            style={{
              fontFamily: `"${login.headingFont}", serif`,
              fontSize: `${login.headingFontSize}px`,
              fontWeight: login.headingWeight,
              color: login.textColor,
            }}
          >
            {login.title || t("enterInvitation")}
          </h1>
          <p
            style={{
              fontFamily: `"${login.font}", sans-serif`,
              fontSize: `${login.bodyFontSize}px`,
              fontWeight: login.bodyWeight,
              color: login.textColor,
              opacity: 0.7,
            }}
          >
            {login.subtitle || t("pleaseEnterName")}
          </p>
        </div>

        {/* Welcome message */}
        {login.welcomeMessage && (
          <p
            className="text-center mb-6 italic"
            style={{
              fontFamily: `"${login.headingFont}", serif`,
              fontSize: "15px",
              color: login.accentColor,
            }}
          >
            {login.welcomeMessage}
          </p>
        )}

        {/* Error */}
        {formError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
            {formError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={login.inputPlaceholder || t("yourFullName")}
              required
              autoFocus
              disabled={submitting}
              className="text-center"
              style={{
                background: login.inputBgColor,
                borderColor: login.borderColor,
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "15px",
              }}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={submitting}
            disabled={!name.trim()}
            style={{
              background: login.buttonColor,
              color: "#ffffff",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "15px",
              fontWeight: "500",
              border: "none",
            }}
          >
            {login.buttonText || t("continue")}
          </Button>
        </form>
      </div>

      {/* Back to cover */}
      <button
        onClick={() => weddingId && navigate(`/${weddingId}`)}
        className="mt-6 text-xs opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: hasBgImage ? "#ffffff" : login.textColor }}
      >
        ← Back
      </button>
    </div>
  );
}
