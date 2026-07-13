import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, MapPin, MessageCircle, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { WebsiteContent } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import { Card, EmptyState } from "@/components/ui";

type ContactInfo = {
  email?: string;
  phone?: string;
  address?: string;
  note?: string;
};

function parseContactInfo(body: string): ContactInfo {
  const info: ContactInfo = {};
  const lines = body.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();
    if (lower.startsWith("email:") || lower.startsWith("e-mail:")) {
      info.email = trimmed.slice(lower.startsWith("e-mail:") ? 7 : 6).trim();
    } else if (lower.startsWith("phone:") || lower.startsWith("tel:")) {
      info.phone = trimmed.slice(lower.startsWith("tel:") ? 4 : 6).trim();
    } else if (lower.startsWith("address:")) {
      info.address = trimmed.slice(8).trim();
    } else if (lower.startsWith("note:")) {
      info.note = trimmed.slice(5).trim();
    }
  }

  return info;
}

export function GuestContact() {
  const { wedding, loading } = useGuestData();

  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [fetching, setFetching] = useState(true);

  const theme = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const weddingId = wedding?.id ?? null;

  useEffect(() => {
    if (!weddingId) return;
    setFetching(true);
    supabase
      .from("website_content")
      .select("*")
      .eq("wedding_id", weddingId)
      .eq("section", "contact")
      .maybeSingle()
      .then(({ data }) => {
        setContent((data as WebsiteContent) ?? null);
        setFetching(false);
      });
  }, [weddingId]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia animate-fade-in">
        Loading contact info…
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="Wedding Not Found" description="We couldn't find the wedding you're looking for." />;
  }

  const title = content?.title ?? "Get in Touch";
  const body = content?.body ?? null;
  const contactInfo = body ? parseContactInfo(body) : {};
  const hasAnyContact = contactInfo.email || contactInfo.phone || contactInfo.address || wedding.location;

  if (!hasAnyContact) {
    return (
      <div style={cssVars as React.CSSProperties} className="animate-fade-in">
        <section className="px-6 py-24 text-center" style={{ background: "var(--c-background)" }}>
          <EmptyState
            title="Contact info coming soon"
            description="Check back later for contact details."
          />
        </section>
      </div>
    );
  }

  return (
    <div style={cssVars as React.CSSProperties} className="animate-fade-in">
      {/* ── Header ── */}
      <section className="px-6 pt-16 pb-8 text-center" style={{ background: "var(--c-background)" }}>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ background: "var(--c-secondary)" }}>
          <MessageCircle className="w-6 h-6" style={{ color: "var(--c-accent)" }} />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
          We'd love to hear from you
        </p>
        <h1 className="text-4xl md:text-5xl font-serif" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)", fontStyle: "var(--f-style)" }}>
          {title}
        </h1>
      </section>

      {/* ── Contact cards ── */}
      <section className="px-6 pb-16 md:pb-24" style={{ background: "var(--c-background)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Email */}
            {contactInfo.email && (
              <Card
                className="p-6 flex flex-col items-center text-center animate-fade-in"
                style={{ borderColor: "var(--c-secondary)", background: "var(--c-card)" } as React.CSSProperties}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--c-secondary)" }}>
                  <Mail className="w-6 h-6" style={{ color: "var(--c-primary)" }} />
                </div>
                <h3 className="text-sm uppercase tracking-widest mb-2" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
                  Email
                </h3>
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="text-sm hover:underline break-all"
                  style={{ color: "var(--c-link)", fontFamily: "var(--f-body)" }}
                >
                  {contactInfo.email}
                </a>
              </Card>
            )}

            {/* Phone */}
            {contactInfo.phone && (
              <Card
                className="p-6 flex flex-col items-center text-center animate-fade-in"
                style={{ borderColor: "var(--c-secondary)", background: "var(--c-card)" } as React.CSSProperties}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--c-secondary)" }}>
                  <Phone className="w-6 h-6" style={{ color: "var(--c-primary)" }} />
                </div>
                <h3 className="text-sm uppercase tracking-widest mb-2" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
                  Phone
                </h3>
                <a
                  href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                  className="text-sm hover:underline"
                  style={{ color: "var(--c-link)", fontFamily: "var(--f-body)" }}
                >
                  {contactInfo.phone}
                </a>
              </Card>
            )}

            {/* Address / Venue */}
            {(contactInfo.address || wedding.location) && (
              <Card
                className="p-6 flex flex-col items-center text-center animate-fade-in sm:col-span-2"
                style={{ borderColor: "var(--c-secondary)", background: "var(--c-card)" } as React.CSSProperties}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--c-secondary)" }}>
                  <MapPin className="w-6 h-6" style={{ color: "var(--c-primary)" }} />
                </div>
                <h3 className="text-sm uppercase tracking-widest mb-2" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
                  Venue Location
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--c-text)", fontFamily: "var(--f-body)" }}>
                  {contactInfo.address || wedding.location}
                </p>
              </Card>
            )}
          </div>

          {/* Note */}
          {contactInfo.note && (
            <Card
              className="p-6 mt-6 text-center animate-fade-in"
              style={{ borderColor: "var(--c-secondary)", background: "var(--c-card)" } as React.CSSProperties}
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3" style={{ background: "var(--c-secondary)" }}>
                <Heart className="w-5 h-5" style={{ color: "var(--c-accent)" }} />
              </div>
              <p
                className="text-sm leading-relaxed whitespace-pre-line"
                style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}
              >
                {contactInfo.note}
              </p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
