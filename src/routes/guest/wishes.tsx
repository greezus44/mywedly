import { useState } from "react";
import { Navigate, useParams, useLocation, useNavigate } from "react-router-dom";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buttonColorsToStyle, buttonColorsToHoverStyle, type ButtonColors } from "../../components/ui/ButtonColourEditor";
import { getTypographyStyle, type TypographyStyle } from "../../lib/typography";
import { useLanguage } from "../../lib/language";
import { pickText, autoTranslate, setCurrentLanguage } from "../../lib/translations";
import { cn } from "../../lib/utils";
import type { EventContent } from "../../components/preview/PreviewRenderers";

interface WishesContent { heading?: string; subheading?: string; placeholder?: string; submitLabel?: string; buttonColors?: ButtonColors; headingBm?: string; subheadingBm?: string; placeholderBm?: string; submitLabelBm?: string; navLabel?: string; navLabelBm?: string; headingTypography?: TypographyStyle; placeholderTypography?: TypographyStyle; }

export default function GuestWishes() {
  const { event } = useGuestOutletContext();
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { guest } = useGuestAuth();
  const wishesConfig = ((event.content as Record<string, unknown> | null) ?? {}).wishes as Record<string, unknown> | null;
  const messagesEnabled = wishesConfig?.enabled !== false;
  const prefix = location.pathname.startsWith("/r/") ? `/r/${slug}` : `/e/${slug}`;
  if (!messagesEnabled) { return <Navigate to={`${prefix}/home`} replace />; }
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { language, t } = useLanguage();
  setCurrentLanguage(language);
  const content = (event.content ?? {}) as EventContent;
  const wishesContent = ((event.content as Record<string, unknown> | null) ?? {}).wishes as WishesContent | undefined;
  const heading = language === "bm" ? pickText(wishesContent?.heading, wishesContent?.headingBm, autoTranslate(wishesContent?.heading ?? "")) : wishesContent?.heading;
  const subheading = language === "bm" ? pickText(wishesContent?.subheading, wishesContent?.subheadingBm, autoTranslate(wishesContent?.subheading ?? "")) : wishesContent?.subheading;
  const placeholder = language === "bm" ? pickText(wishesContent?.placeholder || "Write your message here...", wishesContent?.placeholderBm, autoTranslate(wishesContent?.placeholder || "Write your message here...")) : (wishesContent?.placeholder || "Write your message here...");
  const submitLabel = language === "bm" ? pickText(wishesContent?.submitLabel || "Send", wishesContent?.submitLabelBm, autoTranslate(wishesContent?.submitLabel || "Send")) : (wishesContent?.submitLabel || "Send");

  const { data: customPages } = useQuery({
    queryKey: ["custom-pages-nav", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("id, title, slug, show_in_nav, is_published, nav_label")
        .eq("event_id", event.id)
        .eq("is_published", true)
        .eq("show_in_nav", true)
        .order("title", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomPage[];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: guest?.name || "Guest",
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-messages-public", event.id] });
      setMessage("");
      setSubmitError(null);
      setSubmitted(true);
    },
    onError: (err) => {
      console.error("Failed to submit wish", err);
      setSubmitError("We couldn't post your message. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submitMutation.mutate();
  };

  const nextPageRoute = customPages && customPages.length > 0 ? `${prefix}/p/${customPages[0].slug}` : null;

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-2xl">
        <div className={cn("pt-8 sm:pt-12 text-center", (heading || subheading) && "mb-12 sm:mb-16")}>
          {heading && <h1 className="guest-title text-center" style={{ whiteSpace: "pre-wrap", marginBottom: 0, ...getTypographyStyle(wishesContent?.headingTypography) }}>{heading}</h1>}
          {subheading && <p className="guest-subtitle text-center" style={{ margin: "0 auto", whiteSpace: "pre-wrap" }}>{subheading}</p>}
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="mb-8 space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="event-input"
              style={{ textAlign: "left", ...getTypographyStyle(wishesContent?.placeholderTypography), fontFamily: wishesContent?.placeholderTypography?.fontFamily || "var(--event-font-body)" }}
              required
            />
            {submitError && <p className="text-sm text-center" style={{ color: "var(--event-primary)" }}>{submitError}</p>}
            <div className="text-center">
              <button type="submit" disabled={submitMutation.isPending} className="event-btn-primary" style={{ opacity: submitMutation.isPending ? 0.6 : 1, fontFamily: wishesContent?.placeholderTypography?.fontFamily || "var(--event-font-body)", ...buttonColorsToStyle(wishesContent?.buttonColors) }} onMouseEnter={(e) => { if (!submitMutation.isPending) Object.assign(e.currentTarget.style, buttonColorsToHoverStyle(wishesContent?.buttonColors)); }} onMouseLeave={(e) => Object.assign(e.currentTarget.style, { fontFamily: wishesContent?.placeholderTypography?.fontFamily || "var(--event-font-body)", ...buttonColorsToStyle(wishesContent?.buttonColors) })}>
                {submitMutation.isPending ? (language === "bm" ? "Menghantar..." : "Sending...") : submitLabel}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8 text-center">
            <p style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>
              {language === "bm" ? "Terima kasih atas pesanan anda!" : "Thank you for your message!"}
            </p>
          </div>
        )}

        {nextPageRoute && (
          <div className="text-center" style={{ paddingTop: "1.5rem", paddingBottom: "2.5rem" }}>
            <button
              onClick={() => navigate(nextPageRoute)}
              className="event-btn-primary"
              style={{ ...buttonColorsToStyle(content.rsvpButtonColors), ...getTypographyStyle(content.rsvpButtonTypography) }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, { ...buttonColorsToStyle(content.rsvpButtonColors), ...getTypographyStyle(content.rsvpButtonTypography), ...buttonColorsToHoverStyle(content.rsvpButtonColors) })}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, { ...buttonColorsToStyle(content.rsvpButtonColors), ...getTypographyStyle(content.rsvpButtonTypography) })}
            >
              <span>&gt;</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
