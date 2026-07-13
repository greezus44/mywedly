import { useMemo, useState, useEffect } from "react";
import { Calendar, MapPin, Clock, ChevronDown, Heart, Star, X, ChevronLeft, ChevronRight, Menu, Home, Image as ImageIcon, HelpCircle, Gift, Mail, LogOut } from "lucide-react";
import type { Wedding, CoverContent } from "@/lib/supabase";
import type { ThemeConfig } from "@/lib/theme";
import { themeToCssVars, getCoverContent } from "@/lib/theme";
import { formatDate, daysUntil, cn } from "@/lib/utils";

// ─── Cover page preview ───
export function CoverPreview({ wedding, theme }: { wedding: Wedding; theme: ThemeConfig }) {
  const content = getCoverContent(wedding);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  const bgUrl = content.cover_background_url || wedding.hero_image_url;
  const videoUrl = content.cover_background_video_url;
  const overlay = content.cover_overlay_opacity ?? 0.3;
  const textAlign = content.cover_text_align ?? "center";
  const logoVisible = content.cover_logo_visible !== false;
  const logoUrl = content.cover_logo_url;
  const logoSize = content.cover_logo_size ?? "80px";
  const logoPos = content.cover_logo_position ?? "center";
  const countdownEnabled = content.cover_countdown_enabled !== false;
  const heading = content.cover_heading || `${wedding.couple_name_one} & ${wedding.couple_name_two}`;
  const subtitle = content.cover_subtitle;
  const welcome = content.cover_welcome;
  const buttonText = content.cover_button_text || "Enter Website";
  const mainHeading = content.cover_main_heading;
  const dUntil = daysUntil(wedding.wedding_date);

  return (
    <div className="relative w-full h-full overflow-hidden" style={cssVars}>
      {videoUrl ? (
        <video src={videoUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : bgUrl ? (
        <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, var(--c-secondary), var(--c-accent))` }} />
      )}
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlay})` }} />
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 h-full" style={{ textAlign }}>
        {logoVisible && logoUrl && (
          <img src={logoUrl} alt="monogram" className="mb-4" style={{ width: logoSize, maxWidth: "120px", alignSelf: logoPos === "left" ? "flex-start" : logoPos === "right" ? "flex-end" : "center" }} />
        )}
        {mainHeading && <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: "rgba(255,255,255,0.8)", fontFamily: "var(--f-body)" }}>{mainHeading}</p>}
        <h1 className="leading-tight mb-2" style={{ color: "white", fontSize: "clamp(2rem, 6vw, 3.5rem)", fontFamily: "var(--f-heading)", fontStyle: "var(--f-style)" }}>{heading}</h1>
        {subtitle && <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.85)", fontFamily: "var(--f-body)" }}>{subtitle}</p>}
        {wedding.wedding_date && (
          <div className="flex items-center gap-2 mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
            <Calendar className="w-4 h-4" /><span className="text-sm" style={{ fontFamily: "var(--f-body)" }}>{formatDate(wedding.wedding_date)}</span>
          </div>
        )}
        {wedding.location && (
          <div className="flex items-center gap-2 mb-3" style={{ color: "rgba(255,255,255,0.9)" }}>
            <MapPin className="w-4 h-4" /><span className="text-sm" style={{ fontFamily: "var(--f-body)" }}>{wedding.location}</span>
          </div>
        )}
        {welcome && <p className="text-sm max-w-md mb-4" style={{ color: "rgba(255,255,255,0.8)", fontFamily: "var(--f-body)" }}>{welcome}</p>}
        {countdownEnabled && dUntil !== null && dUntil > 0 && (
          <div className="mb-4 px-4 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
            <span className="text-lg" style={{ fontFamily: "var(--f-heading)" }}>{dUntil}</span>
            <span className="text-xs ml-1" style={{ fontFamily: "var(--f-body)" }}>days to go</span>
          </div>
        )}
        <button className="px-6 py-2.5 rounded-lg text-sm font-medium" style={{ background: "rgba(255,255,255,0.95)", color: "var(--c-text)", borderRadius: "var(--ui-radius)", fontFamily: "var(--f-body)" }}>{buttonText}</button>
      </div>
    </div>
  );
}

// ─── Home page preview ───
export function HomePreview({ wedding, theme, guestName }: { wedding: Wedding; theme: ThemeConfig; guestName?: string }) {
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  const dUntil = daysUntil(wedding.wedding_date);
  return (
    <div style={cssVars}>
      <div className="relative overflow-hidden" style={{ minHeight: "300px" }}>
        {wedding.hero_image_url ? (
          <img src={wedding.hero_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, var(--c-secondary), var(--c-accent))` }} />
        )}
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.25)" }} />
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-16" style={{ minHeight: "300px" }}>
          <h1 className="mb-2" style={{ color: "white", fontSize: "clamp(2rem, 5vw, 3rem)", fontFamily: "var(--f-heading)", fontStyle: "var(--f-style)" }}>{wedding.couple_name_one} & {wedding.couple_name_two}</h1>
          {wedding.wedding_date && <p className="text-sm" style={{ color: "rgba(255,255,255,0.9)", fontFamily: "var(--f-body)" }}>{formatDate(wedding.wedding_date)}</p>}
          {dUntil !== null && dUntil > 0 && (
            <div className="mt-3 px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
              <span className="text-sm" style={{ fontFamily: "var(--f-body)" }}>{dUntil} days to go</span>
            </div>
          )}
        </div>
      </div>
      <div className="px-6 py-8 text-center">
        {guestName && <p className="text-sm mb-2" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>Welcome, {guestName}!</p>}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-px w-8" style={{ background: "var(--c-accent)" }} />
          <Heart className="w-4 h-4" style={{ color: "var(--c-accent)" }} />
          <div className="h-px w-8" style={{ background: "var(--c-accent)" }} />
        </div>
        <h2 className="text-xl mb-2" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}>Our Wedding</h2>
        {wedding.location && <p className="text-sm" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>{wedding.location}</p>}
      </div>
    </div>
  );
}

// ─── Event card preview ───
export function EventCardPreview({ event, theme }: { event: { name: string; kind: string; starts_at: string; venue_name?: string | null; venue_address?: string | null; dress_code?: string | null; description?: string | null; maps_url?: string | null; image_url?: string | null; rsvp_deadline?: string | null }; theme: ThemeConfig }) {
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  return (
    <div className="rounded-xl overflow-hidden border p-4" style={{ ...cssVars, borderColor: "var(--c-secondary)", background: "var(--c-card)", borderRadius: "var(--ui-radius)", boxShadow: "var(--ui-shadow)" }}>
      {event.image_url && (
        <div className="relative h-32 overflow-hidden rounded-lg mb-3">
          <img src={event.image_url} alt="" className="w-full h-full object-cover" />
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(255,255,255,0.9)", color: "var(--c-text)" }}>{event.kind}</span>
        </div>
      )}
      <h3 className="text-lg mb-2" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}>{event.name}</h3>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--c-textMuted)" }}>
          <Calendar className="w-3.5 h-3.5" /><span style={{ fontFamily: "var(--f-body)" }}>{formatDate(event.starts_at)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--c-textMuted)" }}>
          <Clock className="w-3.5 h-3.5" /><span style={{ fontFamily: "var(--f-body)" }}>{new Date(event.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
        </div>
        {event.venue_name && (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--c-textMuted)" }}>
            <MapPin className="w-3.5 h-3.5" /><span style={{ fontFamily: "var(--f-body)" }}>{event.venue_name}</span>
          </div>
        )}
        {event.dress_code && <p className="text-xs mt-1" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>Dress code: {event.dress_code}</p>}
      </div>
      {event.description && <p className="text-sm mt-3 line-clamp-2" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>{event.description}</p>}
    </div>
  );
}

// ─── Content section preview ───
export function ContentSectionPreview({ title, body, imageUrl, theme, sectionLabel }: { title?: string | null; body?: string | null; imageUrl?: string | null; theme: ThemeConfig; sectionLabel?: string }) {
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  return (
    <div className="px-6 py-8" style={cssVars}>
      {sectionLabel && <p className="text-xs uppercase tracking-[0.2em] text-center mb-2" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>{sectionLabel}</p>}
      {title && <h2 className="text-2xl text-center mb-4" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}>{title}</h2>}
      {imageUrl && <img src={imageUrl} alt="" className="w-full max-w-md mx-auto rounded-lg mb-4" style={{ borderRadius: "var(--ui-radius)" }} />}
      {body && <p className="text-sm max-w-md mx-auto whitespace-pre-line" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)", lineHeight: 1.7 }}>{body}</p>}
    </div>
  );
}

// ─── Gallery preview ───
export function GalleryPreview({ images, theme }: { images: { image_url: string; caption?: string | null; is_featured?: boolean }[]; theme: ThemeConfig }) {
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  const [lightbox, setLightbox] = useState<number | null>(null);
  return (
    <div className="px-4 py-6" style={cssVars}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {images.slice(0, 12).map((img, i) => (
          <div key={i} className="aspect-square rounded-lg overflow-hidden relative cursor-pointer" style={{ borderRadius: "var(--ui-radius)" }} onClick={() => setLightbox(i)}>
            <img src={img.image_url} alt={img.caption ?? ""} className="w-full h-full object-cover" />
            {img.is_featured && <Star className="absolute top-1.5 right-1.5 w-4 h-4 text-yellow-400 fill-yellow-400" />}
          </div>
        ))}
      </div>
      {images.length === 0 && <div className="text-center py-12"><p className="text-sm" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>No images yet</p></div>}
      {lightbox !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white p-2" onClick={() => setLightbox(null)}><X className="w-6 h-6" /></button>
          {lightbox > 0 && <button className="absolute left-4 text-white p-2" onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}><ChevronLeft className="w-6 h-6" /></button>}
          <img src={images[lightbox].image_url} alt="" className="max-w-full max-h-full object-contain" />
          {lightbox < images.length - 1 && <button className="absolute right-4 text-white p-2" onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}><ChevronRight className="w-6 h-6" /></button>}
        </div>
      )}
    </div>
  );
}

// ─── Nav preview ───
export function NavPreview({ theme, coupleNames, items }: { theme: ThemeConfig; coupleNames: string; items: string[] }) {
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  return (
    <div className="px-4 py-3 border-b" style={{ ...cssVars, background: "var(--c-navBg)", borderColor: "var(--c-secondary)" }}>
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--c-navText)", fontFamily: "var(--f-heading)" }}>{coupleNames}</span>
        <div className="hidden md:flex gap-3">
          {items.map((item) => (
            <span key={item} className="text-xs" style={{ color: "var(--c-navText)", fontFamily: "var(--f-body)" }}>{item}</span>
          ))}
        </div>
        <button className="md:hidden" style={{ color: "var(--c-navText)" }}><Menu className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

// ─── Footer preview ───
export function FooterPreview({ theme, hashtag, date }: { theme: ThemeConfig; hashtag?: string | null; date?: string | null }) {
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  return (
    <div className="px-6 py-6 text-center" style={{ ...cssVars, background: "var(--c-footerBg)" }}>
      {hashtag && <p className="text-lg mb-1" style={{ color: "var(--c-footerText)", fontFamily: "var(--f-heading)" }}>{hashtag}</p>}
      {date && <p className="text-xs" style={{ color: "var(--c-footerText)", opacity: 0.7, fontFamily: "var(--f-body)" }}>{formatDate(date)}</p>}
    </div>
  );
}

// ─── Full page preview (combines nav + content + footer) ───
export function FullPagePreview({ wedding, theme, page = "home", content }: { wedding: Wedding; theme: ThemeConfig; page?: string; content?: { title?: string; body?: string; imageUrl?: string } | null }) {
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  const navItems = ["Home", "Events", "Story", "Gallery", "Travel", "FAQ", "Registry", "Contact"];
  const coupleNames = `${wedding.couple_name_one} & ${wedding.couple_name_two}`;

  return (
    <div className="h-full flex flex-col" style={cssVars}>
      <NavPreview theme={theme} coupleNames={coupleNames} items={navItems} />
      <div className="flex-1 overflow-y-auto" style={{ background: "var(--c-background)" }}>
        {page === "home" && <HomePreview wedding={wedding} theme={theme} />}
        {page === "cover" && <CoverPreview wedding={wedding} theme={theme} />}
        {page === "content" && content && <ContentSectionPreview title={content.title} body={content.body} imageUrl={content.imageUrl} theme={theme} />}
      </div>
      <FooterPreview theme={theme} hashtag={wedding.hashtag} date={wedding.wedding_date} />
    </div>
  );
}
