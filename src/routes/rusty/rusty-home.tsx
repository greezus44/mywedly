import { useNavigate, useParams } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { formatDate, formatTime } from "../../lib/utils";
import type { Lang } from "./rusty-layout";
import type { RustyOutletContext } from "./rusty-layout";
import type { CSSProperties } from "react";

const translations = {
  en: {
    when: "When",
    time: "Time",
    where: "Where",
    address: "Address",
    ourStory: "Our Story",
    rsvp: "RSVP",
    tbd: "To be announced",
  },
  bm: {
    when: "Bila",
    time: "Masa",
    where: "Di Mana",
    address: "Alamat",
    ourStory: "Kisah Kami",
    rsvp: "RSVP",
    tbd: "Akan ditentukan",
  },
};

export default function RustyHome() {
  const { event, lang } = useOutletContext<RustyOutletContext>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const t = translations[lang];

  if (!event) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-serif text-lg text-[#8B7355]">Event details unavailable.</p>
      </div>
    );
  }

  const content = event.content || event.draft_content || {};
  const cssVars = {} as CSSProperties;
  const invitationTitle = content.invitation_title || "You're Invited";
  const invitationSubtitle = content.invitation_subtitle || "We would be honoured by your presence";
  const invitationBody = content.invitation_body || content.invitation_text || "";
  const story = content.story || "";
  const storyImage = content.story_image || "";
  const rsvpText = content.rsvp_button_text || t.rsvp;

  const eventDate = event.draft_event_date || event.event_date;
  const eventTime = event.draft_event_time || event.event_time;
  const venue = event.draft_venue || event.venue;
  const address = event.draft_address || event.address;

  const handleRsvp = () => {
    if (eventId) navigate(`/${eventId}/rsvp`);
  };

  return (
    <div style={cssVars} className="animate-fade-in">
      <section className="px-6 py-16 text-center max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16" style={{ backgroundColor: "#B8962E" }} />
          <div className="w-2 h-2 rotate-45" style={{ backgroundColor: "#B8962E" }} />
          <div className="h-px w-16" style={{ backgroundColor: "#B8962E" }} />
        </div>

        <p
          className="font-serif italic text-lg mb-3"
          style={{ color: "#8B7355", fontFamily: '"Cormorant Garamond", serif' }}
        >
          {invitationSubtitle}
        </p>

        <h1
          className="font-serif text-4xl md:text-5xl font-light mb-6"
          style={{
            color: "#3D3528",
            fontFamily: '"Cormorant Garamond", serif',
          }}
        >
          {invitationTitle}
        </h1>

        {invitationBody && (
          <p
            className="text-base leading-relaxed max-w-lg mx-auto"
            style={{ color: "#3D3528" }}
          >
            {invitationBody}
          </p>
        )}

        <div className="flex items-center justify-center gap-4 mt-8">
          <div className="h-px w-20" style={{ backgroundColor: "#B8962E", opacity: 0.5 }} />
          <div className="h-px w-20" style={{ backgroundColor: "#B8962E", opacity: 0.5 }} />
        </div>
      </section>

      <section className="px-6 py-12 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <p
              className="font-serif text-sm tracking-[0.2em] uppercase"
              style={{ color: "#B8962E" }}
            >
              {t.when}
            </p>
            <p className="font-serif text-lg" style={{ color: "#3D3528" }}>
              {eventDate ? formatDate(eventDate) : t.tbd}
            </p>
          </div>

          <div className="space-y-2">
            <p
              className="font-serif text-sm tracking-[0.2em] uppercase"
              style={{ color: "#B8962E" }}
            >
              {t.time}
            </p>
            <p className="font-serif text-lg" style={{ color: "#3D3528" }}>
              {eventTime ? formatTime(eventTime) : t.tbd}
            </p>
          </div>

          <div className="space-y-2">
            <p
              className="font-serif text-sm tracking-[0.2em] uppercase"
              style={{ color: "#B8962E" }}
            >
              {t.where}
            </p>
            <p className="font-serif text-lg" style={{ color: "#3D3528" }}>
              {venue || t.tbd}
            </p>
            {address && (
              <p className="text-xs" style={{ color: "#8B7355" }}>
                {address}
              </p>
            )}
          </div>
        </div>
      </section>

      {story && (
        <section className="px-6 py-12 max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-12" style={{ backgroundColor: "#B8962E", opacity: 0.5 }} />
            <h2
              className="font-serif text-2xl font-light tracking-wide"
              style={{ color: "#3D3528", fontFamily: '"Cormorant Garamond", serif' }}
            >
              {t.ourStory}
            </h2>
            <div className="h-px w-12" style={{ backgroundColor: "#B8962E", opacity: 0.5 }} />
          </div>

          {storyImage && (
            <img
              src={storyImage}
              alt="Our story"
              className="w-full max-w-md mx-auto rounded-lg mb-8 object-cover"
              style={{ maxHeight: 320 }}
            />
          )}

          <p
            className="font-serif text-lg leading-relaxed italic max-w-lg mx-auto"
            style={{ color: "#3D3528", fontFamily: '"Cormorant Garamond", serif' }}
          >
            {story}
          </p>
        </section>
      )}

      <section className="px-6 py-12 max-w-2xl mx-auto text-center">
        <Button
          onClick={handleRsvp}
          size="lg"
          className="px-16 py-4 font-serif text-lg tracking-[0.3em] uppercase"
          style={{
            backgroundColor: "#B8962E",
            color: "#FAF3E0",
            border: "1px solid #B8962E",
          }}
        >
          {rsvpText}
        </Button>
      </section>
    </div>
  );
}
