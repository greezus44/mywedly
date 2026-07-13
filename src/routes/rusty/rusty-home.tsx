import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { UserEvent } from "../../lib/supabase";
import { formatDate, formatTime } from "../../lib/utils";
import type { Lang } from "./rusty-layout";
import type { CSSProperties } from "react";

interface OutletContext {
  event: UserEvent;
  lang: Lang;
}

const content = {
  en: {
    ourStory: "Our Story",
    eventDetails: "Event Details",
    date: "Date",
    time: "Time",
    venue: "Venue",
    address: "Address",
    rsvpNow: "RSVP Now",
    switchLang: "Bahasa Melayu",
  },
  bm: {
    ourStory: "Kisah Kami",
    eventDetails: "Butiran Acara",
    date: "Tarikh",
    time: "Masa",
    venue: "Tempat",
    address: "Alamat",
    rsvpNow: "RSVP Sekarang",
    switchLang: "English",
  },
};

export default function RustyHome() {
  const { event, lang } = useOutletContext<OutletContext>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const t = content[lang];

  const c = event.content || ({} as any);
  const invitationTitle = c.invitation_title || "Our Wedding";
  const invitationSubtitle = c.invitation_subtitle || "We invite you to celebrate with us";
  const invitationBody = c.invitation_body || "";
  const invitationText = c.invitation_text || "";
  const rsvpButtonText = c.rsvp_button_text || t.rsvpNow;
  const story = c.story || "";
  const storyImage = c.story_image || "";

  const eventDate = event.draft_event_date || event.event_date;
  const eventTime = event.draft_event_time || event.event_time;
  const venue = event.draft_venue || event.venue;
  const address = event.draft_address || event.address;

  const sectionStyle: CSSProperties = {
    maxWidth: "var(--max-width)",
  margin: "0 auto",
  paddingTop: "var(--section-padding)",
    paddingBottom: "var(--section-padding)",
  color: "var(--body-color)",
  fontFamily: "var(--body-font)",
  textAlign: "center",
  marginLeft: "auto",
    marginRight: "auto",
  paddingLeft: "24px",
    paddingRight: "24px",
  width: "100%",
  };

  const headingStyle: CSSProperties = {
    color: "var(--heading-color)",
    fontFamily: "var(--heading-font)",
  };

  const toggleLang = () => {
    const newLang = lang === "en" ? "bm" : "en";
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("lang", newLang);
    navigate(`/${eventId}/home?${searchParams.toString()}`, { replace: true });
    window.location.reload();
  };

  return (
    <div>
      <section style={sectionStyle}>
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="h-px w-10 bg-[#C4A44A]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">✦</span>
          <span className="h-px w-10 bg-[#C4A44A]" />
        </div>

        <h1
          className="text-3xl sm:text-4xl font-medium leading-tight mb-3"
          style={headingStyle}
        >
          {invitationTitle}
        </h1>
        <p
          className="text-base mb-4 text-[#A07820]"
          style={{ fontFamily: "var(--script-font)" }}
        >
          {invitationSubtitle}
        </p>

        {invitationBody && (
          <p className="text-sm leading-relaxed max-w-prose mx-auto mb-4">
            {invitationBody}
          </p>
        )}

        {invitationText && (
          <p className="text-sm italic text-[#A07820]" style={{ fontFamily: "var(--script-font)" }}>
            {invitationText}
          </p>
        )}

        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="h-px w-10 bg-[#C4A44A]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">✦</span>
          <span className="h-px w-10 bg-[#C4A44A]" />
        </div>
      </section>

      {(eventDate || eventTime || venue) && (
        <section style={{ ...sectionStyle, paddingTop: 0, paddingBottom: 0 }}>
          <div
            className="rounded-lg p-8 border"
            style={{
              borderColor: "#C4A44A",
              borderWidth: "1px",
              borderStyle: "solid",
              backgroundColor: "rgba(196, 164, 74, 0.05)",
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="h-px w-8 bg-[#C4A44A]/50" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">{t.eventDetails}</span>
              <span className="h-px w-8 bg-[#C4A44A]/50" />
            </div>

            <div className="space-y-4">
              {eventDate && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#C4A44A] mb-1">{t.date}</p>
                  <p className="text-sm" style={headingStyle}>{formatDate(eventDate)}</p>
                </div>
              )}
              {eventTime && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#C4A44A] mb-1">{t.time}</p>
                  <p className="text-sm" style={headingStyle}>{formatTime(eventTime)}</p>
                </div>
              )}
              {venue && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#C4A44A] mb-1">{t.venue}</p>
                  <p className="text-sm" style={headingStyle}>{venue}</p>
                </div>
              )}
              {address && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#C4A44A] mb-1">{t.address}</p>
                  <p className="text-sm text-[#8B7355]">{address}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {story && (
        <section style={sectionStyle}>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="h-px w-8 bg-[#C4A44A]/50" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">{t.ourStory}</span>
            <span className="h-px w-8 bg-[#C4A44A]/50" />
          </div>

          {storyImage && (
            <img
              src={storyImage}
              alt="Our Story"
              className="w-full max-w-xs mx-auto h-48 object-cover rounded-lg mb-6"
              style={{ border: "1px solid #C4A44A" }}
            />
          )}

          <p className="text-sm leading-relaxed max-w-prose mx-auto whitespace-pre-line">
            {story}
          </p>
        </section>
      )}

      <section style={{ ...sectionStyle, paddingTop: 0 }}>
        <button
          onClick={() => navigate(`/${eventId}/rsvp`)}
          className="px-10 py-3 text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:tracking-[0.3em] border"
          style={{
            backgroundColor: "var(--button-bg)",
            color: "var(--button-text)",
            borderColor: "var(--button-bg)",
            borderRadius: "var(--button-radius)",
          }}
        >
          {rsvpButtonText}
        </button>

        <div className="mt-8">
          <button
            onClick={toggleLang}
            className="text-[11px] tracking-[0.15em] uppercase text-[#8B7355] hover:text-[#B8962E] transition-colors underline underline-offset-4"
          >
            {t.switchLang}
          </button>
        </div>
      </section>
    </div>
  );
}
