import { useMemo } from "react";
import { Calendar, MapPin, Clock, ChevronDown, Heart } from "lucide-react";
import type { Wedding } from "@/lib/supabase";
import type { ThemeConfig } from "@/lib/theme";
import { themeToCssVars, getCoverContent } from "@/lib/theme";
import { formatDate, daysUntil } from "@/lib/utils";

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
    <div
      className="relative w-full overflow-hidden"
      style={{ minHeight: "400px", ...cssVars }}
    >
      {/* Background */}
      {videoUrl ? (
        <video src={videoUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : bgUrl ? (
        <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, var(--c-secondary), var(--c-accent))` }} />
      )}
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlay})` }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-16" style={{ textAlign, minHeight: "400px" }}>
        {/* Logo */}
        {logoVisible && logoUrl && (
          <img
            src={logoUrl}
            alt="monogram"
            className="mb-4"
            style={{
              width: logoSize,
              maxWidth: "120px",
              alignSelf: logoPos === "left" ? "flex-start" : logoPos === "right" ? "flex-end" : "center",
            }}
          />
        )}

        {mainHeading && (
          <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: "rgba(255,255,255,0.8)", fontFamily: "var(--f-body)" }}>
            {mainHeading}
          </p>
        )}

        <h1
          className="font-script leading-tight mb-2"
          style={{
            color: "white",
            fontSize: "clamp(2rem, 6vw, 3.5rem)",
            fontFamily: "var(--f-heading)",
            fontStyle: "var(--f-style)",
          }}
        >
          {heading}
        </h1>

        {subtitle && (
          <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.85)", fontFamily: "var(--f-body)" }}>
            {subtitle}
          </p>
        )}

        {wedding.wedding_date && (
          <div className="flex items-center gap-2 mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
            <Calendar className="w-4 h-4" />
            <span className="text-sm" style={{ fontFamily: "var(--f-body)" }}>{formatDate(wedding.wedding_date)}</span>
          </div>
        )}

        {wedding.location && (
          <div className="flex items-center gap-2 mb-3" style={{ color: "rgba(255,255,255,0.9)" }}>
            <MapPin className="w-4 h-4" />
            <span className="text-sm" style={{ fontFamily: "var(--f-body)" }}>{wedding.location}</span>
          </div>
        )}

        {welcome && (
          <p className="text-sm max-w-md mb-4" style={{ color: "rgba(255,255,255,0.8)", fontFamily: "var(--f-body)" }}>
            {welcome}
          </p>
        )}

        {countdownEnabled && dUntil !== null && dUntil > 0 && (
          <div className="mb-4 px-4 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
            <span className="text-lg font-serif" style={{ fontFamily: "var(--f-heading)" }}>{dUntil}</span>
            <span className="text-xs ml-1" style={{ fontFamily: "var(--f-body)" }}>days to go</span>
          </div>
        )}

        <button
          className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
          style={{
            background: "rgba(255,255,255,0.95)",
            color: "var(--c-text)",
            borderRadius: "var(--ui-radius)",
            fontFamily: "var(--f-body)",
          }}
        >
          {buttonText}
        </button>
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
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight: "300px" }}>
        {wedding.hero_image_url ? (
          <img src={wedding.hero_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, var(--c-secondary), var(--c-accent))` }} />
        )}
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.25)" }} />
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-16" style={{ minHeight: "300px" }}>
          <h1 className="font-script mb-2" style={{ color: "white", fontSize: "clamp(2rem, 5vw, 3rem)", fontFamily: "var(--f-heading)", fontStyle: "var(--f-style)" }}>
            {wedding.couple_name_one} & {wedding.couple_name_two}
          </h1>
          {wedding.wedding_date && (
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.9)", fontFamily: "var(--f-body)" }}>{formatDate(wedding.wedding_date)}</p>
          )}
          {dUntil !== null && dUntil > 0 && (
            <div className="mt-3 px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
              <span className="text-sm" style={{ fontFamily: "var(--f-body)" }}>{dUntil} days to go</span>
            </div>
          )}
        </div>
      </div>

      {/* Welcome */}
      <div className="px-6 py-8 text-center">
        {guestName && (
          <p className="text-sm mb-2" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
            Welcome, {guestName}!
          </p>
        )}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-px w-8" style={{ background: "var(--c-accent)" }} />
          <Heart className="w-4 h-4" style={{ color: "var(--c-accent)" }} />
          <div className="h-px w-8" style={{ background: "var(--c-accent)" }} />
        </div>
        <h2 className="font-serif text-xl mb-2" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}>Our Wedding</h2>
        {wedding.location && (
          <p className="text-sm" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>{wedding.location}</p>
        )}
      </div>
    </div>
  );
}

// ─── Event card preview ───
export function EventCardPreview({ event, theme }: { event: { name: string; kind: string; starts_at: string; venue_name?: string | null; venue_address?: string | null; dress_code?: string | null; description?: string | null; maps_url?: string | null; image_url?: string | null; rsvp_deadline?: string | null }; theme: ThemeConfig }) {
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  return (
    <div className="rounded-xl overflow-hidden border" style={{ ...cssVars, borderColor: "var(--c-secondary)", background: "var(--c-card)", borderRadius: "var(--ui-radius)", boxShadow: "var(--ui-shadow)" }}>
      {event.image_url && (
        <div className="relative h-32 overflow-hidden">
          <img src={event.image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))" }} />
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(255,255,255,0.9)", color: "var(--c-text)" }}>
            {event.kind}
          </span>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-serif text-lg mb-2" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}>{event.name}</h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--c-textMuted)" }}>
            <Calendar className="w-3.5 h-3.5" />
            <span style={{ fontFamily: "var(--f-body)" }}>{formatDate(event.starts_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--c-textMuted)" }}>
            <Clock className="w-3.5 h-3.5" />
            <span style={{ fontFamily: "var(--f-body)" }}>{new Date(event.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
          </div>
          {event.venue_name && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--c-textMuted)" }}>
              <MapPin className="w-3.5 h-3.5" />
              <span style={{ fontFamily: "var(--f-body)" }}>{event.venue_name}</span>
            </div>
          )}
          {event.dress_code && (
            <p className="text-xs mt-1" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>Dress code: {event.dress_code}</p>
          )}
        </div>
        {event.description && (
          <p className="text-sm mt-3 line-clamp-2" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>{event.description}</p>
        )}
      </div>
    </div>
  );
}

// ─── Content section preview (story, faq, travel, etc.) ───
export function ContentSectionPreview({ title, body, imageUrl, theme, sectionLabel }: { title?: string | null; body?: string | null; imageUrl?: string | null; theme: ThemeConfig; sectionLabel?: string }) {
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  return (
    <div className="px-6 py-8" style={cssVars}>
      {sectionLabel && (
        <p className="text-xs uppercase tracking-[0.2em] text-center mb-2" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>{sectionLabel}</p>
      )}
      {title && (
        <h2 className="font-serif text-2xl text-center mb-4" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}>{title}</h2>
      )}
      {imageUrl && (
        <img src={imageUrl} alt="" className="w-full max-w-md mx-auto rounded-lg mb-4" style={{ borderRadius: "var(--ui-radius)" }} />
      )}
      {body && (
        <p className="text-sm max-w-md mx-auto whitespace-pre-line" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)", lineHeight: 1.7 }}>{body}</p>
      )}
    </div>
  );
}

// ─── Gallery preview ───
export function GalleryPreview({ images, theme }: { images: { image_url: string; caption?: string | null; is_featured?: boolean }[]; theme: ThemeConfig }) {
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  return (
    <div className="px-4 py-6" style={cssVars}>
      <div className="grid grid-cols-2 gap-2">
        {images.slice(0, 6).map((img, i) => (
          <div key={i} className="aspect-square rounded-lg overflow-hidden" style={{ borderRadius: "var(--ui-radius)" }}>
            <img src={img.image_url} alt={img.caption ?? ""} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      {images.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>No images yet</p>
        </div>
      )}
    </div>
  );
}

// ─── Nav preview ───
export function NavPreview({ theme, items }: { theme: ThemeConfig; items: string[] }) {
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  return (
    <div className="px-4 py-3 border-b" style={{ ...cssVars, background: "var(--c-navBg)", borderColor: "var(--c-secondary)" }}>
      <div className="flex items-center justify-between">
        <span className="font-serif text-sm" style={{ color: "var(--c-navText)", fontFamily: "var(--f-heading)" }}>Names</span>
        <div className="hidden md:flex gap-3">
          {items.map((item) => (
            <span key={item} className="text-xs" style={{ color: "var(--c-navText)", fontFamily: "var(--f-body)" }}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Footer preview ───
export function FooterPreview({ theme, hashtag, date }: { theme: ThemeConfig; hashtag?: string | null; date?: string | null }) {
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  return (
    <div className="px-6 py-6 text-center" style={{ ...cssVars, background: "var(--c-footerBg)" }}>
      {hashtag && <p className="font-serif text-lg mb-1" style={{ color: "var(--c-footerText)", fontFamily: "var(--f-heading)" }}>{hashtag}</p>}
      {date && <p className="text-xs" style={{ color: "var(--c-footerText)", opacity: 0.7, fontFamily: "var(--f-body)" }}>{formatDate(date)}</p>}
    </div>
  );
}
