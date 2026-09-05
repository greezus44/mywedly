import { useState } from "react";
import { Navigate, useParams, useLocation } from "react-router-dom";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDateTime } from "../../lib/utils";
import { buttonColorsToStyle, buttonColorsToHoverStyle, type ButtonColors } from "../../components/ui/ButtonColourEditor";
import { useLanguage } from "../../lib/language";
import { pickText, autoTranslate } from "../../lib/translations";

interface WishesContent { heading?: string; subheading?: string; placeholder?: string; submitLabel?: string; buttonColors?: ButtonColors; headingBm?: string; subheadingBm?: string; placeholderBm?: string; submitLabelBm?: string; }

export default function GuestWishes() {
  const { event } = useGuestOutletContext();
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { guest } = useGuestAuth();
  const messagesEnabled = ((event.content as Record<string, unknown> | null) ?? {}).messagesEnabled !== false;
  if (!messagesEnabled) { const prefix = location.pathname.startsWith("/r/") ? `/r/${slug}` : `/e/${slug}`; return <Navigate to={`${prefix}/home`} replace />; }
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { language } = useLanguage();
  const wishesContent = ((event.content as Record<string, unknown> | null) ?? {}).wishes as WishesContent | undefined;
  const heading = language === "bm" ? pickText(wishesContent?.heading, wishesContent?.headingBm, autoTranslate(wishesContent?.heading ?? "")) : wishesContent?.heading;
  const subheading = language === "bm" ? pickText(wishesContent?.subheading, wishesContent?.subheadingBm, autoTranslate(wishesContent?.subheading ?? "")) : wishesContent?.subheading;
  const placeholder = language === "bm" ? pickText(wishesContent?.placeholder || "Write your message here...", wishesContent?.placeholderBm, autoTranslate(wishesContent?.placeholder || "Write your message here...")) : (wishesContent?.placeholder || "Write your message here...");
  const submitLabel = language === "bm" ? pickText(wishesContent?.submitLabel || "Send", wishesContent?.submitLabelBm, autoTranslate(wishesContent?.submitLabel || "Send")) : (wishesContent?.submitLabel || "Send");

  const { data: messages, isLoading } = useQuery({
    queryKey: ["event-messages-public", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventMessage[];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      // FIX #1: event_messages has `guest_name` (NOT NULL), no `guest_id` column
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
    },
    onError: (err) => {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit wish");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submitMutation.mutate();
  };

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          {heading && <h1 className="guest-title mb-2 text-center" style={{ whiteSpace: "pre-wrap" }}>{heading}</h1>}
          {subheading && <p className="guest-subtitle text-center" style={{ margin: "0 auto", whiteSpace: "pre-wrap" }}>{subheading}</p>}
        </div>

        <form onSubmit={handleSubmit} className="event-card mb-8 space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="event-input"
            style={{ textAlign: "left" }}
            required
          />
          {submitError && <p className="text-sm" style={{ color: "var(--event-primary)" }}>{submitError}</p>}
          <button type="submit" disabled={submitMutation.isPending} className="event-btn-primary" style={{ opacity: submitMutation.isPending ? 0.6 : 1, ...buttonColorsToStyle(wishesContent?.buttonColors) }} onMouseEnter={(e) => { if (!submitMutation.isPending) Object.assign(e.currentTarget.style, buttonColorsToHoverStyle(wishesContent?.buttonColors)); }} onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonColorsToStyle(wishesContent?.buttonColors))}>
            {submitMutation.isPending ? (language === "bm" ? "Menghantar..." : "Sending...") : submitLabel}
          </button>
        </form>

        {isLoading ? (
          <p className="text-center" style={{ color: "var(--event-muted)" }}>{language === "bm" ? "Memuatkan mesej..." : "Loading messages..."}</p>
        ) : !messages || messages.length === 0 ? (
          <p className="text-center" style={{ color: "var(--event-muted)" }}>{language === "bm" ? "Tiada mesej lagi. Jadi yang pertama meninggalkan mesej!" : "No messages yet. Be the first to leave a message!"}</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="event-card">
                <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold" style={{ color: "var(--event-heading)" }}>{msg.guest_name}</span>
                  <span className="text-sm" style={{ color: "var(--event-muted)" }}>{formatDateTime(msg.created_at)}</span>
                </div>
                <p className="whitespace-pre-wrap" style={{ color: "var(--event-text)" }}>{msg.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
