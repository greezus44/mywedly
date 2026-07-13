import type { Wedding, WeddingEvent, CoverConfig } from "../../lib/supabase";
import { getCoverContent, themeToCssVars, coverToCssVars, DEFAULT_COVER_CONFIG } from "../../lib/theme";
import { getCountdown, formatDate, formatTime } from "../../lib/utils";
import { useLang } from "../../lib/lang-context";

function mergeCover(wedding: Wedding): CoverConfig {
  const draft = wedding.draft_cover_config;
  if (draft && "colors" in draft) return draft as CoverConfig;
  if (wedding.cover_config && "colors" in wedding.cover_config) return wedding.cover_config as CoverConfig;
  return DEFAULT_COVER_CONFIG;
}

function coverStyle(wedding: Wedding): React.CSSProperties {
  const cover = mergeCover(wedding);
  return { ...themeToCssVars(wedding.theme_config && "colors" in wedding.theme_config ? (wedding.theme_config as any) : undefined), ...coverToCssVars(cover) } as React.CSSProperties;
}

export function CoverPreview({ wedding }: { wedding: Wedding }) {
  const content = getCoverContent(wedding);
  const cover = mergeCover(wedding);
  const { lang } = useLang();
  const cd = getCountdown(wedding.wedding_date);
  const cc = cover.colors || {};
  const cb = cover.background || {};
  const cl = cover.layout || {};
  const ct = cover.typography || {};
  const align = cl.contentAlignment || "center";
  const vPos = cl.verticalPosition || "center";
  const vClass = vPos === "top" ? "justify-start pt-20" : vPos === "bottom" ? "justify-end pb-20" : "justify-center";
  const textAlign = align === "left" ? "text-left items-start" : align === "right" ? "text-right items-end" : "text-center items-center";
  const btnStyle = cl.buttonStyle || "outline";
  const overlayOpacity = cc.overlayOpacity ?? 0.4;

  return (
    <div style={coverStyle(wedding)} className={`min-h-full relative flex flex-col ${vClass} ${textAlign} px-6 py-16`}>
      {cb.type === "image" && cb.imageUrl && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${cb.imageUrl})`, filter: `blur(${cb.blur || 0}px) brightness(${cb.brightness || 100}%)` }} />}
      {cb.type === "video" && cb.videoUrl && <video autoPlay loop muted className="absolute inset-0 w-full h-full object-cover" style={{ filter: `blur(${cb.blur || 0}px) brightness(${cb.brightness || 100}%)` }}><source src={cb.videoUrl} /></video>}
      <div className="absolute inset-0" style={{ background: cc.overlayColor || "#000000", opacity: overlayOpacity }} />
      {cb.overlayGradient && <div className="absolute inset-0" style={{ background: cb.overlayGradient }} />}
      <div className="relative z-10 flex flex-col" style={{ gap: cl.spacing || "1.5rem" }}>
        {cover.branding?.logoVisible && cover.branding?.logoUrl && <img src={cover.branding.logoUrl} alt="" style={{ width: cover.branding.logoSize || "64px", height: "auto" }} className="object-contain" />}
        <p className="font-ui text-xs uppercase" style={{ color: "var(--cover-text)", letterSpacing: "var(--cover-letter-spacing)", opacity: 0.8 }}>{content.cover_welcome || "Welcome"}</p>
        <h1 className="font-script text-4xl md:text-5xl" style={{ color: "var(--cover-text)", fontFamily: "var(--cover-heading-font)", fontSize: "var(--cover-heading-size)" }}>{wedding.couple_name_one}</h1>
        <p className="font-script text-2xl" style={{ color: "var(--cover-text)", opacity: 0.6 }}>&</p>
        <h1 className="font-script text-4xl md:text-5xl" style={{ color: "var(--cover-text)", fontFamily: "var(--cover-heading-font)", fontSize: "var(--cover-heading-size)" }}>{wedding.couple_name_two}</h1>
        <p className="font-ui text-xs uppercase" style={{ color: "var(--cover-text)", letterSpacing: "var(--cover-letter-spacing)", opacity: 0.8 }}>{formatDate(wedding.wedding_date, lang)}</p>
        {!cd.isPast && (
          <div className="flex gap-4">
            {(["days", "hours", "minutes", "seconds"] as const).map((u) => (
              <div key={u} className="text-center"><div className="font-heading text-2xl" style={{ color: "var(--cover-text)" }}>{cd[u]}</div><div className="font-ui text-xs uppercase" style={{ color: "var(--cover-text)", opacity: 0.6 }}>{u}</div></div>
            ))}
          </div>
        )}
        <button style={btnStyle === "solid" ? { background: "var(--cover-button)", color: "var(--cover-button-text)", borderRadius: "var(--cover-radius)" } : btnStyle === "underline" ? { background: "transparent", color: "var(--cover-text)", borderBottom: "2px solid var(--cover-button)" } : { background: "transparent", color: "var(--cover-button)", border: `1px solid var(--cover-button)`, borderRadius: "var(--cover-radius)" }} className="px-7 py-3 font-ui text-xs uppercase" >
          {content.cover_button_text || "Enter Website"}
        </button>
      </div>
    </div>
  );
}

export function LoginPreview({ wedding }: { wedding: Wedding }) {
  return (
    <div style={coverStyle(wedding)} className="min-h-full flex flex-col items-center justify-center px-6 py-16 bg-[var(--color-bg)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-primary)] mb-3">Select Language</p>
          <div className="inline-flex gap-2">
            <span className="px-4 py-1.5 border border-[var(--color-primary)] text-[var(--color-primary)] font-ui text-xs uppercase rounded-lg">English</span>
            <span className="px-4 py-1.5 border border-[var(--color-border)]/30 text-[var(--color-text-muted)] font-ui text-xs uppercase rounded-lg">Bahasa Melayu</span>
          </div>
        </div>
        <div className="text-center mb-6">
          <h2 className="font-script text-3xl text-[var(--color-primary)] mb-2">{wedding.couple_name_one} & {wedding.couple_name_two}</h2>
          <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)]">Guest Sign In</p>
        </div>
        <div className="mb-4">
          <label className="block font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-2 text-left">Username</label>
          <div className="w-full px-5 py-4 border border-[var(--color-primary)] bg-white/50 rounded-lg font-ui text-sm text-gray-400">Enter your username</div>
        </div>
        <button className="w-full py-4 bg-[var(--color-primary)] text-white font-ui text-xs uppercase tracking-wider-luxe rounded-lg">Enter</button>
      </div>
    </div>
  );
}

export function HomePreview({ wedding }: { wedding: Wedding }) {
  const content = getCoverContent(wedding);
  const { lang } = useLang();
  const cd = getCountdown(wedding.wedding_date);
  return (
    <div style={coverStyle(wedding)} className="min-h-full bg-[var(--color-bg)] py-12 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-primary)] mb-4">{content.invitation_intro || "Invitation"}</p>
        <h1 className="font-script text-4xl text-[var(--color-primary)] mb-2">{wedding.couple_name_one}</h1>
        <p className="font-script text-2xl text-[var(--color-primary)]/60 mb-2">&</p>
        <h1 className="font-script text-4xl text-[var(--color-primary)] mb-6">{wedding.couple_name_two}</h1>
        <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] mb-8">{formatDate(wedding.wedding_date, lang)}</p>
        {!cd.isPast && (
          <div className="flex justify-center gap-6 mb-8">
            {(["days", "hours", "minutes", "seconds"] as const).map((u) => (
              <div key={u} className="text-center"><div className="font-heading text-3xl text-[var(--color-primary)]">{cd[u]}</div><div className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">{u}</div></div>
            ))}
          </div>
        )}
        {content.home_body && <p className="font-body text-base text-[var(--color-text)] leading-relaxed mb-8">{content.home_body}</p>}
        {content.invitation_quran_verse && (
          <div className="border-t border-b border-[var(--color-border)]/20 py-6 my-8">
            <p className="font-heading text-lg text-[var(--color-primary)] italic mb-2">{content.invitation_quran_verse}</p>
            {content.invitation_quran_translation && <p className="font-body text-sm text-[var(--color-text-muted)]">{content.invitation_quran_translation}</p>}
            {content.invitation_quran_reference && <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)] mt-2">{content.invitation_quran_reference}</p>}
          </div>
        )}
        {content.invitation_closing && <p className="font-body text-sm text-[var(--color-text)] italic">{content.invitation_closing}</p>}
      </div>
    </div>
  );
}

export function EventCardPreview({ event, wedding }: { event: WeddingEvent; wedding: Wedding }) {
  return (
    <div style={coverStyle(wedding)} className="bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg p-6 mb-4">
      <div className="text-center mb-4">
        <h3 className="font-heading text-xl text-[var(--color-primary)] mb-1">{event.name}</h3>
        <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">{formatDate(event.starts_at)}</p>
      </div>
      <div className="space-y-2 text-center">
        <p className="font-ui text-xs text-[var(--color-text)]"><span className="uppercase tracking-wider text-[var(--color-text-muted)]">Time:</span> {formatTime(event.starts_at)}</p>
        {event.venue_name && <p className="font-ui text-xs text-[var(--color-text)]"><span className="uppercase tracking-wider text-[var(--color-text-muted)]">Venue:</span> {event.venue_name}</p>}
        {event.venue_address && <p className="font-ui text-xs text-[var(--color-text)]">{event.venue_address}</p>}
        {event.dress_code && <p className="font-ui text-xs text-[var(--color-text)]"><span className="uppercase tracking-wider text-[var(--color-text-muted)]">Dress Code:</span> {event.dress_code}</p>}
      </div>
      <div className="flex gap-2 mt-4 justify-center">
        <button className="px-5 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] font-ui text-xs uppercase tracking-wider rounded-lg">Accept</button>
        <button className="px-5 py-2 border border-[var(--color-error)] text-[var(--color-error)] font-ui text-xs uppercase tracking-wider rounded-lg">Decline</button>
      </div>
    </div>
  );
}

export function RsvpPreview({ wedding, events }: { wedding: Wedding; events: WeddingEvent[] }) {
  const content = getCoverContent(wedding);
  return (
    <div style={coverStyle(wedding)} className="min-h-full bg-[var(--color-bg)] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8"><h2 className="font-heading text-2xl text-[var(--color-primary)] mb-2">RSVP</h2>{content.rsvp_intro && <p className="font-body text-sm text-[var(--color-text-muted)]">{content.rsvp_intro}</p>}</div>
        {events.length === 0 ? <p className="text-center font-ui text-sm text-[var(--color-text-muted)]">No events available</p> : events.map((e) => <EventCardPreview key={e.id} event={e} wedding={wedding} />)}
      </div>
    </div>
  );
}

export function DoaPreview({ wedding }: { wedding: Wedding }) {
  const content = getCoverContent(wedding);
  return (
    <div style={coverStyle(wedding)} className="min-h-full bg-[var(--color-bg)] py-12 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-heading text-2xl text-[var(--color-primary)] mb-6">{content.doa_title || "Doa"}</h2>
        {content.doa_image_url && <img src={content.doa_image_url} alt="" className="w-full max-w-md mx-auto rounded-lg mb-6" />}
        <p className="font-body text-base text-[var(--color-text)] leading-relaxed whitespace-pre-line">{content.doa_body || ""}</p>
      </div>
    </div>
  );
}

export function SendMessagePreview({ wedding }: { wedding: Wedding }) {
  const content = getCoverContent(wedding);
  return (
    <div style={coverStyle(wedding)} className="min-h-full bg-[var(--color-bg)] py-12 px-6">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8"><h2 className="font-heading text-2xl text-[var(--color-primary)] mb-2">Send a Message</h2>{content.message_intro && <p className="font-body text-sm text-[var(--color-text-muted)]">{content.message_intro}</p>}</div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg p-6">
          <label className="block font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-2 text-left">Guest Name</label>
          <div className="w-full px-4 py-3 border border-[var(--color-border)]/30 bg-gray-50 rounded-lg font-ui text-sm text-gray-400 mb-4">Auto-filled from session</div>
          <label className="block font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-2 text-left">Your Message</label>
          <div className="w-full px-4 py-3 border border-[var(--color-border)]/30 bg-white rounded-lg min-h-[120px] font-ui text-sm text-gray-400 mb-2">Write your well wishes...</div>
          <p className="font-ui text-xs text-[var(--color-text-muted)] text-right mb-4">500 characters remaining</p>
          <button className="w-full py-3 bg-[var(--color-primary)] text-white font-ui text-xs uppercase tracking-wider-luxe rounded-lg">Submit</button>
        </div>
      </div>
    </div>
  );
}

export function ContactPreview({ wedding }: { wedding: Wedding }) {
  const content = getCoverContent(wedding);
  return (
    <div style={coverStyle(wedding)} className="min-h-full bg-[var(--color-bg)] py-12 px-6">
      <div className="max-w-lg mx-auto text-center">
        <h2 className="font-heading text-2xl text-[var(--color-primary)] mb-8">Contact</h2>
        <div className="space-y-4">
          {content.contact_phone && <p className="font-ui text-sm text-[var(--color-text)]">{content.contact_phone}</p>}
          {content.contact_email && <p className="font-ui text-sm text-[var(--color-text)]">{content.contact_email}</p>}
          {content.contact_address && <p className="font-body text-sm text-[var(--color-text)]">{content.contact_address}</p>}
        </div>
      </div>
    </div>
  );
}
