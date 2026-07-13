import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type Wedding, type LoginConfig } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth } from "../../lib/guest-auth";
import { loginToCssVars, getLoginConfig, getLogoStyle } from "../../lib/theme";
import { getDeviceType } from "../../lib/utils";

export function GuestLogin() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn } = useGuestAuth();
  const { lang, setLang } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    supabase.from("weddings").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      if (data) {
        const w = data as Wedding;
        setWedding(w);
        // Set default language from login config
        const loginConfig = getLoginConfig(w);
        if (loginConfig.language.enabled) {
          setLang(loginConfig.language.default_lang);
        }
      }
      setLoading(false);
    });
  }, [slug, setLang]);

  const loginConfig: LoginConfig = getLoginConfig(wedding);
  const bg = loginConfig.background;
  const device = getDeviceType();

  // Background style
  const bgStyle: React.CSSProperties = {};
  if (bg.type === "image" && bg.image_url) {
    bgStyle.backgroundImage = `url(${bg.image_url})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else if (bg.type === "color") {
    bgStyle.background = bg.color;
  }

  const vPosClass = loginConfig.layout.vertical_position === "top" ? "justify-start" : loginConfig.layout.vertical_position === "bottom" ? "justify-end" : "justify-center";
  const alignClass = loginConfig.layout.content_alignment === "left" ? "items-start text-left" : loginConfig.layout.content_alignment === "right" ? "items-end text-right" : "items-center text-center";

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: bg.color }}>
        <div className="animate-pulse text-white/40 text-sm tracking-widest uppercase">Loading...</div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: bg.color }}>
        <div className="text-center text-white/60">
          <p className="font-heading text-2xl mb-2">Invitation Not Found</p>
          <p className="text-sm">Please check your invitation link.</p>
        </div>
      </div>
    );
  }

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
        className={`relative z-10 flex flex-col p-6 md:p-8 ${vPosClass} ${alignClass} animate-fade-in`}
        style={{ maxWidth: loginConfig.layout.max_width, margin: loginConfig.layout.margin, width: "100%", gap: loginConfig.layout.spacing, padding: loginConfig.layout.padding }}
      >
        {/* Logo */}
        {loginConfig.branding.logo.visible && loginConfig.branding.logo.url && (
          <div className="flex justify-center mb-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <img
              src={loginConfig.branding.logo.url}
              alt="logo"
              style={getLogoStyle(loginConfig.branding.logo, device)}
            />
          </div>
        )}

        {/* Title */}
        <h1
          className="font-heading animate-fade-in-up"
          style={{
            color: "var(--login-text)",
            fontSize: "var(--login-heading-size)",
            fontWeight: loginConfig.typography.heading_weight,
            letterSpacing: loginConfig.typography.letter_spacing,
            fontFamily: "var(--login-heading-font)",
            animationDelay: "0.15s",
          }}
        >
          {loginConfig.text.title}
        </h1>

        {/* Subtitle */}
        {loginConfig.text.subtitle && (
          <p
            className="font-body animate-fade-in-up"
            style={{
              color: "var(--login-text)",
              fontSize: "var(--login-body-size)",
              opacity: 0.85,
              fontFamily: "var(--login-body-font)",
              animationDelay: "0.2s",
            }}
          >
            {loginConfig.text.subtitle}
          </p>
        )}

        {/* Welcome Message */}
        {loginConfig.text.welcome_message && (
          <p
            className="font-body animate-fade-in-up"
            style={{
              color: "var(--login-text)",
              fontSize: "var(--login-body-size)",
              opacity: 0.7,
              fontFamily: "var(--login-body-font)",
              animationDelay: "0.25s",
            }}
          >
            {loginConfig.text.welcome_message}
          </p>
        )}

        {/* Language Selector - Segmented Control */}
        {loginConfig.language.enabled && (
          <div
            className="inline-flex animate-fade-in-up self-center"
            style={{
              borderRadius: loginConfig.language_selector.button_radius,
              border: `1px solid ${loginConfig.language_selector.border_color}`,
              overflow: "hidden",
              background: "transparent",
              animationDelay: "0.3s",
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
                  fontFamily: "var(--login-body-font)",
                }}
              >
                {loginConfig.language.labels[l]}
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
          {/* Username Label */}
          {loginConfig.form.username_field.show_label && (
            <label
              className="block font-body text-sm mb-2"
              style={{
                color: "var(--login-text)",
                opacity: 0.8,
                fontFamily: "var(--login-body-font)",
              }}
            >
              {loginConfig.form.username_field.label_text}
            </label>
          )}

          {/* Username Input */}
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={loginConfig.text.username_placeholder}
            disabled={submitting}
            className="w-full transition-all focus:outline-none"
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
              fontFamily: "var(--login-body-font)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = loginConfig.form.input.focus_border_color;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = loginConfig.form.input.border_color;
            }}
          />

          {/* Error message */}
          {error && (
            <p
              className="mt-3 text-sm font-body"
              style={{
                color: "#f87171",
                fontFamily: "var(--login-body-font)",
              }}
            >
              {error}
            </p>
          )}

          {/* Sign-in Button */}
          <button
            type="submit"
            disabled={submitting || !username.trim()}
            className="mt-4 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
              cursor: "pointer",
              fontFamily: "var(--login-body-font)",
            }}
          >
            {submitting ? loginConfig.form.button.loading_text : loginConfig.text.button_text}
          </button>
        </form>

        {/* Helper text */}
        {loginConfig.text.helper_text && (
          <p
            className="font-body text-sm animate-fade-in-up"
            style={{
              color: "var(--login-text)",
              opacity: 0.6,
              fontFamily: "var(--login-body-font)",
              animationDelay: "0.4s",
            }}
          >
            {loginConfig.text.helper_text}
          </p>
        )}

        {/* Footer message */}
        {loginConfig.text.footer_message && (
          <p
            className="font-body text-sm mt-4 animate-fade-in-up"
            style={{
              color: "var(--login-text)",
              opacity: 0.5,
              fontFamily: "var(--login-body-font)",
              animationDelay: "0.45s",
            }}
          >
            {loginConfig.text.footer_message}
          </p>
        )}
      </div>
    </div>
  );
}

export default GuestLogin;
