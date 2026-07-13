import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { DEFAULT_THEME, themeToCssVars } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function GuestLogin() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { signIn, isAuthenticated, eventId: authEventId } = useGuestAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: event, isLoading } = useQuery<UserEvent>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId!)
        .single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (isAuthenticated && authEventId === eventId) {
      navigate(`/${eventId}/home`, { replace: true });
    }
  }, [isAuthenticated, authEventId, eventId, navigate]);

  const theme = event?.theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;
  const logoConfig = event?.logo_config;
  const loginConfig = event?.login_config || {};

  const bgColor = loginConfig.bgColor || "#ffffff";
  const textColor = loginConfig.textColor || theme.textColor || "#1e293b";
  const buttonColor = loginConfig.buttonColor || theme.primaryColor || "#0ea5e9";
  const buttonText = loginConfig.buttonText || "Continue";
  const heading = loginConfig.heading || "Welcome";
  const subheading = loginConfig.subheading || "Please enter your name to continue";
  const inputPlaceholder = loginConfig.inputPlaceholder || "Your full name";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !eventId) return;
    setSubmitting(true);
    setError(null);
    try {
      signIn(name.trim(), eventId);
      navigate(`/${eventId}/home`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ ...cssVars, backgroundColor: bgColor }} className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: textColor }} />
      </div>
    );
  }

  return (
    <div
      style={{ ...cssVars, backgroundColor: bgColor, color: textColor, fontFamily: "var(--font-body)" }}
      className="min-h-screen flex items-center justify-center px-4"
    >
      <div className="w-full max-w-sm">
        {logoConfig?.enabled && (
          <div className="text-center mb-8">
            {logoConfig.image ? (
              <img src={logoConfig.image} alt={logoConfig.text || event?.name || "Logo"} className="mx-auto max-h-20 object-contain mb-2" />
            ) : (
              logoConfig.text && (
                <h1 className="text-2xl font-semibold" style={{ color: logoConfig.color || textColor, fontSize: logoConfig.fontSize }}>
                  {logoConfig.text}
                </h1>
              )
            )}
          </div>
        )}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-medium mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            {heading}
          </h2>
          <p className="text-sm opacity-70">{subheading}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={inputPlaceholder}
            autoFocus
            required
            disabled={submitting}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            loading={submitting}
            disabled={submitting || !name.trim()}
            className="w-full"
            style={{ backgroundColor: buttonColor, color: "#ffffff" }}
          >
            {buttonText}
          </Button>
        </form>
      </div>
    </div>
  );
}
