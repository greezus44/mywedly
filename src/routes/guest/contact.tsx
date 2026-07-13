import { CSSProperties } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import { Wedding } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, DEFAULT_THEME } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/index";

interface OutletContext {
  wedding: Wedding;
}

/**
 * GuestContact — the contact information page.
 *
 * Displays the contact phone, email, and address from the wedding content.
 * If an address is present, a "Get Directions" link opens Google Maps.
 */
export default function GuestContact() {
  const { wedding } = useOutletContext<OutletContext>();
  const { weddingId: authWeddingId } = useGuestAuth();
  const { weddingId: paramWeddingId } = useParams<{ weddingId: string }>();
  const navigate = useNavigate();
  const { t } = useLang();

  const weddingId = authWeddingId || paramWeddingId || wedding.id;
  const themeVars = themeToCssVars(wedding.theme || DEFAULT_THEME) as CSSProperties;
  const content = wedding.content;

  const phone = content?.contact_phone || "";
  const email = content?.contact_email || "";
  const address = content?.contact_address || "";

  const hasContactInfo = phone || email || address;

  const directionsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  if (!content?.contact_enabled) {
    return (
      <div style={themeVars} className="min-h-[60vh] flex items-center justify-center px-4">
        <ErrorState
          message="This page is not available"
          onRetry={() => navigate(`/${weddingId}/home`)}
        />
      </div>
    );
  }

  return (
    <div style={themeVars} className="pb-12">
      <section className="py-12 px-4" style={{ paddingBlock: "var(--wed-section-padding)" }}>
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl sm:text-4xl mb-3"
              style={{ fontFamily: "var(--wed-heading-font)", color: "var(--wed-heading-color)" }}
            >
              {t("contact")}
            </h1>
            <p className="text-sm opacity-70" style={{ color: "var(--wed-body-color)" }}>
              Get in touch with us
            </p>
          </div>

          {!hasContactInfo ? (
            <div className="text-center py-12">
              <p className="text-sm opacity-60" style={{ color: "var(--wed-body-color)" }}>
                No contact information available.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Phone */}
              {phone && (
                <div
                  className="bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4"
                  style={{
                    background: "var(--wed-bg)",
                    border: "1px solid color-mix(in srgb, var(--wed-primary) 25%, transparent)",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "color-mix(in srgb, var(--wed-primary) 15%, transparent)" }}
                  >
                    <Phone className="w-5 h-5" style={{ color: "var(--wed-primary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs uppercase tracking-[0.2em] mb-1 opacity-60"
                      style={{ color: "var(--wed-body-color)" }}
                    >
                      {t("phone")}
                    </p>
                    <a
                      href={`tel:${phone}`}
                      className="text-base font-medium hover:underline"
                      style={{ color: "var(--wed-heading-color)" }}
                    >
                      {phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Email */}
              {email && (
                <div
                  className="bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4"
                  style={{
                    background: "var(--wed-bg)",
                    border: "1px solid color-mix(in srgb, var(--wed-primary) 25%, transparent)",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "color-mix(in srgb, var(--wed-primary) 15%, transparent)" }}
                  >
                    <Mail className="w-5 h-5" style={{ color: "var(--wed-primary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs uppercase tracking-[0.2em] mb-1 opacity-60"
                      style={{ color: "var(--wed-body-color)" }}
                    >
                      {t("email")}
                    </p>
                    <a
                      href={`mailto:${email}`}
                      className="text-base font-medium hover:underline break-words"
                      style={{ color: "var(--wed-heading-color)" }}
                    >
                      {email}
                    </a>
                  </div>
                </div>
              )}

              {/* Address */}
              {address && (
                <div
                  className="bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4"
                  style={{
                    background: "var(--wed-bg)",
                    border: "1px solid color-mix(in srgb, var(--wed-primary) 25%, transparent)",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "color-mix(in srgb, var(--wed-primary) 15%, transparent)" }}
                  >
                    <MapPin className="w-5 h-5" style={{ color: "var(--wed-primary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs uppercase tracking-[0.2em] mb-1 opacity-60"
                      style={{ color: "var(--wed-body-color)" }}
                    >
                      {t("address")}
                    </p>
                    <p
                      className="text-base font-medium"
                      style={{ color: "var(--wed-heading-color)" }}
                    >
                      {address}
                    </p>
                  </div>
                </div>
              )}

              {/* Get Directions */}
              {directionsUrl && (
                <div className="pt-2">
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                    <Button
                      size="lg"
                      className="w-full"
                      style={{
                        background: "var(--wed-button-bg)",
                        color: "var(--wed-button-text)",
                        borderRadius: "var(--wed-button-radius)",
                        border: "none",
                      }}
                    >
                      <MapPin className="w-4 h-4" />
                      {t("getDirections")}
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </Button>
                  </a>
                </div>
              )}

              {/* Venue info if available */}
              {wedding.venue && wedding.venue !== address && (
                <div className="text-center pt-4">
                  <p
                    className="text-xs uppercase tracking-[0.2em] mb-1 opacity-50"
                    style={{ color: "var(--wed-body-color)" }}
                  >
                    Venue
                  </p>
                  <p className="text-sm" style={{ color: "var(--wed-heading-color)" }}>
                    {wedding.venue}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Back button */}
          <div className="text-center mt-8">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate(`/${weddingId}/home`)}
              style={{
                borderColor: "color-mix(in srgb, var(--wed-primary) 30%, transparent)",
                color: "var(--wed-body-color)",
              }}
            >
              {t("backToHome")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
