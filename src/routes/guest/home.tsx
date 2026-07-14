import { useNavigate } from "react-router-dom";
import { useGuestOutletContext } from "./guest-layout";
import { getTypographyText, getTypographyStyle } from "../../lib/typography";
import type { EventContent } from "../../components/preview/PreviewRenderers";

export default function GuestHome() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const navigate = useNavigate();
  const content = (event.content ?? {}) as EventContent;
  const sections = content.sections ?? ((content.heading !== undefined || content.body !== undefined) ? [{ heading: content.heading, body: content.body }] : []);
  const logo = content.logo;

  return (
    <div>
      {logo?.url && (
        <div style={{ paddingTop: logo.marginTop ? `${logo.marginTop}px` : undefined, paddingBottom: logo.marginBottom ? `${logo.marginBottom}px` : "1.5rem", display: "flex", justifyContent: "center" }}>
          <img src={logo.url} alt="" className="home-logo" style={{ maxWidth: logo.size ? `${logo.size}px` : "140px", height: "auto", width: "auto" }} />
        </div>
      )}
      {sections.length === 0 && !logo?.url && (
        <section className="guest-section text-center"><div className="mx-auto max-w-md"><p className="guest-subtitle">Welcome to {event.name}. Check back soon for updates.</p></div></section>
      )}
      {sections.map((section, i) => {
        const headingText = getTypographyText(section.heading, "");
        const headingStyle = getTypographyStyle(section.heading);
        return (
          <section key={i} className="guest-section">
            <div className="mx-auto max-w-3xl">
              {headingText && <h2 className="guest-title mb-4" style={headingStyle}>{headingText}</h2>}
              {section.body && <div className="rich-content" dangerouslySetInnerHTML={{ __html: section.body }} />}
            </div>
          </section>
        );
      })}
      {invitedSubEventIds.length > 0 && (
        <section className="guest-section text-center"><button onClick={() => navigate(`/e/${slug}/rsvp`)} className="event-btn-primary">RSVP Now</button></section>
      )}
    </div>
  );
}
