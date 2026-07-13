import { useState, useEffect, CSSProperties } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { Wedding } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, DEFAULT_THEME } from "../../lib/theme";
import { cn, formatDate, formatTime, getCountdown } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

interface OutletContext {
  wedding: Wedding;
}

/**
 * GuestHome — the main guest-facing home page.
 *
 * Shows the wedding details (names, date, time, venue), the couple's story,
 * a gallery, and a live countdown timer. Provides navigation links to the
 * RSVP, Doa, Send Message, and Contact pages.
 */
export default function GuestHome() {
  const { wedding } = useOutletContext<OutletContext>();
  const { weddingId: authWeddingId } = useGuestAuth();
  const { weddingId: paramWeddingId } = useParams<{ weddingId: string }>();
  const navigate = useNavigate();
  const { t } = useLang();

  const weddingId = authWeddingId || paramWeddingId || wedding.id;
  const [countdown, setCountdown] = useState(() => getCountdown(wedding.wedding_date));

  // Live countdown ticker
  useEffect(() => {
    if (!wedding.wedding_date) return;
    setCountdown(getCountdown(wedding.wedding_date));
    const interval = setInterval(() => {
      setCountdown(getCountdown(wedding.wedding_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [wedding.wedding_date]);

  const themeVars = themeToCssVars(wedding.theme || DEFAULT_THEME) as CSSProperties;
  const content = wedding.content;
  const gallery = content?.gallery || [];
  const galleryTitles = content?.gallery_titles || [];

  const navLinks = [
    { label: t("rsvp"), path: `/${weddingId}/rsvp`, enabled: true },
    { label: t("doa"), path: `/${weddingId}/doa`, enabled: content?.doa_enabled },
    { label: t("sendMessage"), path: `/${weddingId}/send-message`, enabled: content?.message_enabled },
    { label: t("contact"), path: `/${weddingId}/contact`, enabled: content?.contact_enabled },
  ].filter((l) => l.enabled);

  return (
    <div style={themeVars} className="pb-12">
      {/* Hero / Header section */}
      <section
        className="text-center py-16 px-4"
        style={{ paddingBlock: "var(--wed-section-padding)" }}
      >
        <p
          className="text-xs uppercase tracking-[0.4em] mb-4 opacity-60"
          style={{ fontFamily: "var(--wed-body-font)", color: "var(--wed-body-color)" }}
        >
          {t("saveTheDate")}
        </p>
        <h1
          className="text-4xl sm:text-5xl md:text-6xl leading-tight"
          style={{ fontFamily: "var(--wed-script-font)", color: "var(--wed-heading-color)" }}
        >
          {wedding.groom_name}
        </h1>
        <p
          className="my-3 text-xl opacity-50"
          style={{ fontFamily: "var(--wed-heading-font)", color: "var(--wed-heading-color)" }}
        >
          &
        </p>
        <h1
          className="text-4xl sm:text-5xl md:text-6xl leading-tight"
          style={{ fontFamily: "var(--wed-script-font)", color: "var(--wed-heading-color)" }}
        >
          {wedding.bride_name}
        </h1>

        {/* Parents */}
        {(wedding.groom_parents || wedding.bride_parents) && (
          <div
            className="mt-8 text-sm opacity-60 space-y-1"
            style={{ fontFamily: "var(--wed-body-font)", color: "var(--wed-body-color)" }}
          >
            {wedding.groom_parents && <p>{wedding.groom_parents}</p>}
            {wedding.bride_parents && <p>{wedding.bride_parents}</p>}
          </div>
        )}
      </section>

      {/* Countdown */}
      {wedding.wedding_date && !countdown.expired && (
        <section
          className="text-center py-12 px-4"
          style={{
            background: "color-mix(in srgb, var(--wed-primary) 8%, transparent)",
            borderTop: "1px solid color-mix(in srgb, var(--wed-primary) 20%, transparent)",
            borderBottom: "1px solid color-mix(in srgb, var(--wed-primary) 20%, transparent)",
          }}
        >
          <p
            className="text-xs uppercase tracking-[0.3em] mb-6 opacity-60"
            style={{ fontFamily: "var(--wed-body-font)", color: "var(--wed-body-color)" }}
          >
            {t("saveTheDate")}
          </p>
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <CountdownUnit value={countdown.days} label={t("days")} />
            <Sep />
            <CountdownUnit value={countdown.hours} label={t("hours")} />
            <Sep />
            <CountdownUnit value={countdown.minutes} label={t("minutes")} />
            <Sep />
            <CountdownUnit value={countdown.seconds} label={t("seconds")} />
          </div>
        </section>
      )}

      {/* Event details */}
      <section className="py-16 px-4" style={{ paddingBlock: "var(--wed-section-padding)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-2xl sm:text-3xl mb-8"
            style={{ fontFamily: "var(--wed-heading-font)", color: "var(--wed-heading-color)" }}
          >
            {t("ourWedding")}
          </h2>

          <div className="space-y-4">
            {wedding.wedding_date && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] opacity-50 mb-1" style={{ color: "var(--wed-body-color)" }}>
                  {t("saveTheDate")}
                </p>
                <p className="text-lg" style={{ fontFamily: "var(--wed-heading-font)", color: "var(--wed-heading-color)" }}>
                  {formatDate(wedding.wedding_date)}
                </p>
                {wedding.wedding_time && (
                  <p className="text-sm mt-1 opacity-70" style={{ color: "var(--wed-body-color)" }}>
                    {formatTime(wedding.wedding_time)}
                  </p>
                )}
              </div>
            )}

            {wedding.venue && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] opacity-50 mb-1" style={{ color: "var(--wed-body-color)" }}>
                  {t("address")}
                </p>
                <p className="text-lg" style={{ fontFamily: "var(--wed-heading-font)", color: "var(--wed-heading-color)" }}>
                  {wedding.venue}
                </p>
                {wedding.address && (
                  <p className="text-sm mt-1 opacity-70" style={{ color: "var(--wed-body-color)" }}>
                    {wedding.address}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Our Story */}
      {content?.story && (
        <section
          className="py-16 px-4"
          style={{
            paddingBlock: "var(--wed-section-padding)",
            background: "color-mix(in srgb, var(--wed-primary) 5%, transparent)",
          }}
        >
          <div className="max-w-2xl mx-auto">
            <h2
              className="text-2xl sm:text-3xl mb-8 text-center"
              style={{ fontFamily: "var(--wed-heading-font)", color: "var(--wed-heading-color)" }}
            >
              {t("ourStory")}
            </h2>
            {content.story_image && (
              <img
                src={content.story_image}
                alt="Our story"
                className="w-full max-h-80 object-cover rounded-lg mb-8"
              />
            )}
            <p
              className="text-base leading-relaxed whitespace-pre-line text-center"
              style={{ fontFamily: "var(--wed-body-font)", color: "var(--wed-body-color)" }}
            >
              {content.story}
            </p>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="py-16 px-4" style={{ paddingBlock: "var(--wed-section-padding)" }}>
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-2xl sm:text-3xl mb-8 text-center"
              style={{ fontFamily: "var(--wed-heading-font)", color: "var(--wed-heading-color)" }}
            >
              {t("gallery")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                  <img
                    src={img}
                    alt={galleryTitles[i] || `Photo ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Navigation links */}
      {navLinks.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-3">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                variant="outline"
                size="md"
                onClick={() => navigate(link.path)}
                style={{
                  borderColor: "var(--wed-primary)",
                  color: "var(--wed-heading-color)",
                  borderRadius: "var(--wed-button-radius)",
                }}
              >
                {link.label}
              </Button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div
        className="text-3xl sm:text-4xl font-light tabular-nums"
        style={{ fontFamily: "var(--wed-heading-font)", color: "var(--wed-heading-color)" }}
      >
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[10px] uppercase tracking-[0.2em] opacity-60 mt-1" style={{ color: "var(--wed-body-color)" }}>
        {label}
      </div>
    </div>
  );
}

function Sep() {
  return <div className="text-2xl opacity-30 -mt-4" style={{ color: "var(--wed-heading-color)" }}>:</div>;
}
