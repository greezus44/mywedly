import { useState, useEffect, CSSProperties } from "react";
import type { Wedding, CoverConfig, LoginConfig, ThemeConfig, LogoConfig, WeddingContent } from "../../lib/supabase";
import { themeToCssVars, coverToCssVars, loginToCssVars, getLogoStyle, shouldShowLogo } from "../../lib/theme";
import { getCountdown, formatDate, formatTime } from "../../lib/utils";

function buildStyle(...vars: Record<string, string>[]): CSSProperties { return Object.assign({}, ...vars) as CSSProperties; }

export function LogoRenderer({ logo, className = "" }: { logo: LogoConfig; className?: string }) {
  if (!shouldShowLogo(logo)) return null;
  if (logo.image) return <img src={logo.image} alt="Logo" className={className} style={{ maxHeight: `${logo.fontSize * 2}px` }} />;
  return <div className={className} style={getLogoStyle(logo)}>{logo.text}</div>;
}

export function CoverPreview({ wedding, coverConfig }: { wedding: Partial<Wedding>; coverConfig: CoverConfig }) {
  const [countdown, setCountdown] = useState(getCountdown(wedding.draft_wedding_date || wedding.wedding_date || null));
  useEffect(() => {
    const target = wedding.draft_wedding_date || wedding.wedding_date || null;
    if (!target) return;
    const interval = setInterval(() => setCountdown(getCountdown(target)), 1000);
    return () => clearInterval(interval);
  }, [wedding.wedding_date, wedding.draft_wedding_date]);

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center" style={{ backgroundColor: coverConfig.bgColor, color: coverConfig.textColor, fontFamily: `"${coverConfig.font}", serif` }}>
      {coverConfig.bgImage && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${coverConfig.bgImage})` }} />}
      <div className="absolute inset-0" style={{ backgroundColor: coverConfig.overlayColor, opacity: coverConfig.overlayOpacity }} />
      <div className="relative z-10 text-center px-8">
        {coverConfig.customText && <p className="text-sm uppercase tracking-widest mb-4 opacity-80">{coverConfig.customText}</p>}
        <p className="text-lg mb-2 opacity-90" style={{ fontFamily: `"${coverConfig.scriptFont}", cursive` }}>The Wedding of</p>
        <h1 className="text-5xl md:text-6xl font-bold mb-4" style={{ fontFamily: `"${coverConfig.font}", serif` }}>
          {wedding.draft_groom_name || wedding.groom_name} & {wedding.draft_bride_name || wedding.bride_name}
        </h1>
        {coverConfig.showDate && (wedding.draft_wedding_date || wedding.wedding_date) && (
          <p className="text-base opacity-90 mb-4">{formatDate(wedding.draft_wedding_date || wedding.wedding_date || null)}</p>
        )}
        {coverConfig.showCountdown && !countdown.expired && (
          <div className="flex justify-center gap-6 mt-6">
            {[{ label: "Days", value: countdown.days }, { label: "Hours", value: countdown.hours }, { label: "Min", value: countdown.minutes }, { label: "Sec", value: countdown.seconds }].map(item => (
              <div key={item.label} className="text-center">
                <div className="text-2xl font-bold">{String(item.value).padStart(2, "0")}</div>
                <div className="text-xs uppercase tracking-wider opacity-70">{item.label}</div>
              </div>
            ))}
          </div>
        )}
        {coverConfig.buttonText && (
          <div className="mt-8">
            <button disabled className="px-6 py-2.5 rounded-lg font-medium text-sm" style={{ backgroundColor: coverConfig.buttonColor, color: "#fff" }}>{coverConfig.buttonText}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function LoginPreview({ loginConfig, logo }: { loginConfig: LoginConfig; logo: LogoConfig }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 relative" style={{ backgroundColor: loginConfig.bgColor, color: loginConfig.textColor, fontFamily: `"${loginConfig.font}", sans-serif` }}>
      {loginConfig.bgImage && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${loginConfig.bgImage})` }} />}
      {loginConfig.bgImage && <div className="absolute inset-0" style={{ backgroundColor: "#000", opacity: loginConfig.overlayOpacity }} />}
      <div className="w-full max-w-sm p-8 rounded-2xl shadow-lg relative z-10" style={{ backgroundColor: loginConfig.cardBgColor }}>
        {loginConfig.showLogo && shouldShowLogo(logo) && <div className="text-center mb-6"><LogoRenderer logo={logo} className="inline-block" /></div>}
        <h2 className="text-center mb-2" style={{ fontFamily: `"${loginConfig.headingFont}", serif`, fontSize: `${loginConfig.headingFontSize}px`, fontWeight: loginConfig.headingWeight, color: loginConfig.textColor }}>{loginConfig.title}</h2>
        <p className="text-sm text-center mb-1 opacity-70">{loginConfig.subtitle}</p>
        {loginConfig.welcomeMessage && <p className="text-sm text-center mb-6 opacity-60">{loginConfig.welcomeMessage}</p>}
        <div className="space-y-4">
          <input type="text" placeholder={loginConfig.inputPlaceholder} disabled className="w-full px-4 py-3 rounded-lg border" style={{ borderColor: loginConfig.borderColor, backgroundColor: loginConfig.inputBgColor, color: loginConfig.textColor }} />
          <button disabled className="w-full py-3 rounded-lg font-medium" style={{ backgroundColor: loginConfig.buttonColor, color: "#fff" }}>{loginConfig.buttonText}</button>
        </div>
      </div>
    </div>
  );
}

export function HomePreview({ wedding, theme, content }: { wedding: Partial<Wedding>; theme: ThemeConfig; content: WeddingContent }) {
  const style = buildStyle(themeToCssVars(theme));
  const groom = wedding.draft_groom_name || wedding.groom_name;
  const bride = wedding.draft_bride_name || wedding.bride_name;
  const date = wedding.draft_wedding_date || wedding.wedding_date;
  const time = wedding.draft_wedding_time || wedding.wedding_time;
  const venue = wedding.draft_venue || wedding.venue;
  const address = wedding.draft_address || wedding.address;

  return (
    <div className="w-full min-h-full" style={style}>
      <div className="py-16 px-6 text-center" style={{ padding: `${theme.sectionPadding}px 24px` }}>
        <p className="text-lg mb-4 opacity-80" style={{ fontFamily: `"${theme.scriptFont}", cursive` }}>Together with their families</p>
        <h1 className="text-5xl font-bold mb-2" style={{ fontFamily: `"${theme.headingFont}", serif`, color: theme.headingColor }}>{groom}</h1>
        <p className="text-2xl mb-2 opacity-60" style={{ fontFamily: `"${theme.scriptFont}", cursive` }}>&</p>
        <h1 className="text-5xl font-bold mb-6" style={{ fontFamily: `"${theme.headingFont}", serif`, color: theme.headingColor }}>{bride}</h1>
        {date && <p className="text-base opacity-80 mb-1">{formatDate(date)}</p>}
        {time && <p className="text-sm opacity-60">{formatTime(time)}</p>}
        {venue && <p className="text-base opacity-80 mt-4">{venue}</p>}
        {address && <p className="text-sm opacity-60">{address}</p>}
      </div>
      {content.story && (
        <div className="py-12 px-6 text-center" style={{ maxWidth: `${theme.maxWidth}px`, margin: "0 auto" }}>
          <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: `"${theme.headingFont}", serif`, color: theme.headingColor }}>Our Story</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: theme.bodyColor }}>{content.story}</p>
        </div>
      )}
      {content.gallery?.length > 0 && (
        <div className="py-12 px-6">
          <h2 className="text-3xl font-bold mb-6 text-center" style={{ fontFamily: `"${theme.headingFont}", serif`, color: theme.headingColor }}>Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3" style={{ maxWidth: `${theme.maxWidth}px`, margin: "0 auto" }}>
            {content.gallery.slice(0, 6).map((img, i) => <img key={i} src={img} alt="" className="w-full h-32 object-cover rounded-lg" />)}
          </div>
        </div>
      )}
      {content.footer_enabled && content.footer_text && <div className="py-8 px-6 text-center text-sm opacity-60">{content.footer_text}</div>}
    </div>
  );
}

export function RsvpPreview({ theme, content }: { theme: ThemeConfig; content: WeddingContent }) {
  const style = buildStyle(themeToCssVars(theme));
  return (
    <div className="w-full min-h-full p-8" style={style}>
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: `"${theme.headingFont}", serif`, color: theme.headingColor }}>{content.rsvp_title || "RSVP"}</h2>
        <p className="text-sm mb-6 opacity-70">{content.rsvp_description}</p>
        <div className="space-y-4 text-left">
          {content.rsvp_questions?.map(q => (
            <div key={q.id}>
              <label className="text-sm font-medium block mb-1">{q.text}{q.required && " *"}</label>
              {q.type === "text" && <input disabled className="w-full px-3 py-2 rounded-lg border border-gray-300" />}
              {q.type === "radio" && <div className="flex gap-3">{q.options.map(o => <label key={o} className="text-sm"><input type="radio" disabled /> {o}</label>)}</div>}
              {q.type === "select" && <select disabled className="w-full px-3 py-2 rounded-lg border border-gray-300"><option>Select...</option>{q.options.map(o => <option key={o}>{o}</option>)}</select>}
            </div>
          ))}
        </div>
        <button disabled className="mt-6 px-6 py-2.5 rounded-lg font-medium" style={{ backgroundColor: theme.buttonBgColor, color: theme.buttonTextColor, borderRadius: `${theme.buttonRadius}px` }}>Submit RSVP</button>
      </div>
    </div>
  );
}

export function DoaPreview({ theme, content }: { theme: ThemeConfig; content: WeddingContent }) {
  const style = buildStyle(themeToCssVars(theme));
  return (
    <div className="w-full min-h-full p-8 text-center" style={style}>
      <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: `"${theme.headingFont}", serif`, color: theme.headingColor }}>{content.doa_title || "Doa & Wishes"}</h2>
      <p className="text-sm opacity-70 max-w-md mx-auto">{content.doa_description}</p>
    </div>
  );
}

export function SendMessagePreview({ theme }: { theme: ThemeConfig }) {
  const style = buildStyle(themeToCssVars(theme));
  return (
    <div className="w-full min-h-full p-8" style={style}>
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: `"${theme.headingFont}", serif`, color: theme.headingColor }}>Send a Message</h2>
        <textarea disabled placeholder="Write your message..." className="w-full px-3 py-2 rounded-lg border border-gray-300 min-h-[120px]" />
        <button disabled className="mt-4 px-6 py-2.5 rounded-lg font-medium" style={{ backgroundColor: theme.buttonBgColor, color: theme.buttonTextColor }}>Send</button>
      </div>
    </div>
  );
}

export function ContactPreview({ theme, content }: { theme: ThemeConfig; content: WeddingContent }) {
  const style = buildStyle(themeToCssVars(theme));
  return (
    <div className="w-full min-h-full p-8" style={style}>
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: `"${theme.headingFont}", serif`, color: theme.headingColor }}>Contact</h2>
        {content.contact_phone && <p className="text-sm mb-2">Phone: {content.contact_phone}</p>}
        {content.contact_email && <p className="text-sm mb-2">Email: {content.contact_email}</p>}
        {content.contact_address && <p className="text-sm mb-2">Address: {content.contact_address}</p>}
      </div>
    </div>
  );
}
