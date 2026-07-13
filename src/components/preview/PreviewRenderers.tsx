import React from "react";
import type { UserEvent } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { themeToEventCssVars } from "../../lib/theme";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12 } from "../../lib/utils";

export function CoverPreview({ event }: { event: UserEvent }) {
  const cfg = event.draft_cover_config || event.cover_config || {};
  const theme = event.draft_theme || event.theme;
  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="flex flex-col items-center justify-center text-center p-8" style={{ minHeight: 400 }}>
        {cfg.cover_image && <img src={cfg.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
        <div className="relative z-10">
          {cfg.logo_image && <img src={cfg.logo_image} alt="logo" className="w-20 h-20 mx-auto mb-4 rounded-full object-cover" />}
          <h1 className="text-3xl md:text-4xl font-serif mb-2" style={{ color: "var(--event-primary)" }}>{cfg.title || event.name}</h1>
          {cfg.subtitle && <p className="text-lg mb-4" style={{ color: "var(--event-muted)" }}>{cfg.subtitle}</p>}
          {cfg.date && <p className="text-base mb-1">{formatDate(cfg.date)}</p>}
          {cfg.time && <p className="text-base mb-1">{formatTime12(cfg.time)}</p>}
          {cfg.venue && <p className="text-base">{cfg.venue}</p>}
        </div>
      </div>
    </EventThemeProvider>
  );
}

export function LoginPreview({ event }: { event: UserEvent }) {
  const cfg = event.draft_login_config || event.login_config || {};
  const theme = event.draft_theme || event.theme;
  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="flex flex-col items-center justify-center text-center p-8" style={{ minHeight: 400 }}>
        {cfg.background_image && <img src={cfg.background_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
        <div className="relative z-10">
          {cfg.logo_image && <img src={cfg.logo_image} alt="logo" className="w-16 h-16 mx-auto mb-4 rounded-full object-cover" />}
          <h2 className="text-2xl font-serif mb-2" style={{ color: "var(--event-primary)" }}>{cfg.heading || "Sign In"}</h2>
          {cfg.subheading && <p className="text-sm mb-4" style={{ color: "var(--event-muted)" }}>{cfg.subheading}</p>}
          <div className="space-y-2">
            <div className="px-4 py-2 border rounded-lg bg-white/50 text-sm" style={{ borderColor: "var(--event-border)" }}>Enter your name</div>
            <div className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: "var(--event-primary)" }}>Sign In</div>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}

export function HomePreview({ event }: { event: UserEvent }) {
  const content = event.draft_content || event.content || {};
  const theme = event.draft_theme || event.theme;
  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="p-8" style={{ minHeight: 400 }}>
        {content.title && <RichTextContent html={content.title} className="text-3xl font-serif text-center mb-4" />}
        {content.subtitle && <RichTextContent html={content.subtitle} className="text-lg text-center mb-4" />}
        {content.body && <RichTextContent html={content.body} className="text-base leading-relaxed" />}
      </div>
    </EventThemeProvider>
  );
}

export function RsvpPreview({ event }: { event: UserEvent }) {
  const theme = event.draft_theme || event.theme;
  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="p-8" style={{ minHeight: 400 }}>
        <h2 className="text-2xl font-serif text-center mb-6" style={{ color: "var(--event-primary)" }}>RSVP</h2>
        <div className="space-y-4 max-w-md mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 p-3 border rounded-lg text-center text-sm" style={{ borderColor: "var(--event-border)" }}>Joyfully Accept</div>
            <div className="flex-1 p-3 border rounded-lg text-center text-sm" style={{ borderColor: "var(--event-border)" }}>Regretfully Decline</div>
          </div>
          <div className="p-3 border rounded-lg text-sm" style={{ borderColor: "var(--event-border)" }}>Number of Guests: 1</div>
          <div className="w-full p-3 rounded-lg text-center text-sm text-white" style={{ background: "var(--event-primary)" }}>Submit RSVP</div>
        </div>
      </div>
    </EventThemeProvider>
  );
}
