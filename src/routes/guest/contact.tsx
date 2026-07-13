import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, Mail, Phone, Globe, Heart, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { WebsiteContent } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import type { ThemeConfig } from "@/lib/theme";
import { Card, EmptyState } from "@/components/ui";

type ContactInfo = {
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
};

export function GuestContact() {
  const { wedding, loading } = useGuestData();
  const theme: ThemeConfig = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [fetching, setFetching] = useState(true);

  const weddingId = wedding?.id ?? "";

  const loadContent = useCallback(async () => {
    if (!weddingId) { setFetching(false); return; }
    setFetching(true);
    const { data } = await supabase
      .from("website_content")
      .select("*")
      .eq("wedding_id", weddingId)
      .eq("section", "contact")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) setContent(data as WebsiteContent);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => { if (weddingId) loadContent(); }, [weddingId, loadContent]);

  // ─── Parse contact info from body ───
  const contactInfo = useMemo<ContactInfo>(() => {
    const body = content?.body ?? "";
    const info: ContactInfo = {};

    const lines = body.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();

      if (lower.startsWith("email:") || lower.startsWith("e-mail:")) {
        info.email = trimmed.slice(lower.startsWith("e-mail:") ? 7 : 6).trim();
      } else if (lower.startsWith("phone:") || lower.startsWith("tel:")) {
        info.phone = trimmed.slice(lower.startsWith("tel:") ? 4 : 6).trim();
      } else if (lower.startsWith("website:") || lower.startsWith("url:")) {
        info.website = trimmed.slice(lower.startsWith("url:") ? 4 : 8).trim();
      } else if (lower.startsWith("notes:") || lower.startsWith("note:")) {
        info.notes = trimmed.slice(lower.startsWith("note:") ? 5 : 6).trim();
      }
    }

    // Also try to extract email/phone from raw text if not explicitly labeled
    if (!info.email) {
      const emailMatch = body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) info.email = emailMatch[0];
    }
    if (!info.phone) {
      const phoneMatch = body.match(/(\+?\d[\d\s\-().]{7,}\d)/);
      if (phoneMatch) info.phone = phoneMatch[0].trim();
    }

    return info;
  }, [content]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" />;
  }

  const hasContactInfo = contactInfo.email || contactInfo.phone || contactInfo.website || contactInfo.notes;
  const hasLocation = wedding.location;

  if (!hasContactInfo && !hasLocation && !content?.body) {
    return (
      <div style={cssVars as React.CSSProperties} className="animate-fade-in px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <EmptyState
            title="Contact info coming soon"
            description="Check back later for contact details."
          />
        </div>
      </div>
    );
  }

  return (
    <div style={cssVars as React.CSSProperties} className="animate-fade-in px-6 py-12">
      <div className="max-w-2xl mx-auto">
        {/* ─── Header ─── */}
        <div className="text-center mb-12">
          <Heart className="w-6 h-6 mx-auto mb-3" style={{ color: "var(--c-accent)" }} />
          <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: "var(--c-textMuted)" }}>
            Get in touch
          </p>
          <h1 className="text-4xl font-serif" style={{ color: "var(--c-text)" }}>
            {content?.title || "Contact"}
          </h1>
        </div>

        {/* ─── Location ─── */}
        {hasLocation && (
          <Card className="p-6 mb-6 text-center">
            <MapPin className="w-6 h-6 mx-auto mb-3" style={{ color: "var(--c-primary)" }} />
            <h2 className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--c-textMuted)" }}>
              Wedding Location
            </h2>
            <p className="text-lg font-serif" style={{ color: "var(--c-text)" }}>
              {wedding.location}
            </p>
          </Card>
        )}

        {/* ─── Contact details ─── */}
        {hasContactInfo && (
          <Card className="p-6">
            <div className="space-y-4">
              {contactInfo.email && (
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-center gap-3 group transition-colors"
                >
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--c-secondary)", color: "var(--c-primary)" }}
                  >
                    <Mail className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-widest" style={{ color: "var(--c-textMuted)" }}>
                      Email
                    </p>
                    <p className="text-sm group-hover:underline" style={{ color: "var(--c-link)" }}>
                      {contactInfo.email}
                    </p>
                  </div>
                </a>
              )}

              {contactInfo.phone && (
                <a
                  href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 group transition-colors"
                >
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--c-secondary)", color: "var(--c-primary)" }}
                  >
                    <Phone className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-widest" style={{ color: "var(--c-textMuted)" }}>
                      Phone
                    </p>
                    <p className="text-sm group-hover:underline" style={{ color: "var(--c-link)" }}>
                      {contactInfo.phone}
                    </p>
                  </div>
                </a>
              )}

              {contactInfo.website && (
                <a
                  href={contactInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group transition-colors"
                >
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--c-secondary)", color: "var(--c-primary)" }}
                  >
                    <Globe className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-widest" style={{ color: "var(--c-textMuted)" }}>
                      Website
                    </p>
                    <p className="text-sm group-hover:underline" style={{ color: "var(--c-link)" }}>
                      {contactInfo.website}
                    </p>
                  </div>
                </a>
              )}
            </div>

            {contactInfo.notes && (
              <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--c-secondary)" }}>
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--c-textMuted)" }} />
                  <p
                    className="text-sm whitespace-pre-line leading-relaxed"
                    style={{ color: "var(--c-textMuted)" }}
                  >
                    {contactInfo.notes}
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ─── Footer ornament ─── */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-3" style={{ color: "var(--c-accent)" }}>
            <span className="h-px w-12" style={{ background: "var(--c-accent)" }} />
            <Heart className="w-4 h-4" />
            <span className="h-px w-12" style={{ background: "var(--c-accent)" }} />
          </div>
          <p className="text-xs mt-4" style={{ color: "var(--c-textMuted)" }}>
            {wedding.couple_name_one} & {wedding.couple_name_two}
          </p>
        </div>
      </div>
    </div>
  );
}

export default GuestContact;
