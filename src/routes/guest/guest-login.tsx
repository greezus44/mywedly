import { useState, useEffect, type CSSProperties, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { UserEvent, LoginConfig } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { DEFAULT_THEME } from "../../lib/theme";
import { fetchPublicEvent } from "./guest-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const DEFAULT_LOGIN_CONFIG: LoginConfig = {
  bgColor: "#ffffff",
  textColor: "#1e293b",
  buttonColor: "#0f172a",
  buttonText: "Sign In",
  heading: "Welcome",
  subheading: "Please enter your name to continue",
  inputPlaceholder: "Your full name",
};

export default function GuestLogin() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { signIn, isAuthenticated, eventId: authEventId } = useGuestAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && authEventId === eventId) {
      navigate(`/${eventId}/home`, { replace: true });
    }
  }, [isAuthenticated, authEventId, eventId, navigate]);

  const { data: event, isLoading, error } = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    queryFn: () => fetchPublicEvent(eventId!),
    enabled: !!eventId,
  });

  if (!eventId) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <p className="text-2xl font-semibold text-slate-900 mb-2">Event Not Found</p>
          <p className="text-sm text-slate-500">The event you are looking for may no longer be available.</p>
        </div>
      </div>
    );
  }

  const config = { ...DEFAULT_LOGIN_CONFIG, ...(event.login_config || {}) };
  const theme = event.theme || DEFAULT_THEME;
  const bgColor = config.bgColor || theme.bgSubtleColor || DEFAULT_LOGIN_CONFIG.bgColor!;
  const textColor = config.textColor || theme.textColor || DEFAULT_LOGIN_CONFIG.textColor!;
  const buttonColor = config.buttonColor || theme.primaryColor || DEFAULT_LOGIN_CONFIG.buttonColor!;
  const buttonText = config.buttonText || DEFAULT_LOGIN_CONFIG.buttonText!;
  const heading = config.heading || DEFAULT_LOGIN_CONFIG.heading!;
  const subheading = config.subheading || DEFAULT_LOGIN_CONFIG.subheading!;
  const inputPlaceholder = config.inputPlaceholder || DEFAULT_LOGIN_CONFIG.inputPlaceholder!;
  const headingFont = theme.headingFont || "Inter";
  const scriptFont = theme.scriptFont || "Inter";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      signIn(name.trim(), eventId);
      navigate(`/${eventId}/home`, { replace: true });
    } catch {
      setSubmitting(false);
    }
  };

  const cardStyle: CSSProperties = {
    backgroundColor: bgColor,
    color: textColor,
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {event.logo_config?.enabled && event.logo_config.image && (
            <img
              src={event.logo_config.image}
              alt={event.name}
              className="h-16 w-auto mx-auto mb-4 object-contain"
            />
          )}
          <p
            className="text-xs tracking-[0.3em] uppercase mb-2"
            style={{ color: "var(--color-accent, #0ea5e9)" }}
          >
            {event.event_type}
          </p>
          <h1
            className="text-2xl"
            style={{ color: "var(--color-primary, #0f172a)", fontFamily: `"${headingFont}", sans-serif` }}
          >
            {event.name}
          </h1>
        </div>

        <div
          className="rounded-xl border shadow-sm p-8"
          style={{
            ...cardStyle,
            borderColor: "var(--color-border, #e2e8f0)",
          }}
        >
          <h2
            className="text-3xl text-center mb-2"
            style={{ color: textColor, fontFamily: `"${headingFont}", sans-serif` }}
          >
            {heading}
          </h2>
          <p
            className="text-sm text-center mb-6 italic"
            style={{ color: textColor, opacity: 0.7, fontFamily: `"${scriptFont}", serif` }}
          >
            {subheading}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={inputPlaceholder}
              required
              autoFocus
              disabled={submitting}
              style={{ color: textColor }}
            />

            <Button
              type="submit"
              size="lg"
              loading={submitting}
              disabled={!name.trim()}
              className="w-full"
              style={{
                backgroundColor: buttonColor,
                color: "#ffffff",
                borderRadius: "var(--radius, 8px)",
              }}
            >
              {buttonText}
            </Button>
          </form>
        </div>

        <p className="text-center text-[10px] tracking-[0.2em] uppercase text-slate-400 mt-6">
          {event.name}
        </p>
      </div>
    </div>
  );
}
