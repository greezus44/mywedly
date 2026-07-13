import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import type { CSSProperties } from "react";
import type { UserEvent } from "../../lib/supabase";
import { formatDate, formatTime } from "../../lib/utils";
import type { Lang } from "./rusty-layout";

const CREAM = "#F5ECD7";
const GOLD = "#B8962E";
const TEXT = "#3D3528";
const TEXT_MUTED = "#8B7355";
const BORDER = "#D4C695";

interface OutletContext {
  event: UserEvent;
  eventId: string;
}

export function RustyHome() {
  const { event, eventId } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>("en");

  const content = event.content || {};
  const invitationTitle = content.invitation_title || "You're Invited";
  const invitationSubtitle = content.invitation_subtitle || "We would be honoured by your presence";
  const invitationBody = content.invitation_body || content.invitation_text || "";
  const story = content.story || "";
  const storyImage = content.story_image;
  const rsvpButtonText = content.rsvp_button_text || "RSVP";

  const t = {
    en: {
      when: "When",
      time: "Time",
      where: "Where",
      ourStory: "Our Story",
      rsvp: rsvpButtonText,
    },
    bm: {
      when: "Bila",
      time: "Masa",
      where: "Di Mana",
      ourStory: "Kisah Kami",
      rsvp: rsvpButtonText,
    },
  }[lang];

  const dividerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
  };

  return (
    <div className="max-w-2xl mx-auto py-6" style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT }}>
      <div className="flex justify-end mb-4">
        <div className="flex gap-2">
          {(["en", "bm"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="px-3 py-1 text-xs tracking-wider uppercase transition-all"
              style={{
                fontFamily: '"Inter", sans-serif',
                color: lang === l ? CREAM : GOLD,
                backgroundColor: lang === l ? GOLD : "transparent",
                border: `1px solid ${GOLD}`,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <section className="text-center mb-12">
        <div style={dividerStyle} className="mb-4">
          <span className="block h-px w-12" style={{ backgroundColor: GOLD }} />
          <span className="text-xs tracking-[0.3em] uppercase" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
            {event.event_type}
          </span>
          <span className="block h-px w-12" style={{ backgroundColor: GOLD }} />
        </div>

        <h1 className="text-4xl md:text-5xl mb-3" style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT }}>
          {invitationTitle}
        </h1>
        <p className="text-lg md:text-xl italic" style={{ color: TEXT_MUTED }}>
          {invitationSubtitle}
        </p>

        {invitationBody && (
          <p className="mt-6 text-base md:text-lg leading-relaxed max-w-md mx-auto" style={{ color: TEXT }}>
            {invitationBody}
          </p>
        )}
      </section>

      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="py-4" style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
            <div className="text-xs tracking-[0.2em] uppercase mb-2" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
              {t.when}
            </div>
            <div className="text-base" style={{ color: TEXT }}>
              {formatDate(event.event_date) || "TBD"}
            </div>
          </div>
          <div className="py-4" style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
            <div className="text-xs tracking-[0.2em] uppercase mb-2" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
              {t.time}
            </div>
            <div className="text-base" style={{ color: TEXT }}>
              {formatTime(event.event_time) || "TBD"}
            </div>
          </div>
          <div className="py-4" style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
            <div className="text-xs tracking-[0.2em] uppercase mb-2" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
              {t.where}
            </div>
            <div className="text-base" style={{ color: TEXT }}>
              {event.venue || "TBD"}
            </div>
            {event.address && (
              <div className="text-sm mt-1" style={{ color: TEXT_MUTED }}>
                {event.address}
              </div>
            )}
          </div>
        </div>
      </section>

      {story && (
        <section className="mb-12 text-center">
          <div style={dividerStyle} className="mb-6">
            <span className="block h-px w-8" style={{ backgroundColor: GOLD }} />
            <span className="text-xs tracking-[0.3em] uppercase" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
              {t.ourStory}
            </span>
            <span className="block h-px w-8" style={{ backgroundColor: GOLD }} />
          </div>
          {storyImage && (
            <img
              src={storyImage}
              alt="Our Story"
              className="w-full rounded-sm mb-6 max-h-80 object-cover"
              style={{ border: `1px solid ${BORDER}` }}
            />
          )}
          <p className="text-base md:text-lg leading-relaxed italic max-w-md mx-auto" style={{ color: TEXT }}>
            {story}
          </p>
        </section>
      )}

      <section className="text-center pb-8">
        <button
          onClick={() => navigate(`/${eventId}/rsvp`)}
          className="px-12 py-3 text-sm tracking-[0.2em] uppercase transition-all hover:opacity-80"
          style={{
            backgroundColor: GOLD,
            color: CREAM,
            fontFamily: '"Inter", sans-serif',
            border: `1px solid ${GOLD}`,
          }}
        >
          {t.rsvp}
        </button>
      </section>
    </div>
  );
}

export default RustyHome;
