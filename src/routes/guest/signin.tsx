import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { resolveTypography } from "../../lib/typography";
import { buttonColorsToStyle, buttonColorsToHoverStyle } from "../../components/ui/ButtonColourEditor";
import { LanguageToggle } from "../../components/site/LanguageToggle";
import { useLanguage } from "../../lib/language";
import { pickText, autoTranslate } from "../../lib/translations";

interface LoginConfig { heading?: unknown; subheading?: unknown; placeholder?: string; buttonLabel?: string; }

export default function GuestSignIn() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guest, eventId, signIn } = useGuestAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["published-event", slug],
    queryFn: async () => { const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug).eq("is_published", true).maybeSingle(); if (error) throw error; return data as UserEvent | null; },
    enabled: !!slug,
  });

  useEffect(() => { if (event && guest && eventId === event.id) navigate(`/e/${slug}/home`, { replace: true }); }, [event, guest, eventId, slug, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !username.trim()) return;
    setError(null); setSubmitting(true);
    const result = await signIn(event.id, username.trim());
    setSubmitting(false);
    if (result.error) setError(result.error);
    else navigate(`/e/${slug}/home`, { replace: true });
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-dash-bg"><div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
  if (!event) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center"><h1 className="text-2xl font-bold text-dash-text">Invitation Not Found</h1><Link to="/" className="text-dash-primary hover:underline">Return home</Link></div>;

  const { language } = useLanguage();
  const loginConfig = (event.login_config ?? {}) as LoginConfig;
  const headingRaw = resolveTypography(loginConfig.heading, (event.name ?? undefined) || "Welcome");
  const subheadingRaw = resolveTypography(loginConfig.subheading, "");
  const headingBm = ((loginConfig as { headingBm?: string }).headingBm) || "";
  const subheadingBm = ((loginConfig as { subheadingBm?: string }).subheadingBm) || "";
  const placeholderRaw = loginConfig.placeholder || "Enter your username";
  const placeholderBm = ((loginConfig as { placeholderBm?: string }).placeholderBm) || "";
  const buttonLabelRaw = loginConfig.buttonLabel || "Sign In";
  const buttonLabelBm = ((loginConfig as { buttonLabelBm?: string }).buttonLabelBm) || "";
  const heading = { text: language === "bm" ? pickText(headingRaw.text, headingBm, autoTranslate(headingRaw.text)) : headingRaw.text, style: headingRaw.style };
  const subheading = { text: language === "bm" ? pickText(subheadingRaw.text, subheadingBm, autoTranslate(subheadingRaw.text)) : subheadingRaw.text, style: subheadingRaw.style };
  const placeholder = language === "bm" ? pickText(placeholderRaw, placeholderBm, autoTranslate(placeholderRaw)) : placeholderRaw;
  const buttonLabel = language === "bm" ? pickText(buttonLabelRaw, buttonLabelBm, autoTranslate(buttonLabelRaw)) : buttonLabelRaw;
  const buttonColors = (loginConfig as { buttonColors?: import("../../components/ui/ButtonColourEditor").ButtonColors }).buttonColors;

  return (
    <EventThemeProvider theme={event.theme}>
      <LanguageToggle />
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="guest-title mb-2" style={heading.style}>{heading.text}</h1>
            {subheading.text && <p className="guest-subtitle" style={subheading.style}>{subheading.text}</p>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="event-input" placeholder={placeholder} required autoFocus style={{ textAlign: "center" }} />
            {error && <p className="text-center text-sm" style={{ color: "var(--event-primary)" }}>{error}</p>}
            <button type="submit" disabled={submitting} className="event-btn-primary w-full" style={{ opacity: submitting ? 0.6 : 1, ...buttonColorsToStyle(buttonColors) }} onMouseEnter={(e) => { if (!submitting) Object.assign(e.currentTarget.style, buttonColorsToHoverStyle(buttonColors)); }} onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonColorsToStyle(buttonColors))}>{submitting ? (language === "bm" ? "Sedang log masuk..." : "Signing in...") : buttonLabel}</button>
          </form>
        </div>
      </div>
    </EventThemeProvider>
  );
}
