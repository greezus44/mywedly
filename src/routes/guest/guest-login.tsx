import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import {
  loginToCssVars,
  getLoginConfig,
  getLogoStyle,
  getLogoPositionClasses,
  DEFAULT_LOGIN_CONFIG,
} from "../../lib/theme";
import { getDeviceType } from "../../lib/utils";
import { Heart, ArrowRight } from "lucide-react";

function GuestLoginInner() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn } = useGuestAuth();
  const { lang, setLang } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("weddings")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setWedding(data as Wedding);
        setLoading(false);
      });
  }, [slug]);

  // Set default language from login config
  useEffect(() => {
    if (!wedding) return;
    const config = getLoginConfig(wedding);
    if (config.language.enabled) {
      setLang(config.language.default_lang);
    }
  }, [wedding, setLang]);

  const loginConfig = getLoginConfig(wedding);
  const device = getDeviceType();
  const logo = loginConfig.branding?.logo;
  const logoPos = getLogoPositionClasses(logo?.position || "top-center");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !slug) return;
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(username, slug);
    if (error) {
      setError(error);
      setSubmitting(false);
    } else {
      navigate(`/w/${slug}/home`, { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Heart className="h-8 w-8 animate-pulse text-white" />
      </div>
    );
  }

  // Background rendering
  const renderBackground = () => {
    const bg = loginConfig.background;
    const overlayStyle: React.CSSProperties = {
      background: loginConfig.overlay.color,
      opacity: loginConfig.overlay.opacity,
    };

    let bgElement: React.ReactNode = null;
    if (bg.type === "image" && bg.image_url) {
      bgElement = (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${bg.image_url})`,
            filter: `blur(${loginConfig.blur}) brightness(${loginConfig.brightness})`,
          }}
        />
      );
    } else if (bg.type === "video" && bg.video_url) {
      bgElement = (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          style={{ filter: `blur(${loginConfig.blur}) brightness(${loginConfig.brightness})` }}
        >
          <source src={bg.video_url} />
        </video>
      );
    } else {
      bgElement = <div className="absolute inset-0" style={{ background: bg.color }} />;
    }

    return (
      <>
        {bgElement}
        {loginConfig.overlay.enabled && (
          <div className="absolute inset-0" style={overlayStyle} />
        )}
      </>
    );
  };

  const inputStyles = loginConfig.form.input;
  const buttonStyles = loginConfig.form.button;
  const langSelector = loginConfig.language_selector;
  const text = loginConfig.text;

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ ...loginToCssVars(loginConfig) } as React.CSSProperties}
    >
      {renderBackground()}

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div
          className="w-full animate-fade-in-up"
          style={{
            maxWidth: loginConfig.layout.max_width,
            padding: loginConfig.layout.padding,
          }}
        >
          {/* Card */}
          <div
            className="mx-auto rounded-2xl backdrop-blur-xl"
            style={{
              background: "color-mix(in srgb, var(--login-text) 6%, transparent)",
              border: "1px solid var(--login-border)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              padding: "2.5rem 2rem",
            }}
          >
            {/* Logo */}
            {logo?.url && logo.visible && (
              <div className={`mb-6 flex ${logoPos.container}`}>
                <img
                  src={logo.url}
                  alt="Logo"
                  style={getLogoStyle(logo, device)}
                />
              </div>
            )}

            {/* Title */}
            <h1
              className="mb-1 text-center"
              style={{
                color: "var(--login-text)",
                fontFamily: "var(--login-heading-font)",
                fontSize: "var(--login-heading-size)",
                fontWeight: loginConfig.typography.heading_weight,
                letterSpacing: loginConfig.typography.letter_spacing,
              }}
            >
              {text.title}
            </h1>

            {/* Subtitle */}
            <p
              className="mb-1 text-center"
              style={{
                color: "var(--login-text)",
                opacity: 0.7,
                fontFamily: "var(--login-body-font)",
                fontSize: "var(--login-body-size)",
              }}
            >
              {text.subtitle}
            </p>

            {/* Welcome message */}
            <p
              className="mb-6 text-center"
              style={{
                color: "var(--login-text)",
                opacity: 0.6,
                fontFamily: "var(--login-body-font)",
                fontSize: "calc(var(--login-body-size) * 0.875)",
              }}
            >
              {text.welcome_message}
            </p>

            {/* Language selector — segmented control */}
            {loginConfig.language.enabled && (
              <div className="mb-6 flex justify-center">
                <div
                  className="inline-flex"
                  style={{
                    borderRadius: langSelector.button_radius,
                    border: `1px solid ${langSelector.border_color}`,
                    padding: "4px",
                    background: "color-mix(in srgb, var(--login-text) 4%, transparent)",
                  }}
                >
                  {loginConfig.language.order.map((langCode) => {
                    const isActive = lang === langCode;
                    const label = loginConfig.language.labels[langCode];
                    return (
                      <button
                        key={langCode}
                        type="button"
                        onClick={() => setLang(langCode)}
                        className="transition-all duration-200 hover:opacity-90"
                        style={{
                          background: isActive
                            ? langSelector.active_bg
                            : langSelector.inactive_bg,
                          color: isActive
                            ? langSelector.active_text
                            : langSelector.inactive_text,
                          borderRadius: langSelector.button_radius,
                          paddingLeft: langSelector.button_padding_x,
                          paddingRight: langSelector.button_padding_x,
                          paddingTop: langSelector.button_padding_y,
                          paddingBottom: langSelector.button_padding_y,
                          fontSize: langSelector.font_size,
                          fontWeight: langSelector.font_weight,
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username label (optional) */}
              {loginConfig.form.username_field.show_label && (
                <label
                  className="block text-sm font-medium"
                  style={{
                    color: "var(--login-text)",
                    fontFamily: "var(--login-body-font)",
                  }}
                >
                  {loginConfig.form.username_field.label_text}
                </label>
              )}

              {/* Username input */}
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={text.username_placeholder}
                autoFocus
                className="w-full outline-none transition-all duration-200 focus:ring-2"
                style={{
                  height: inputStyles.height,
                  borderRadius: inputStyles.border_radius,
                  border: `1px solid ${inputStyles.border_color}`,
                  background: inputStyles.background,
                  color: inputStyles.text_color,
                  fontSize: inputStyles.font_size,
                  padding: inputStyles.padding,
                  boxShadow: inputStyles.shadow,
                  // @ts-expect-error CSS custom property
                  "--tw-ring-color": inputStyles.focus_border_color,
                }}
              />

              {/* Error */}
              {error && (
                <p
                  className="text-sm text-center animate-fade-in"
                  style={{ color: "#ff6b6b" }}
                >
                  {error}
                </p>
              )}

              {/* Sign-in button */}
              <button
                type="submit"
                disabled={submitting || !username.trim()}
                className="group flex w-full items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  height: buttonStyles.height,
                  borderRadius: buttonStyles.border_radius,
                  background: buttonStyles.bg_color,
                  color: buttonStyles.text_color,
                  fontSize: buttonStyles.font_size,
                  fontWeight: buttonStyles.font_weight,
                  boxShadow: buttonStyles.shadow,
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? buttonStyles.loading_text : text.button_text}
                {!submitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </button>
            </form>

            {/* Helper text */}
            {text.helper_text && (
              <p
                className="mt-4 text-center text-sm"
                style={{
                  color: "var(--login-text)",
                  opacity: 0.5,
                  fontFamily: "var(--login-body-font)",
                }}
              >
                {text.helper_text}
              </p>
            )}

            {/* Footer message */}
            {text.footer_message && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="h-px w-8" style={{ background: "var(--login-border)" }} />
                <p
                  className="text-center text-xs italic"
                  style={{
                    color: "var(--login-text)",
                    opacity: 0.6,
                    fontFamily: "var(--login-body-font)",
                  }}
                >
                  {text.footer_message}
                </p>
                <span className="h-px w-8" style={{ background: "var(--login-border)" }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GuestLogin() {
  return (
    <GuestAuthProvider>
      <GuestLoginInner />
    </GuestAuthProvider>
  );
}

export default GuestLogin;
