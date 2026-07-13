import type { UserEvent } from "../../lib/supabase";
import { DEFAULT_THEME, themeToCssVars } from "../../lib/theme";
import { formatDate, formatTime, getCountdown } from "../../lib/utils";
import type { CSSProperties } from "react";
export function CoverPreview({ event }: { event: UserEvent | null }) {
  if (!event) return <div className="p-8 text-center text-slate-400">No event data</div>;
  const config = event.draft_cover_config || event.cover_config || {};
  const logo = event.draft_logo_config || event.logo_config || { enabled: false };
  const theme = event.draft_theme || event.theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;
  return (
    <div style={{ ...cssVars, backgroundImage: config.bgImage ? `url(${config.bgImage})` : undefined, backgroundColor: config.bgColor || "#0f172a", aspectRatio: "16/9" }} className="relative flex flex-col items-center justify-center overflow-hidden">
      {config.bgImage && <div className="absolute inset-0" style={{ backgroundColor: config.overlayColor || "#000", opacity: config.overlayOpacity ?? 0.4 }} />}
      <div className="relative z-10 text-center px-6">
        {logo.enabled && logo.image && <img src={logo.image} alt="Logo" className="h-12 mx-auto mb-4" />}
        {logo.enabled && logo.text && <div className="text-lg font-medium mb-3" style={{ color: logo.color || config.textColor || "#fff" }}>{logo.text}</div>}
        {config.customText && <p className="text-sm mb-2" style={{ fontFamily: `"${config.scriptFont}", serif`, color: config.textColor || "#fff" }}>{config.customText}</p>}
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: config.textColor || "#fff", fontFamily: `"${config.font}", sans-serif` }}>{event.draft_name || event.name}</h1>
        {config.showDate && event.draft_event_date && <p className="mt-2 text-sm" style={{ color: config.textColor || "#fff" }}>{formatDate(event.draft_event_date)}</p>}
        {config.showCountdown && event.draft_event_date && !getCountdown(event.draft_event_date).isPast && (
          <div className="flex gap-4 mt-3 justify-center" style={{ color: config.textColor || "#fff" }}>
            {[{ l: "Days", v: getCountdown(event.draft_event_date).days }, { l: "Hours", v: getCountdown(event.draft_event_date).hours }, { l: "Min", v: getCountdown(event.draft_event_date).minutes }, { l: "Sec", v: getCountdown(event.draft_event_date).seconds }].map((i) => <div key={i.l} className="text-center"><div className="text-xl font-bold">{i.v}</div><div className="text-xs opacity-75">{i.l}</div></div>)}
          </div>
        )}
        <button className="mt-4 px-6 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: config.buttonColor || "#fff", color: "#000" }}>{config.buttonText || "Enter"}</button>
      </div>
    </div>
  );
}
export function LoginPreview({ event }: { event: UserEvent | null }) {
  if (!event) return <div className="p-8 text-center text-slate-400">No event data</div>;
  const config = event.draft_login_config || event.login_config || {};
  const theme = event.draft_theme || event.theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;
  return (
    <div style={{ ...cssVars, backgroundColor: config.bgColor || "#f8fafc", backgroundImage: config.bgImage ? `url(${config.bgImage})` : undefined }} className="relative flex flex-col items-center justify-center p-8 min-h-[300px] overflow-hidden">
      {config.bgImage && <div className="absolute inset-0" style={{ backgroundColor: config.overlayColor || "#000", opacity: config.overlayOpacity ?? 0.4 }} />}
      <div className="relative z-10 text-center max-w-sm w-full">
        {config.heading && <h2 className="text-2xl font-bold mb-2" style={{ color: config.textColor || "#1e293b" }}>{config.heading}</h2>}
        {config.subheading && <p className="text-sm mb-4" style={{ color: config.textColor || "#64748b" }}>{config.subheading}</p>}
        <input disabled placeholder={config.inputPlaceholder || "Your name"} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 mb-3" />
        <button className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: config.buttonColor || "#0f172a" }}>{config.buttonText || "Continue"}</button>
      </div>
    </div>
  );
}
export function HomePreview({ event }: { event: UserEvent | null }) {
  if (!event) return <div className="p-8 text-center text-slate-400">No event data</div>;
  const content = event.draft_content || event.content || {};
  const theme = event.draft_theme || event.theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;
  return (
    <div style={cssVars} className="p-8 space-y-6">
      <div className="text-center">
        {content.invitation_title && <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--color-primary)" }}>{content.invitation_title}</h2>}
        {content.invitation_subtitle && <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{content.invitation_subtitle}</p>}
      </div>
      {content.story_image && <img src={content.story_image} alt="Story" className="w-full rounded-lg" style={{ maxHeight: 200, objectFit: "cover" }} />}
      {content.story && <p className="text-sm text-center" style={{ color: "var(--color-text)" }}>{content.story}</p>}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div><div className="font-medium" style={{ color: "var(--color-primary)" }}>When</div><div style={{ color: "var(--color-text-muted)" }}>{formatDate(event.draft_event_date)}</div></div>
        <div><div className="font-medium" style={{ color: "var(--color-primary)" }}>Time</div><div style={{ color: "var(--color-text-muted)" }}>{formatTime(event.draft_event_time)}</div></div>
        <div><div className="font-medium" style={{ color: "var(--color-primary)" }}>Where</div><div style={{ color: "var(--color-text-muted)" }}>{event.draft_venue || "TBD"}</div></div>
      </div>
      <button className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: "var(--color-primary)" }}>{content.rsvp_button_text || "RSVP"}</button>
    </div>
  );
}
export function RsvpPreview({ event }: { event: UserEvent | null }) {
  if (!event) return <div className="p-8 text-center text-slate-400">No event data</div>;
  const theme = event.draft_theme || event.theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;
  return (
    <div style={cssVars} className="p-8 space-y-4">
      <h2 className="text-xl font-bold text-center" style={{ color: "var(--color-primary)" }}>RSVP</h2>
      <div className="flex gap-3">
        <button className="flex-1 py-2.5 rounded-lg border-2 font-medium text-sm" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>Accept</button>
        <button className="flex-1 py-2.5 rounded-lg border-2 border-slate-200 font-medium text-sm text-slate-500">Decline</button>
      </div>
      <button className="w-full py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: "var(--color-primary)" }}>Submit RSVP</button>
    </div>
  );
}
