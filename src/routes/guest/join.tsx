import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventGuest, type Json } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { useSignInGuest } from "../../lib/guest-auth";
import { LanguageToggle } from "../../components/site/LanguageToggle";
import { useLanguage } from "../../lib/language";
import { setCurrentLanguage } from "../../lib/translations";
import { formatDateLong, formatTime12 } from "../../lib/utils";
import { buttonColorsToStyle, buttonColorsToHoverStyle, type ButtonColors } from "../../components/ui/ButtonColourEditor";

interface PageConfig {
  heading?: string;
  intro?: string;
  nameLabel?: string;
  attendingLabel?: string;
  decliningLabel?: string;
  plusOneLabel?: string;
  plusOnePlaceholder?: string;
  submitLabel?: string;
  thankYouAttending?: string;
  thankYouDeclined?: string;
  namePlaceholder?: string;
}

interface LookupResult {
  link: {
    id: string;
    token: string;
    event_id: string;
    sub_event_id: string;
    allow_plus_one: boolean;
    is_enabled: boolean;
    page_config: Json;
  };
  sub_event: {
    id: string;
    name: string;
    name_bm: string | null;
    date: string | null;
    time: string | null;
    start_time: string | null;
    end_time: string | null;
    venue: string | null;
    address: string | null;
    description: string | null;
    rsvp_deadline: string | null;
  };
  event: {
    id: string;
    slug: string;
    name: string;
    name_bm: string | null;
    theme: Json;
    login_config: Json | null;
  };
}

type Step = "form" | "done";

export default function GuestJoin() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  setCurrentLanguage(language);
  const signInGuest = useSignInGuest();

  const [name, setName] = useState("");
  const [status, setStatus] = useState<"attending" | "declined" | "">("");
  const [plusOneName, setPlusOneName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>("form");

  const { data: lookup, isLoading } = useQuery({
    queryKey: ["open-rsvp-lookup", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("open_rsvp_lookup", { p_token: token! });
      if (error) throw error;
      return (data ?? null) as LookupResult | null;
    },
    enabled: !!token,
  });

  const pageConfig = (lookup?.link?.page_config ?? {}) as PageConfig;
  const subEvent = lookup?.sub_event;
  const event = lookup?.event;
  const allowPlusOne = lookup?.link?.allow_plus_one ?? false;
  const loginConfig = (event?.login_config ?? {}) as { buttonColors?: ButtonColors };
  const buttonColors = loginConfig.buttonColors;
  const btnStyle = buttonColorsToStyle(buttonColors);
  const btnHoverStyle = buttonColorsToHoverStyle(buttonColors);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !lookup) return;
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!status) { setError("Please choose Attending or Declined."); return; }
    setError(null);
    setSubmitting(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("open_rsvp_register", {
        p_token: token,
        p_name: name.trim(),
        p_status: status,
        p_plus_one_name: status === "attending" && allowPlusOne ? plusOneName.trim() : "",
      });
      if (rpcError) throw rpcError;
      const result = (data ?? {}) as { error?: string; guest?: EventGuest; event_slug?: string };
      if (result.error) {
        const messages: Record<string, string> = {
          link_not_found: "This link is no longer available.",
          invalid_name: "Please enter a valid name.",
          invalid_status: "Please choose Attending or Declined.",
          invalid_plus_one_name: "Please enter a valid +1 name.",
        };
        setError(messages[result.error] ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      if (result.guest && result.event_slug) {
        signInGuest(result.guest.event_id, result.guest);
        setStep("done");
      }
    } catch {
      setError("We couldn't submit your RSVP. Please try again.");
    }
    setSubmitting(false);
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-dash-bg"><div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
  if (!lookup || !subEvent || !event) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center"><h1 className="text-2xl font-bold text-dash-text">Link Not Found</h1><p className="text-dash-muted">This RSVP link could not be found or is no longer available.</p><Link to="/" className="text-dash-primary hover:underline">Return home</Link></div>;

  const heading = pageConfig.heading || (language === "bm" ? `RSVP — ${subEvent.name_bm || subEvent.name}` : `RSVP — ${subEvent.name}`);
  const intro = pageConfig.intro || "";
  const nameLabel = pageConfig.nameLabel || "Your Name";
  const namePlaceholder = pageConfig.namePlaceholder || "Enter your full name";
  const attendingLabel = pageConfig.attendingLabel || "Attending";
  const decliningLabel = pageConfig.decliningLabel || "Declined";
  const plusOneLabel = pageConfig.plusOneLabel || "Bringing a +1? Enter their name";
  const plusOnePlaceholder = pageConfig.plusOnePlaceholder || "+1 full name";
  const submitLabel = pageConfig.submitLabel || "Submit RSVP";
  const thankYou = status === "attending"
    ? (pageConfig.thankYouAttending || "Thank you! We look forward to seeing you.")
    : (pageConfig.thankYouDeclined || "Thank you for letting us know.");

  if (step === "done") {
    return (
      <EventThemeProvider theme={event.theme}>
        <LanguageToggle />
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-md text-center">
            <h1 className="guest-title mb-4">{thankYou}</h1>
            <button
              type="button"
              onClick={() => navigate(`/e/${event.slug}/home`, { replace: true })}
              className="event-btn-primary"
            >
              {language === "bm" ? "Lihat jemputan" : "View Invitation"}
            </button>
          </div>
        </div>
      </EventThemeProvider>
    );
  }

  const dateStr = subEvent.date ? formatDateLong(subEvent.date) : null;
  const timeStr = subEvent.time || subEvent.start_time || null;

  return (
    <EventThemeProvider theme={event.theme}>
      <LanguageToggle />
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="guest-title mb-2">{heading}</h1>
            {intro && <p className="guest-subtitle" style={{ whiteSpace: "pre-wrap" }}>{intro}</p>}
          </div>

          <div className="mb-8 rounded-lg p-4 text-center" style={{ backgroundColor: "var(--event-surface)", border: "1px solid var(--event-border)" }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>
              {language === "bm" ? (subEvent.name_bm?.trim() || subEvent.name) : subEvent.name}
            </h2>
            {dateStr && <p className="text-sm" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)", textTransform: "uppercase" }}>{dateStr}</p>}
            {timeStr && <p className="text-sm" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>{formatTime12(timeStr)}</p>}
            {subEvent.venue && <p className="text-sm" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>{subEvent.venue}</p>}
            {subEvent.address && <p className="text-xs" style={{ color: "var(--event-muted)", fontFamily: "var(--event-font-body)" }}>{subEvent.address}</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-center text-sm font-medium" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>{nameLabel}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="event-input"
                placeholder={namePlaceholder}
                required
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                style={{ textAlign: "center", fontFamily: "var(--event-font-heading)" }}
              />
            </div>

            <div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("attending")}
                  className="event-btn-primary rsvp-toggle-btn"
                  style={{ flex: 1, opacity: status === "attending" ? 1 : 0.6, ...btnStyle }}
                  onMouseEnter={(e) => { if (status === "attending") Object.assign(e.currentTarget.style, btnHoverStyle); }}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, btnStyle)}
                >
                  {attendingLabel}
                </button>
                <button
                  type="button"
                  onClick={() => { setStatus("declined"); setPlusOneName(""); }}
                  className="event-btn-secondary rsvp-toggle-btn"
                  style={{ flex: 1, opacity: status === "declined" ? 1 : 0.6 }}
                >
                  {decliningLabel}
                </button>
              </div>
            </div>

            {allowPlusOne && status === "attending" && (
              <div className="animate-fadeIn">
                <label className="mb-1.5 block text-center text-sm font-medium" style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>{plusOneLabel}</label>
                <input
                  type="text"
                  value={plusOneName}
                  onChange={(e) => setPlusOneName(e.target.value)}
                  className="event-input"
                  placeholder={plusOnePlaceholder}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{ textAlign: "center", fontFamily: "var(--event-font-heading)" }}
                />
              </div>
            )}

            {error && <p className="text-center text-sm" style={{ color: "var(--event-primary)" }}>{error}</p>}
            <div className="h-4" />
            <div className="text-center">
              <button type="submit" disabled={submitting || !status || !name.trim()} className="event-btn-primary" style={{ opacity: submitting || !status || !name.trim() ? 0.6 : 1, ...btnStyle }} onMouseEnter={(e) => { if (!submitting && status && name.trim()) Object.assign(e.currentTarget.style, btnHoverStyle); }} onMouseLeave={(e) => Object.assign(e.currentTarget.style, btnStyle)}>
                {submitting ? (language === "bm" ? "Menghantar..." : "Submitting...") : submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </EventThemeProvider>
  );
}
