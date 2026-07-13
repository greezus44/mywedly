import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth } from "../../lib/guest-auth";
import {
  loginToCssVars,
  getLoginConfig,
  getLogoStyle,
} from "../../lib/theme";
import { getDeviceType } from "../../lib/utils";

export function GuestLogin() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  const { signIn } = useGuestAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase.from("weddings").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      if (data) {
        setWedding(data as Wedding);
        const loginConfig = (data as Wedding).draft_login_config || (data as Wedding).login_config;
        if (loginConfig?.language?.default_lang) {
          setLang(loginConfig.language.default_lang);
        }
      }
    });
  }, [slug, setLang]);

  const loginConfig = getLoginConfig(wedding);
  const device = getDeviceType();
  const bg = loginConfig.background;

  const bgStyle: React.CSSProperties = {};
  if (bg.type === "image" && bg.image_url) {
    bgStyle.backgroundImage = `url(${bg.image_url})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else if (bg.type === "color") {
    bgStyle.background = bg.color;
  }

  const alignClass = loginConfig.layout.content_alignment === "left" ? "items-start text-left" : loginConfig.layout.content_alignment === "right" ? "items-end text-right" : "items-center text-center";
  const vPosClass = loginConfig.layout.vertical_position === "top" ? "justify-start" : loginConfig.layout.vertical_position === "bottom" ? "justify-end" : "justify-center";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !slug) return;
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(username, slug);
    if (signInError) {
      setError(signInError);
      setSubmitting(false);
    } else {
      navigate(`/w/${slug}/home`, { replace: true });
    }
  };

  const logo = loginConfig.branding.logo;

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{ ...loginToCssVars(loginConfig), ...bgStyle, filter: `brightness(${loginConfig.brightness}) blur(${loginConfig.blur})` } as React.CSSProperties}
    >
      {/* Video background */}
      {bg.type === "video" && bg.video_url && (
        <video
          src={bg.video_url}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Overlay */}
      {loginConfig.overlay.enabled && (
        <div
          className="absolute inset-0"
          style={{ background: loginConfig.overlay.color, opacity: loginConfig.overlay.opacity }}
        />
      )}

      {/* Content */}
      <div
        className={`relative z-10 flex min-h-screen flex-col p-6 ${vPosClass} ${alignClass}`}
        style={{ maxWidth: loginConfig.layout.max_width, margin: loginConfig.layout.margin, width: "100%", gap: loginConfig.layout.spacing, padding: loginConfig.layout.padding }}
      >
        {/* Logo */}
        {logo.visible && logo.url && (
          <div className="animate-fade-in">
            <img src={logo.url} alt="logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        {/* Title */}
        <h1
          className="animate-fade-in-up font-heading"
          style={{
            color: "var(--login-text)",
            fontSize: "var(--login-heading-size)",
            fontWeight: "var(--login-heading-weight)",
            letterSpacing: "var(--login-letter-spacing)",
            animationDelay: "0.1s",
          }}
        >
          {loginConfig.text.title}
        </h1>

        {/* Subtitle */}
        {loginConfig.text.subtitle && (
          <p
            className="animate-fade-in-up font-body"
            style={{
              color: "var(--login-text)",
              fontSize: "var(--login-body-size)",
              opacity: 0.85,
              animationDelay: "0.2s",
            }}
          >
            {loginConfig.text.subtitle}
          </p>
        )}

        {/* Welcome message */}
        {loginConfig.text.welcome_message && (
          <p
            className="animate-fade-in-up font-body"
            style={{
              color: "var(--login-text)",
              fontSize: "var(--login-body-size)",
              opacity: 0.7,
              animationDelay: "0.3s",
            }}
          >
            {loginConfig.text.welcome_message}
          </p>
        )}

        {/* Language selector — segmented control */}
        {loginConfig.language.enabled && (
          <div
            className="inline-flex animate-fade-in-up"
            style={{
              borderRadius: loginConfig.language_selector.button_radius,
              border: `1px solid ${loginConfig.language_selector.border_color}`,
              overflow: "hidden",
              background: "transparent",
              animationDelay: "0.4s",
            }}
          >
            {loginConfig.language.order.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                style={{
                  padding: `${loginConfig.language_selector.button_padding_y} ${loginConfig.language_selector.button_padding_x}`,
                  fontSize: loginConfig.language_selector.font_size,
                  fontWeight: loginConfig.language_selector.font_weight,
                  borderRadius: loginConfig.language_selector.button_radius,
                  background: lang === l ? loginConfig.language_selector.active_bg : loginConfig.language_selector.inactive_bg,
                  color: lang === l ? loginConfig.language_selector.active_text : loginConfig.language_selector.inactive_text,
                  transition: "all 0.25s ease",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {loginConfig.language.labels[l]}
              </button>
            ))}
          </div>
        )}

        {/* Sign-in form */}
        <form onSubmit={handleSubmit} className="flex w-full animate-fade-in-up flex-col" style={{ gap: loginConfig.layout.spacing, animationDelay: "0.5s" }}>
          {/* Username label */}
          {loginConfig.form.username_field.show_label && (
            <label
              className="font-body text-sm"
              style={{ color: "var(--login-text)", opacity: 0.8 }}
            >
              {loginConfig.form.username_field.label_text}
            </label>
          )}

          {/* Username input */}
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={loginConfig.text.username_placeholder}
            disabled={submitting}
            style={{
              width: loginConfig.form.input.width,
              height: loginConfig.form.input.height,
              borderRadius: loginConfig.form.input.border_radius,
              border: `1px solid ${loginConfig.form.input.border_color}`,
              background: loginConfig.form.input.background,
              color: loginConfig.form.input.text_color,
              fontSize: loginConfig.form.input.font_size,
              padding: loginConfig.form.input.padding,
              boxShadow: loginConfig.form.input.shadow,
              outline: "none",
            }}
          />

          {/* Error message */}
          {error && (
            <p className="font-body text-sm" style={{ color: "#ef4444" }}>
              {error}
            </p>
          )}

          {/* Sign-in button */}
          <button
            type="submit"
            disabled={submitting || !username.trim()}
            style={{
              width: loginConfig.form.button.width,
              height: loginConfig.form.button.height,
              borderRadius: loginConfig.form.button.border_radius,
              background: "var(--login-button-bg)",
              color: "var(--login-button-text)",
              fontSize: loginConfig.form.button.font_size,
              fontWeight: loginConfig.form.button.font_weight,
              boxShadow: loginConfig.form.button.shadow,
              border: "none",
              cursor: submitting || !username.trim() ? "not-allowed" : "pointer",
              opacity: submitting || !username.trim() ? 0.6 : 1,
              transition: "background 0.25s ease",
            }}
          >
            {submitting ? loginConfig.form.button.loading_text : loginConfig.text.button_text}
          </button>
        </form>

        {/* Helper text */}
        {loginConfig.text.helper_text && (
          <p
            className="animate-fade-in-up font-body text-sm"
            style={{ color: "var(--login-text)", opacity: 0.6, animationDelay: "0.6s" }}
          >
            {loginConfig.text.helper_text}
          </p>
        )}

        {/* Footer message */}
        {loginConfig.text.footer_message && (
          <p
            className="animate-fade-in-up font-body text-sm"
            style={{ color: "var(--login-text)", opacity: 0.5, marginTop: "1rem", animationDelay: "0.7s" }}
          >
            {loginConfig.text.footer_message}
          </p>
        )}
      </div>
    </div>
  );
}

export default GuestLogin;
