import React, { useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type ContentBlock, type FaqItem, type TimelineItem, type SocialLink } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { getCountdown } from "../../lib/utils";
import { ChevronDown, Mail, Phone, MapPin } from "lucide-react";

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: page, isLoading } = useQuery({
    queryKey: ["public-custom-page", event.id, pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_pages").select("*").eq("event_id", event.id).eq("slug", pageSlug).eq("is_published", true).maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
    enabled: !!event?.id && !!pageSlug,
  });

  if (isLoading) return <div className="text-center py-12 event-muted-text">Loading...</div>;
  if (!page) return <div className="text-center py-12"><h2 className="text-2xl font-serif mb-2" style={{ color: "var(--event-primary)" }}>Page Not Found</h2></div>;

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-serif text-center mb-8" style={{ color: "var(--event-primary)" }}>{page.title}</h1>
      <div className="space-y-6">
        {(page.blocks || []).map((block) => <BlockRenderer key={block.id} block={block} />)}
      </div>
    </div>
  );
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  const d = block.data;
  switch (block.type) {
    case "heading": return <h2 className="text-2xl font-serif" style={{ color: "var(--event-primary)" }}>{d.text || ""}</h2>;
    case "subheading": return <h3 className="text-lg event-muted-text">{d.text || ""}</h3>;
    case "richtext": return <RichTextContent html={d.html || ""} className="text-base leading-relaxed" />;
    case "image": return d.url ? <img src={d.url} alt="" className="w-full rounded-xl" /> : null;
    case "gallery": return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {(d.images || []).map((img: string, i: number) => <img key={i} src={img} alt="" className="w-full rounded-lg object-cover" style={{ aspectRatio: "4/3" }} />)}
      </div>
    );
    case "divider": return <hr className="border-t" style={{ borderColor: "var(--event-border)" }} />;
    case "button": return d.url ? <div className="text-center"><a href={d.url} target="_blank" rel="noopener" className="inline-block px-6 py-2.5 rounded-lg text-white font-medium" style={{ background: "var(--event-primary)" }}>{d.label || "Click Here"}</a></div> : null;
    case "quote": return (
      <blockquote className="border-l-4 pl-4 italic" style={{ borderColor: "var(--event-primary)", color: "var(--event-muted)" }}>
        <p className="text-lg">{d.text || ""}</p>
        {d.author && <p className="text-sm mt-2">— {d.author}</p>}
      </blockquote>
    );
    case "countdown": {
      if (!d.date) return null;
      const c = getCountdown(d.date);
      if (c.isPast) return <p className="text-center event-muted-text">This date has passed.</p>;
      return (
        <div className="text-center py-4">
          <div className="flex justify-center gap-4">
            <div className="text-center"><p className="text-3xl font-bold" style={{ color: "var(--event-primary)" }}>{c.days}</p><p className="text-sm event-muted-text">Days</p></div>
            <div className="text-center"><p className="text-3xl font-bold" style={{ color: "var(--event-primary)" }}>{c.hours}</p><p className="text-sm event-muted-text">Hours</p></div>
            <div className="text-center"><p className="text-3xl font-bold" style={{ color: "var(--event-primary)" }}>{c.minutes}</p><p className="text-sm event-muted-text">Minutes</p></div>
          </div>
        </div>
      );
    }
    case "maps": return d.address ? (
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--event-border)" }}>
        <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent(d.query || d.address)}&output=embed`} width="100%" height="300" style={{ border: 0 }} loading="lazy" />
      </div>
    ) : null;
    case "video": {
      if (!d.url) return null;
      const ytMatch = d.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?]+)/);
      const vimeoMatch = d.url.match(/vimeo\.com\/(\d+)/);
      let embedUrl = d.url;
      if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
      else if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      return <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}><iframe src={embedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" /></div>;
    }
    case "contact": return (
      <div className="space-y-2 text-center">
        {d.email && <div className="flex items-center justify-center gap-2"><Mail className="w-4 h-4" style={{ color: "var(--event-primary)" }} /><a href={`mailto:${d.email}`} className="hover:underline">{d.email}</a></div>}
        {d.phone && <div className="flex items-center justify-center gap-2"><Phone className="w-4 h-4" style={{ color: "var(--event-primary)" }} /><a href={`tel:${d.phone}`} className="hover:underline">{d.phone}</a></div>}
        {d.address && <div className="flex items-center justify-center gap-2"><MapPin className="w-4 h-4" style={{ color: "var(--event-primary)" }} /><span className="event-muted-text">{d.address}</span></div>}
      </div>
    );
    case "social": return (
      <div className="flex flex-wrap gap-3 justify-center">
        {(d.links || []).map((link: SocialLink, i: number) => link.url ? <a key={i} href={link.url} target="_blank" rel="noopener" className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: "var(--event-primary)" }}>{link.label}</a> : null)}
      </div>
    );
    case "spacer": return <div style={{ height: d.height || 40 }} />;
    case "two-col": return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RichTextContent html={d.left || ""} className="text-base leading-relaxed" />
        <RichTextContent html={d.right || ""} className="text-base leading-relaxed" />
      </div>
    );
    case "three-col": return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RichTextContent html={d.col1 || ""} className="text-base leading-relaxed" />
        <RichTextContent html={d.col2 || ""} className="text-base leading-relaxed" />
        <RichTextContent html={d.col3 || ""} className="text-base leading-relaxed" />
      </div>
    );
    case "faq": return <FaqAccordion items={d.items || []} />;
    case "timeline": return (
      <div className="space-y-4">
        {(d.items || []).map((item: TimelineItem, i: number) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full" style={{ background: "var(--event-primary)" }} />
              {i < (d.items || []).length - 1 && <div className="w-0.5 flex-1" style={{ background: "var(--event-border)" }} />}
            </div>
            <div className="flex-1 pb-4">
              <p className="text-sm font-medium" style={{ color: "var(--event-primary)" }}>{item.time}</p>
              <p className="font-medium">{item.title}</p>
              {item.description && <p className="text-sm event-muted-text">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    );
    case "callout": {
      const variants: Record<string, { bg: string; border: string; text: string }> = {
        info: { bg: "var(--event-primary-light)", border: "var(--event-primary)", text: "var(--event-text)" },
        success: { bg: "#dcfce7", border: "#15803d", text: "#15803d" },
        warning: { bg: "#fef3c7", border: "#d97706", text: "#92400e" },
        danger: { bg: "#fee2e2", border: "#dc2626", text: "#dc2626" },
      };
      const v = variants[d.variant || "info"] || variants.info;
      return <div className="p-4 rounded-lg border-l-4" style={{ background: v.bg, borderColor: v.border, color: v.text }}>{d.text || ""}</div>;
    }
    default: return null;
  }
}

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--event-border)" }}>
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
            <span className="font-medium">{item.question}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${open === i ? "rotate-180" : ""}`} style={{ color: "var(--event-primary)" }} />
          </button>
          {open === i && <div className="px-4 pb-4 text-sm event-muted-text">{item.answer}</div>}
        </div>
      ))}
    </div>
  );
}
