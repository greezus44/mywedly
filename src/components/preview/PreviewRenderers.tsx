import type { Wedding, CoverConfig, LoginConfig, LogoConfig, ThemeConfig, WeddingContent } from "../../lib/supabase";
import { getLogoStyle, getLogoPositionClasses, loginToCssVars, coverToCssVars, themeToCssVars, shouldShowLogo, DEFAULT_COVER_CONFIG, DEFAULT_LOGIN_CONFIG, DEFAULT_THEME } from "../../lib/theme";
import type { DeviceType } from "./SplitEditor";
import { getCountdown } from "../../lib/utils";
import { useState, useEffect } from "react";

export function LogoRenderer({ logo, device, page }: { logo: LogoConfig; device: DeviceType; page: string }) {
  if (!shouldShowLogo(logo, page) || !logo.url) return null;
  const pos = getLogoPositionClasses(logo.position);
  return (
    <div className={`flex w-full ${pos.container}`} style={{ padding: logo.padding }}>
      <div className={pos.item} style={{ transform: `translate(${logo.offsetX}, ${logo.offsetY})` }}>
        <img src={logo.url} alt="logo" style={getLogoStyle(logo, device)} />
      </div>
    </div>
  );
}

export function CoverPreview({ wedding, device }: { wedding: Wedding | null; device: DeviceType }) {
  const cover = wedding?.draft_cover_config || wedding?.cover_config || DEFAULT_COVER_CONFIG;
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });
  useEffect(() => {
    if (!cover.show_countdown || !wedding?.wedding_date) return;
    const tick = () => setCountdown(getCountdown(wedding.wedding_date));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [cover.show_countdown, wedding?.wedding_date]);
  const bg = cover.background;
  const bgStyle: React.CSSProperties = {};
  if (bg.type === "image" && bg.image_url) bgStyle.backgroundImage = `url(${bg.image_url})`;
  else if (bg.type === "color") bgStyle.background = bg.color;
  return (
    <div className="relative flex flex-col overflow-hidden" style={{ ...coverToCssVars(cover), ...bgStyle, backgroundSize: "cover", backgroundPosition: "center", minHeight: "500px", filter: `brightness(${cover.brightness}) blur(${cover.blur})` } as React.CSSProperties}>
      {bg.type === "video" && bg.video_url && <video src={bg.video_url} autoPlay loop muted className="absolute inset-0 h-full w-full object-cover" />}
      {cover.overlay.enabled && <div className="absolute inset-0" style={{ background: cover.overlay.color, opacity: cover.overlay.opacity }} />}
      <div className={`relative z-10 flex flex-col p-8 ${cover.layout.vertical_position === "top" ? "justify-start" : cover.layout.vertical_position === "bottom" ? "justify-end" : "justify-center"} ${cover.layout.content_alignment === "left" ? "items-start text-left" : cover.layout.content_alignment === "right" ? "items-end text-right" : "items-center text-center"}`} style={{ maxWidth: cover.layout.max_width, margin: "0 auto", width: "100%" }}>
        <LogoRenderer logo={cover.branding.logo} device={device} page="cover" />
        <h1 className="mt-4 font-heading" style={{ color: cover.typography.heading_color, fontSize: cover.typography.heading_size, fontWeight: cover.typography.heading_weight, letterSpacing: cover.typography.letter_spacing }}>{cover.branding.couple_name_one || "Name One"}</h1>
        <p className="font-script text-3xl" style={{ color: cover.typography.body_color }}>&</p>
        <h1 className="font-heading" style={{ color: cover.typography.heading_color, fontSize: cover.typography.heading_size, fontWeight: cover.typography.heading_weight }}>{cover.branding.couple_name_two || "Name Two"}</h1>
        {cover.show_date && (cover.branding.date || wedding?.wedding_date) && <p className="mt-3 font-body" style={{ color: cover.typography.body_color, fontSize: cover.typography.body_size }}>{cover.branding.date || wedding?.wedding_date}</p>}
        {cover.show_countdown && !countdown.isPast && (
          <div className="mt-6 flex gap-4">{(["days", "hours", "minutes", "seconds"] as const).map((k) => (<div key={k} className="text-center"><div className="text-2xl font-heading" style={{ color: cover.typography.heading_color }}>{countdown[k]}</div><div className="text-xs uppercase" style={{ color: cover.typography.body_color }}>{k}</div></div>))}</div>
        )}
        <button className="mt-8 font-body" style={{ background: cover.button.bg_color, color: cover.button.text_color, borderRadius: cover.button.border_radius, padding: `${cover.button.padding_y} ${cover.button.padding_x}` }}>{cover.enter_button_text || "Enter Website"}</button>
      </div>
    </div>
  );
}

export function LoginPreview({ wedding, device }: { wedding: Wedding | null; device: DeviceType }) {
  const login = wedding?.draft_login_config || wedding?.login_config || DEFAULT_LOGIN_CONFIG;
  const [lang, setLang] = useState<"en" | "ms">(login.language.default_lang);
  const bg = login.background;
  const bgStyle: React.CSSProperties = {};
  if (bg.type === "image" && bg.image_url) bgStyle.backgroundImage = `url(${bg.image_url})`;
  else if (bg.type === "color") bgStyle.background = bg.color;
  const alignClass = login.layout.content_alignment === "left" ? "items-start text-left" : login.layout.content_alignment === "right" ? "items-end text-right" : "items-center text-center";
  const vPosClass = login.layout.vertical_position === "top" ? "justify-start" : login.layout.vertical_position === "bottom" ? "justify-end" : "justify-center";
  return (
    <div className="relative flex flex-col overflow-hidden" style={{ ...loginToCssVars(login), ...bgStyle, backgroundSize: "cover", backgroundPosition: "center", minHeight: "500px", filter: `brightness(${login.brightness}) blur(${login.blur})` } as React.CSSProperties}>
      {bg.type === "video" && bg.video_url && <video src={bg.video_url} autoPlay loop muted className="absolute inset-0 h-full w-full object-cover" />}
      {login.overlay.enabled && <div className="absolute inset-0" style={{ background: login.overlay.color, opacity: login.overlay.opacity }} />}
      <div className={`relative z-10 flex flex-col p-6 ${vPosClass} ${alignClass}`} style={{ maxWidth: login.layout.max_width, margin: login.layout.margin, width: "100%", gap: login.layout.spacing, padding: login.layout.padding }}>
        {login.branding.logo.visible && login.branding.logo.url && <img src={login.branding.logo.url} alt="logo" style={getLogoStyle(login.branding.logo, device)} />}
        <h1 className="font-heading" style={{ color: login.theme.text, fontSize: login.typography.heading_size, fontWeight: login.typography.heading_weight, letterSpacing: login.typography.letter_spacing }}>{login.text.title}</h1>
        {login.text.subtitle && <p className="font-body" style={{ color: login.theme.text, fontSize: login.typography.body_size, opacity: 0.85 }}>{login.text.subtitle}</p>}
        {login.text.welcome_message && <p className="font-body" style={{ color: login.theme.text, fontSize: login.typography.body_size, opacity: 0.7 }}>{login.text.welcome_message}</p>}
        {login.language.enabled && (
          <div className="inline-flex" style={{ borderRadius: login.language_selector.button_radius, border: `1px solid ${login.language_selector.border_color}`, overflow: "hidden", background: "transparent" }}>
            {login.language.order.map((l) => (
              <button key={l} type="button" onClick={() => setLang(l)} style={{ padding: `${login.language_selector.button_padding_y} ${login.language_selector.button_padding_x}`, fontSize: login.language_selector.font_size, fontWeight: login.language_selector.font_weight, borderRadius: login.language_selector.button_radius, background: lang === l ? login.language_selector.active_bg : login.language_selector.inactive_bg, color: lang === l ? login.language_selector.active_text : login.language_selector.inactive_text, transition: "all 0.25s ease", border: "none", cursor: "pointer" }}>{login.language.labels[l]}</button>
            ))}
          </div>
        )}
        {login.form.username_field.show_label && <label className="font-body text-sm" style={{ color: login.theme.text, opacity: 0.8 }}>{login.form.username_field.label_text}</label>}
        <input type="text" placeholder={login.text.username_placeholder} style={{ width: login.form.input.width, height: login.form.input.height, borderRadius: login.form.input.border_radius, border: `1px solid ${login.form.input.border_color}`, background: login.form.input.background, color: login.form.input.text_color, fontSize: login.form.input.font_size, padding: login.form.input.padding, boxShadow: login.form.input.shadow, outline: "none" }} />
        <button type="button" style={{ width: login.form.button.width, height: login.form.button.height, borderRadius: login.form.button.border_radius, background: login.form.button.bg_color, color: login.form.button.text_color, fontSize: login.form.button.font_size, fontWeight: login.form.button.font_weight, boxShadow: login.form.button.shadow, border: "none", cursor: "pointer", transition: "background 0.25s ease" }}>{login.text.button_text}</button>
        {login.text.helper_text && <p className="font-body text-sm" style={{ color: login.theme.text, opacity: 0.6 }}>{login.text.helper_text}</p>}
        {login.text.footer_message && <p className="font-body text-sm" style={{ color: login.theme.text, opacity: 0.5, marginTop: "1rem" }}>{login.text.footer_message}</p>}
      </div>
    </div>
  );
}

export function HomePreview({ wedding, device }: { wedding: Wedding | null; device: DeviceType }) {
  const theme = wedding?.draft_theme_config || wedding?.theme_config || wedding?.theme || DEFAULT_THEME;
  const content = (wedding?.draft_content || wedding?.content || {}) as WeddingContent;
  const cover = wedding?.draft_cover_config || wedding?.cover_config || DEFAULT_COVER_CONFIG;
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });
  useEffect(() => { if (!wedding?.wedding_date) return; const tick = () => setCountdown(getCountdown(wedding.wedding_date)); tick(); const id = setInterval(tick, 1000); return () => clearInterval(id); }, [wedding?.wedding_date]);
  return (
    <div className="p-8" style={{ ...themeToCssVars(theme), background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" } as React.CSSProperties}>
      <LogoRenderer logo={cover.branding.logo} device={device} page="home" />
      <h1 className="font-heading text-center" style={{ color: "var(--color-primary)", fontSize: "var(--font-heading-size)" }}>{content.home_title || `${wedding?.couple_name_one || "Name"} & ${wedding?.couple_name_two || "Name"}`}</h1>
      {content.home_subtitle && <p className="mt-2 text-center font-body" style={{ color: "var(--color-text-muted)" }}>{content.home_subtitle}</p>}
      {wedding?.wedding_date && <p className="mt-3 text-center font-body">{wedding.wedding_date}</p>}
      {content.home_body && <p className="mt-4 text-center font-body" style={{ maxWidth: "600px", margin: "0 auto" }}>{content.home_body}</p>}
      {content.quran_verse && <blockquote className="mt-6 text-center font-body italic" style={{ color: "var(--color-accent)", maxWidth: "500px", margin: "1.5rem auto" }}>"{content.quran_verse}"{content.quran_reference && <footer className="mt-1 text-sm">— {content.quran_reference}</footer>}</blockquote>}
      {!countdown.isPast && <div className="mt-6 flex justify-center gap-4">{(["days", "hours", "minutes", "seconds"] as const).map((k) => (<div key={k} className="text-center"><div className="text-2xl font-heading" style={{ color: "var(--color-primary)" }}>{countdown[k]}</div><div className="text-xs uppercase" style={{ color: "var(--color-text-muted)" }}>{k}</div></div>))}</div>}
      {content.home_closing_text && <p className="mt-6 text-center font-body italic" style={{ color: "var(--color-text-muted)" }}>{content.home_closing_text}</p>}
    </div>
  );
}

export function RsvpPreview({ wedding, device }: { wedding: Wedding | null; device: DeviceType }) {
  const theme = wedding?.draft_theme_config || wedding?.theme_config || wedding?.theme || DEFAULT_THEME;
  const content = (wedding?.draft_content || wedding?.content || {}) as WeddingContent;
  const cover = wedding?.draft_cover_config || wedding?.cover_config || DEFAULT_COVER_CONFIG;
  return (
    <div className="p-8" style={{ ...themeToCssVars(theme), background: "var(--color-bg)", color: "var(--color-text)" } as React.CSSProperties}>
      <LogoRenderer logo={cover.branding.logo} device={device} page="rsvp" />
      <h1 className="font-heading text-center" style={{ color: "var(--color-primary)", fontSize: "var(--font-heading-size)" }}>RSVP</h1>
      {content.rsvp_intro && <p className="mt-2 text-center font-body" style={{ color: "var(--color-text-muted)" }}>{content.rsvp_intro}</p>}
      <div className="mt-6 space-y-4">
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
          <h3 className="font-heading" style={{ color: "var(--color-primary)" }}>Wedding Reception</h3>
          <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>Saturday, 15 June 2025</p>
          <div className="mt-3 flex gap-2">
            <button className="rounded-lg px-4 py-2 font-body text-sm" style={{ background: "var(--color-button-bg)", color: "var(--color-button-text)" }}>Accept</button>
            <button className="rounded-lg border px-4 py-2 font-body text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>Decline</button>
          </div>
        </div>
      </div>
      {content.rsvp_closing && <p className="mt-6 text-center font-body italic" style={{ color: "var(--color-text-muted)" }}>{content.rsvp_closing}</p>}
    </div>
  );
}

export function DoaPreview({ wedding, device }: { wedding: Wedding | null; device: DeviceType }) {
  const theme = wedding?.draft_theme_config || wedding?.theme_config || wedding?.theme || DEFAULT_THEME;
  const content = (wedding?.draft_content || wedding?.content || {}) as WeddingContent;
  const cover = wedding?.draft_cover_config || wedding?.cover_config || DEFAULT_COVER_CONFIG;
  return (
    <div className="p-8" style={{ ...themeToCssVars(theme), background: "var(--color-bg)", color: "var(--color-text)" } as React.CSSProperties}>
      <LogoRenderer logo={cover.branding.logo} device={device} page="doa" />
      <p className="text-center font-script text-2xl" style={{ color: "var(--color-accent)" }}>Bismillah</p>
      <h1 className="mt-4 text-center font-heading" style={{ color: "var(--color-primary)", fontSize: "var(--font-heading-size)" }}>{content.doa_title || "Doa"}</h1>
      {content.doa_body && <p className="mt-4 text-center font-body" style={{ maxWidth: "500px", margin: "0 auto" }}>{content.doa_body}</p>}
      {content.doa_image_url && <img src={content.doa_image_url} alt="doa" className="mt-4 mx-auto rounded-lg" style={{ maxHeight: "200px" }} />}
    </div>
  );
}

export function SendMessagePreview({ wedding, device }: { wedding: Wedding | null; device: DeviceType }) {
  const theme = wedding?.draft_theme_config || wedding?.theme_config || wedding?.theme || DEFAULT_THEME;
  const content = (wedding?.draft_content || wedding?.content || {}) as WeddingContent;
  const cover = wedding?.draft_cover_config || wedding?.cover_config || DEFAULT_COVER_CONFIG;
  return (
    <div className="p-8" style={{ ...themeToCssVars(theme), background: "var(--color-bg)", color: "var(--color-text)" } as React.CSSProperties}>
      <LogoRenderer logo={cover.branding.logo} device={device} page="send-message" />
      <h1 className="text-center font-heading" style={{ color: "var(--color-primary)", fontSize: "var(--font-heading-size)" }}>Send Message</h1>
      {content.message_intro && <p className="mt-2 text-center font-body" style={{ color: "var(--color-text-muted)" }}>{content.message_intro}</p>}
      <textarea className="mt-4 w-full rounded-lg border p-3 font-body" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", minHeight: "100px" }} placeholder="Write your message..." />
      <button className="mt-3 w-full rounded-lg py-2 font-body" style={{ background: "var(--color-button-bg)", color: "var(--color-button-text)" }}>Send</button>
    </div>
  );
}

export function ContactPreview({ wedding, device }: { wedding: Wedding | null; device: DeviceType }) {
  const theme = wedding?.draft_theme_config || wedding?.theme_config || wedding?.theme || DEFAULT_THEME;
  const content = (wedding?.draft_content || wedding?.content || {}) as WeddingContent;
  const cover = wedding?.draft_cover_config || wedding?.cover_config || DEFAULT_COVER_CONFIG;
  return (
    <div className="p-8" style={{ ...themeToCssVars(theme), background: "var(--color-bg)", color: "var(--color-text)" } as React.CSSProperties}>
      <LogoRenderer logo={cover.branding.logo} device={device} page="contact" />
      <h1 className="text-center font-heading" style={{ color: "var(--color-primary)", fontSize: "var(--font-heading-size)" }}>Contact</h1>
      <div className="mt-4 space-y-3">
        {content.contact_phone && <p className="font-body">Phone: {content.contact_phone}</p>}
        {content.contact_email && <p className="font-body">Email: {content.contact_email}</p>}
        {content.contact_address && <p className="font-body">Address: {content.contact_address}</p>}
      </div>
    </div>
  );
}
