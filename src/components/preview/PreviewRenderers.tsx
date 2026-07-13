import { UserEvent, CoverConfig, LoginConfig, ThemeConfig, EventContent, LogoConfig } from "../../lib/supabase";
import { DEFAULT_COVER_CONFIG, DEFAULT_LOGIN_CONFIG, DEFAULT_THEME, DEFAULT_CONTENT, DEFAULT_LOGO_CONFIG, themeToCssVars } from "../../lib/theme";
import { formatDate, formatTime, getCountdown } from "../../lib/utils";
import type { CSSProperties } from "react";

function applyTheme(theme: ThemeConfig): CSSProperties { return { ...themeToCssVars(theme) } as CSSProperties; }

export function CoverPreview({ event, coverConfig }: { event: UserEvent; coverConfig: CoverConfig }) {
  const config = { ...DEFAULT_COVER_CONFIG, ...coverConfig };
  const countdown = getCountdown(event.draft_event_date || event.event_date);
  return (
    <div className="relative min-h-[400px] flex flex-col items-center justify-center text-center px-6 py-12" style={{ background: config.bgImage ? `url(${config.bgImage}) center/cover` : config.bgColor, color: config.textColor }}>
      {config.bgImage && <div className="absolute inset-0" style={{ background: config.overlayColor, opacity: config.overlayOpacity }} />}
      <div className="relative z-10 space-y-4">
        {config.customText && <p className="text-sm opacity-80" style={{ fontFamily: config.scriptFont }}>{config.customText}</p>}
        <h1 className="text-3xl font-bold" style={{ fontFamily: config.font }}>{event.name}</h1>
        {config.showDate && (event.draft_event_date || event.event_date) && <p className="text-sm opacity-80">{formatDate(event.draft_event_date || event.event_date)}</p>}
        {config.showCountdown && !countdown.isPast && (
          <div className="flex gap-4 text-center">{(["days", "hours", "minutes"] as const).map(k => (<div key={k}><div className="text-xl font-bold">{countdown[k]}</div><div className="text-xs opacity-60 uppercase">{k}</div></div>))}</div>
        )}
        <button className="px-6 py-2.5 rounded-lg text-sm font-medium mt-4" style={{ background: config.buttonColor, color: config.bgColor }}>{config.buttonText}</button>
      </div>
    </div>
  );
}

export function LoginPreview({ loginConfig, logo }: { loginConfig: LoginConfig; logo?: LogoConfig }) {
  const config = { ...DEFAULT_LOGIN_CONFIG, ...loginConfig };
  const logoConfig = logo || DEFAULT_LOGO_CONFIG;
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6" style={{ background: config.bgImage ? `url(${config.bgImage}) center/cover` : config.bgColor, color: config.textColor }}>
      {config.bgImage && <div className="absolute inset-0" style={{ background: "#000", opacity: config.overlayOpacity }} />}
      <div className="relative z-10 w-full max-w-sm space-y-4 p-8 rounded-xl" style={{ background: config.cardBgColor, borderColor: config.borderColor }}>
        {config.showLogo && logoConfig.enabled && (<div className="text-center">{logoConfig.image ? <img src={logoConfig.image} alt="Logo" className="h-12 mx-auto" /> : <div className="text-2xl font-bold" style={{ color: logoConfig.color, fontSize: logoConfig.fontSize }}>{logoConfig.text}</div>}</div>)}
        <div className="text-center"><h2 className="font-bold" style={{ fontFamily: config.headingFont, fontSize: config.headingFontSize, fontWeight: config.headingWeight }}>{config.title}</h2><p className="text-sm mt-1 opacity-70">{config.subtitle}</p></div>
        <p className="text-sm text-center opacity-80">{config.welcomeMessage}</p>
        <div className="space-y-3"><input type="text" placeholder={config.inputPlaceholder} className="w-full px-4 py-2.5 rounded-lg text-sm" style={{ background: config.inputBgColor, color: config.textColor, border: `1px solid ${config.borderColor}` }} disabled /><button className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ background: config.buttonColor, color: "#fff" }}>{config.buttonText}</button></div>
      </div>
    </div>
  );
}

export function HomePreview({ event, theme, content }: { event: UserEvent; theme: ThemeConfig; content: EventContent }) {
  const t = { ...DEFAULT_THEME, ...theme };
  const c = { ...DEFAULT_CONTENT, ...content };
  return (
    <div style={applyTheme(t)} className="min-h-[400px]">
      <div className="py-12 px-6 text-center" style={{ background: t.bgColor, color: t.headingColor, maxWidth: t.maxWidth, margin: "0 auto" }}>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: t.headingFont }}>{event.name}</h1>
        {(event.draft_event_date || event.event_date) && <p className="text-sm" style={{ color: t.accentColor }}>{formatDate(event.draft_event_date || event.event_date)}</p>}
        {(event.draft_event_time || event.event_time) && <p className="text-sm" style={{ color: t.accentColor }}>{formatTime(event.draft_event_time || event.event_time)}</p>}
        {(event.draft_venue || event.venue) && <p className="text-sm mt-2" style={{ color: t.bodyColor }}>{event.draft_venue || event.venue}</p>}
      </div>
      <div className="py-12 px-6" style={{ background: t.bgColor, color: t.bodyColor, maxWidth: t.maxWidth, margin: "0 auto" }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: t.headingColor, fontFamily: t.headingFont }}>Our Story</h2>
        <p className="text-sm leading-relaxed">{c.story}</p>
        {c.story_image && <img src={c.story_image} alt="Story" className="mt-6 w-full h-48 object-cover rounded-lg" />}
      </div>
    </div>
  );
}

export function RsvpPreview({ theme }: { theme: ThemeConfig }) {
  const t = { ...DEFAULT_THEME, ...theme };
  return (
    <div style={applyTheme(t)} className="min-h-[300px] p-8">
      <div className="max-w-md mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold" style={{ color: t.headingColor, fontFamily: t.headingFont }}>RSVP</h2>
        <p className="text-sm" style={{ color: t.bodyColor }}>Will you be attending?</p>
        <div className="flex gap-3 justify-center">
          <button className="px-6 py-2.5 rounded-lg text-sm font-medium" style={{ background: t.buttonBgColor, color: t.buttonTextColor, borderRadius: t.buttonRadius }}>Yes, I'll attend</button>
          <button className="px-6 py-2.5 rounded-lg text-sm font-medium border" style={{ borderColor: t.accentColor, color: t.bodyColor, borderRadius: t.buttonRadius }}>Cannot attend</button>
        </div>
      </div>
    </div>
  );
}

export function LogoRenderer({ config }: { config: LogoConfig }) {
  if (!config.enabled) return null;
  if (config.image) return <img src={config.image} alt="Logo" style={{ height: config.fontSize }} />;
  return <span style={{ color: config.color, fontSize: config.fontSize, fontWeight: 700 }}>{config.text}</span>;
}
