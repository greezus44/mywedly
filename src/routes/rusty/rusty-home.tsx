import { useState, useEffect } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { Calendar, Clock, MapPin, Globe } from "lucide-react";
import { useGuestAuth } from "../../lib/guest-auth";
import { RUSTY_CONTENT, RUSTY_THEME } from "../../lib/theme";
import { formatDate, formatTime } from "../../lib/utils";
import type { Lang } from "./rusty-layout";
import type { UserEvent } from "../../lib/supabase";

const LANG_STORAGE_KEY = "guest-lang";

interface OutletContext {
  event: UserEvent;
  lang: Lang;
}

export default function RustyHome() {
  const { event, lang } = useOutletContext<OutletContext>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { guestName } = useGuestAuth();
  const [currentLang, setCurrentLang] = useState<Lang>(lang);

  useEffect(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "en" || saved === "bm") setCurrentLang(saved);
  }, []);

  const toggleLang = () => {
    const next = currentLang === "en" ? "bm" : "en";
    setCurrentLang(next);
    localStorage.setItem(LANG_STORAGE_KEY, next);
  };

  const content = event.content;
  const theme = event.theme || RUSTY_THEME;
  const headingFont = theme.headingFont || "Cormorant Garamond";
  const scriptFont = theme.scriptFont || "Cormorant Garamond";

  const invitationTitle = content?.invitation_title || RUSTY_CONTENT.invitation_title!;
  const invitationSubtitle = content?.invitation_subtitle || RUSTY_CONTENT.invitation_subtitle!;
  const invitationBody = content?.invitation_body || RUSTY_CONTENT.invitation_body!;
  const story = content?.story || RUSTY_CONTENT.story!;
  const storyImage = content?.story_image;
  const rsvpButtonText = content?.rsvp_button_text || RUSTY_CONTENT.rsvp_button_text!;

  const t = {
    en: { dear: "Dear", storyTitle: "Our Story", when: "When", time: "Time", where: "Where", rsvp: "RSVP" },
    bm: { dear: "Kepada", storyTitle: "Kisah Kami", when: "Bila", time: "Masa", where: "Di Mana", rsvp: "RSVP" },
  }[currentLang];

  return (
    <div className="animate-fade-in">
      <div className="text-center py-8">
        <p className="font-serif text-sm italic text-rusty-gold-dark mb-3" style={{ fontFamily: `"${scriptFont}", serif` }}>
          {t.dear} {guestName || "Guest"},
        </p>

        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="h-px w-10 bg-rusty-gold-dark/40" />
          <span className="w-1.5 h-1.5 rounded-full bg-rusty-gold-dark" />
          <span className="h-px w-10 bg-rusty-gold-dark/40" />
        </div>

        <h1
          className="font-serif text-4xl md:text-5xl text-rusty-text mb-3"
          style={{ fontFamily: `"${headingFont}", serif` }}
        >
          {invitationTitle}
        </h1>

        <p
          className="font-serif text-lg italic text-rusty-text-light"
          style={{ fontFamily: `"${scriptFont}", serif` }}
        >
          {invitationSubtitle}
        </p>
      </div>

      <div className="text-center py-6 border-y border-rusty-border/50">
        <p className="text-sm leading-relaxed text-rusty-text max-w-md mx-auto">
          {invitationBody}
        </p>
      </div>

      <div className="py-8 space-y-5">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-rusty-gold-dark flex-shrink-0" />
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-rusty-text-light">{t.when}</p>
            <p className="text-sm font-medium text-rusty-text">{formatDate(event.event_date) || "TBD"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-rusty-gold-dark flex-shrink-0" />
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-rusty-text-light">{t.time}</p>
            <p className="text-sm font-medium text-rusty-text">{formatTime(event.event_time) || "TBD"}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-rusty-gold-dark flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-rusty-text-light">{t.where}</p>
            <p className="text-sm font-medium text-rusty-text">{event.venue || "TBD"}</p>
            {event.address && <p className="text-xs text-rusty-text-light mt-0.5">{event.address}</p>}
          </div>
        </div>
      </div>

      {story && (
        <div className="py-8 border-t border-rusty-border/50">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="h-px w-8 bg-rusty-gold-dark/40" />
            <h2 className="font-serif text-xl text-rusty-text" style={{ fontFamily: `"${headingFont}", serif` }}>
              {t.storyTitle}
            </h2>
            <span className="h-px w-8 bg-rusty-gold-dark/40" />
          </div>
          {storyImage && (
            <img
              src={storyImage}
              alt="Our Story"
              className="w-full rounded-lg mb-5 object-cover"
              style={{ maxHeight: 240 }}
            />
          )}
          <p className="text-sm leading-relaxed text-rusty-text text-center italic" style={{ fontFamily: `"${scriptFont}", serif` }}>
            {story}
          </p>
        </div>
      )}

      <div className="py-8 text-center">
        <button
          onClick={() => navigate(`/${eventId}/rsvp`)}
          className="px-12 py-3 text-sm tracking-[0.2em] uppercase font-medium transition-all duration-300 hover:opacity-90"
          style={{
            backgroundColor: theme.primaryColor || "#B8962E",
            color: "#FAF3E0",
            borderRadius: "4px",
          }}
        >
          {rsvpButtonText}
        </button>
      </div>

      <div className="flex justify-center py-4">
        <button
          onClick={toggleLang}
          className="inline-flex items-center gap-1.5 text-xs text-rusty-text-light hover:text-rusty-text transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          {currentLang === "en" ? "Bahasa Melayu" : "English"}
        </button>
      </div>
    </div>
  );
}
