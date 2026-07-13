import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { WebsiteContent } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { Card, EmptyState } from "@/components/ui";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

type ContactInfo = {
  emails?: string[];
  phones?: string[];
  addresses?: string[];
  notes?: string;
};

/**
 * Parse a contact website_content body into structured info.
 * Recognizes lines prefixed with Email:, Phone:, Address:, or Notes:.
 * Any unlabelled lines are collected as general notes.
 */
function parseContact(body: string): ContactInfo {
  const info: ContactInfo = {};
  const notes: string[] = [];

  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    if (/^email\s*[:.]\s*/i.test(line)) {
      const val = line.replace(/^email\s*[:.]\s*/i, "").trim();
      if (val) {
        info.emails = info.emails || [];
        info.emails.push(val);
      }
    } else if (/^phone\s*[:.]\s*/i.test(line)) {
      const val = line.replace(/^phone\s*[:.]\s*/i, "").trim();
      if (val) {
        info.phones = info.phones || [];
        info.phones.push(val);
      }
    } else if (/^address\s*[:.]\s*/i.test(line)) {
      const val = line.replace(/^address\s*[:.]\s*/i, "").trim();
      if (val) {
        info.addresses = info.addresses || [];
        info.addresses.push(val);
      }
    } else if (/^notes?\s*[:.]\s*/i.test(line)) {
      const val = line.replace(/^notes?\s*[:.]\s*/i, "").trim();
      if (val) {
        info.notes = info.notes ? `${info.notes}\n${val}` : val;
      }
    } else {
      notes.push(line);
    }
  }

  if (notes.length > 0 && !info.notes) {
    info.notes = notes.join("\n");
  }

  return info;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function GuestContact() {
  const { wedding, loading } = useGuestData();
  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [contentLoading, setContentLoading] = useState(true);

  useEffect(() => {
    if (!wedding) return;
    supabase
      .from("website_content")
      .select("*")
      .eq("wedding_id", wedding.id)
      .eq("section", "contact")
      .maybeSingle()
      .then(({ data }) => {
        setContent((data as WebsiteContent) || null);
        setContentLoading(false);
      });
  }, [wedding]);

  if (loading || contentLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sepia">
        Loading…
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sepia">
        Wedding not found.
      </div>
    );
  }

  const contact = content?.body ? parseContact(content.body) : {};
  const title = content?.title || "Get in Touch";
  const hasContactInfo =
    Boolean(contact.emails?.length) ||
    Boolean(contact.phones?.length) ||
    Boolean(contact.addresses?.length) ||
    Boolean(contact.notes);
  const hasWeddingLocation = Boolean(wedding.location);

  if (!hasContactInfo && !hasWeddingLocation) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Header title={title} />
        <EmptyState
          title="No contact details yet"
          description="The couple will share their contact information here soon."
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Header title={title} />

      <div className="space-y-4">
        {/* Email */}
        {contact.emails && contact.emails.length > 0 && (
          <ContactRow icon={Mail} label="Email">
            {contact.emails.map((email) => (
              <a
                key={email}
                href={`mailto:${email}`}
                className="block text-onyx hover:text-sepia hover:underline transition-colors"
              >
                {email}
              </a>
            ))}
          </ContactRow>
        )}

        {/* Phone */}
        {contact.phones && contact.phones.length > 0 && (
          <ContactRow icon={Phone} label="Phone">
            {contact.phones.map((phone) => (
              <a
                key={phone}
                href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                className="block text-onyx hover:text-sepia hover:underline transition-colors"
              >
                {phone}
              </a>
            ))}
          </ContactRow>
        )}

        {/* Wedding location */}
        {hasWeddingLocation && (
          <ContactRow icon={MapPin} label="Venue">
            <span className="text-onyx">{wedding.location}</span>
          </ContactRow>
        )}

        {/* Additional addresses */}
        {contact.addresses && contact.addresses.length > 0 && (
          <ContactRow icon={MapPin} label="Address">
            {contact.addresses.map((addr) => (
              <span key={addr} className="block text-onyx">
                {addr}
              </span>
            ))}
          </ContactRow>
        )}

        {/* Notes / general message */}
        {contact.notes && (
          <Card className="bg-mist/40">
            <p className="text-ink leading-relaxed whitespace-pre-line font-serif text-center">
              {contact.notes}
            </p>
          </Card>
        )}
      </div>

      {/* Decorative footer */}
      <div className="flex items-center justify-center gap-3 text-sepia mt-12">
        <span className="h-px w-10 bg-sand" />
        <Heart className="w-4 h-4" />
        <span className="h-px w-10 bg-sand" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function Header({ title }: { title: string }) {
  return (
    <header className="text-center mb-12">
      <div className="flex items-center justify-center gap-3 text-sepia mb-4">
        <span className="h-px w-12 bg-sand" />
        <Mail className="w-5 h-5" />
        <span className="h-px w-12 bg-sand" />
      </div>
      <h1 className="font-serif text-3xl md:text-4xl text-onyx mb-3">
        {title}
      </h1>
      <p className="text-sepia text-sm tracking-widest uppercase">
        We'd love to hear from you
      </p>
    </header>
  );
}

function ContactRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-mist flex items-center justify-center text-sepia">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sepia text-xs tracking-widest uppercase mb-1">
          {label}
        </p>
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </Card>
  );
}

export default GuestContact;
