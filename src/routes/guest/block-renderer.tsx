import { useEffect, useState, type ReactNode } from "react";
import { resolveTypography } from "../../lib/typography";
import { RichTextContent } from "../../lib/sanitize";
import { getCountdown, formatDate, formatTime12 } from "../../lib/utils";
import type { Json } from "../../lib/supabase";

export interface Block { id: string; type: string; props: Record<string, unknown>; }
interface BlockRendererProps { blocks: Block[]; }
type Any = Record<string, unknown>;
const s = (v: unknown, f = ""): string => typeof v === "string" ? v : f;
const n = (v: unknown, f = 0): number => typeof v === "number" ? v : f;
const a = (v: unknown): unknown[] => Array.isArray(v) ? v : [];

function CountdownBlock(p: Any) {
  const target = s(p.targetDate);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [target]);
  const c = getCountdown(target);
  const items = [["Days", c.days], ["Hours", c.hours], ["Minutes", c.minutes], ["Seconds", c.seconds]] as const;
  return (
    <div className="guest-section-tight text-center">
      {s(p.label) && <p className="guest-eyebrow mb-3">{s(p.label)}</p>}
      {c.isPast ? (
        <p className="guest-subtitle mx-auto">This event has begun.</p>
      ) : (
        <div className="flex justify-center gap-6">
          {items.map(([l, val]) => (
            <div key={l}>
              <div className="text-4xl font-bold" style={{ color: "var(--event-primary)" }}>{String(val).padStart(2, "0")}</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>{l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RsvpFormBlock(p: Any) {
  const [status, setStatus] = useState<"attending" | "declined" | "">("");
  const [plusOnes, setPlusOnes] = useState(0);
  const [names, setNames] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!status) { setErr("Please choose attending or declined."); return; }
    setSaving(true); setErr(null);
    try {
      const { supabase } = await import("../../lib/supabase");
      const { error } = await supabase.from("event_rsvps").insert({
        status, plus_ones: plusOnes,
        plus_one_names: names ? names.split(",").map((x) => x.trim()).filter(Boolean) : [],
        message: message || null, submitted_at: new Date().toISOString(),
      });
      if (error) throw error;
      setDone(true);
    } catch { setErr("Could not submit. Please try again."); }
    finally { setSaving(false); }
  }

  if (done) {
    return (
      <div className="guest-section-tight text-center">
        <div className="event-card mx-auto max-w-md">
          <p className="guest-title" style={{ fontSize: "1.5rem" }}>Thank you!</p>
          <p className="guest-subtitle mx-auto">Your response has been received.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-section-tight">
      <div className="mx-auto max-w-lg">
        {s(p.heading) && <h2 className="guest-title mb-4 text-center">{s(p.heading)}</h2>}
        <form onSubmit={submit} className="event-card space-y-4">
          <div>
            <label className="guest-eyebrow block mb-2">Will you attend?</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStatus("attending")} className={status === "attending" ? "event-btn-primary flex-1" : "event-btn-secondary flex-1"}>Joyfully Accept</button>
              <button type="button" onClick={() => setStatus("declined")} className={status === "declined" ? "event-btn-primary flex-1" : "event-btn-secondary flex-1"}>Regretfully Decline</button>
            </div>
          </div>
          {status === "attending" && (
            <>
              <div>
                <label className="guest-eyebrow block mb-2">Number of plus-ones</label>
                <input type="number" min={0} max={10} value={plusOnes} onChange={(e) => setPlusOnes(Math.max(0, parseInt(e.target.value) || 0))} className="event-input" />
              </div>
              {plusOnes > 0 && (
                <div>
                  <label className="guest-eyebrow block mb-2">Plus-one names</label>
                  <input type="text" value={names} onChange={(e) => setNames(e.target.value)} placeholder="Comma-separated names" className="event-input" />
                </div>
              )}
            </>
          )}
          <div>
            <label className="guest-eyebrow block mb-2">Message</label>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Leave a message…" className="event-input" />
          </div>
          {err && <p className="text-sm" style={{ color: "var(--event-primary)" }}>{err}</p>}
          <button type="submit" disabled={saving} className="event-btn-primary w-full" style={{ opacity: saving ? 0.6 : 1 }}>{saving ? "Submitting…" : s(p.buttonText, "Submit RSVP")}</button>
        </form>
      </div>
    </div>
  );
}

function ScheduleBlock(p: Any) {
  const rows = a(p.items).map((r) => r as Any);
  return (
    <div className="guest-section-tight">
      {s(p.title) && <h2 className="guest-title mb-6 text-center">{s(p.title)}</h2>}
      {rows.length === 0 ? (
        <p className="guest-subtitle mx-auto text-center">No schedule yet.</p>
      ) : (
        <div className="mx-auto max-w-2xl space-y-4">
          {rows.map((r, i) => (
            <div key={i} className="event-info-card">
              <h3 className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>{s(r.title)}</h3>
              {(s(r.date) || s(r.time)) && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{formatDate(s(r.date))}{s(r.time) && ` · ${formatTime12(s(r.time))}`}</p>}
              {s(r.venue) && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{s(r.venue)}</p>}
              {s(r.description) && <p className="mt-2 text-sm">{s(r.description)}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderBlock(block: Block): ReactNode {
  const p = block.props;
  switch (block.type) {
    case "heading": {
      const t = resolveTypography(p.text, "");
      const lvl = Math.min(Math.max(n(p.level, 2), 1), 6);
      const Tag = `h${lvl}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return <div className="guest-section-tight text-center"><Tag className="guest-title" style={{ ...t.style, textAlign: (s(p.align) || "center") as React.CSSProperties["textAlign"] }}>{t.text}</Tag></div>;
    }
    case "paragraph":
      return <div className="guest-section-tight"><div className="mx-auto max-w-2xl rich-content" style={{ textAlign: (s(p.align) || "left") as React.CSSProperties["textAlign"] }}><RichTextContent html={s(p.text)} /></div></div>;
    case "image": {
      const url = s(p.url);
      return (
        <div className="guest-section-tight text-center">
          {url ? (
            <>
              <img src={url} alt={s(p.alt)} className="mx-auto" style={{ maxWidth: "100%", borderRadius: "var(--event-radius)" }} />
              {s(p.caption) && <p className="mt-2 text-sm" style={{ color: "var(--event-muted)" }}>{s(p.caption)}</p>}
            </>
          ) : (
            <div className="mx-auto flex max-w-md items-center justify-center rounded-lg" style={{ height: 200, backgroundColor: "var(--event-surface-alt)", color: "var(--event-muted)" }}>No image</div>
          )}
        </div>
      );
    }
    case "spacer": return <div style={{ height: n(p.height, 48) }} />;
    case "divider": return <hr style={{ border: 0, borderTop: `1px ${s(p.style, "solid")} var(--event-border)`, margin: "2rem 0" }} />;
    case "gallery": {
      const imgs = a(p.images).map((i) => s(typeof i === "string" ? i : (i as Any).url));
      const cols = Math.min(Math.max(n(p.columns, 3), 1), 6);
      return (
        <div className="guest-section-tight">
          <div className="mx-auto grid max-w-4xl gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {imgs.map((src, i) => <img key={i} src={src} alt="" className="w-full object-cover" style={{ aspectRatio: "1", borderRadius: "var(--event-radius)" }} />)}
          </div>
        </div>
      );
    }
    case "video": {
      const url = s(p.url);
      const yt = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/.exec(url);
      const vimeo = /vimeo\.com\/(\d+)/.exec(url);
      const embed = yt ? `https://www.youtube.com/embed/${yt[1]}` : vimeo ? `https://player.vimeo.com/video/${vimeo[1]}` : url;
      return (
        <div className="guest-section-tight">
          <div className="mx-auto max-w-3xl" style={{ aspectRatio: "16 / 9" }}>
            {embed ? <iframe title={s(p.title) || "Video"} src={embed} width="100%" height="100%" style={{ border: 0, borderRadius: "var(--event-radius)" }} allowFullScreen /> : <div className="flex h-full items-center justify-center rounded-lg" style={{ backgroundColor: "var(--event-surface-alt)", color: "var(--event-muted)" }}>No video URL</div>}
          </div>
        </div>
      );
    }
    case "button": {
      const url = s(p.url);
      const cls = s(p.style, "primary") === "secondary" ? "event-btn-secondary" : "event-btn-primary";
      const inner = <span>{s(p.text, "Click Here")}</span>;
      return (
        <div className="guest-section-tight text-center">
          {url ? <a href={url} target="_blank" rel="noopener noreferrer" className={cls} style={{ display: "inline-block", textDecoration: "none" }}>{inner}</a> : <button type="button" className={cls}>{inner}</button>}
        </div>
      );
    }
    case "columns": {
      const cols = a(p.columns).map((c) => c as Any);
      return (
        <div className="guest-section-tight">
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {cols.map((col, i) => (
              <div key={i} className="event-info-card">
                {s(col.heading) && <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--event-heading)" }}>{s(col.heading)}</h3>}
                {s(col.body) && <RichTextContent html={s(col.body)} />}
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "list": {
      const rows = a(p.items).map((r) => s(typeof r === "string" ? r : (r as Any).text));
      const Tag = p.ordered ? "ol" : "ul";
      return (
        <div className="guest-section-tight">
          <div className="mx-auto max-w-2xl rich-content">
            <Tag className={p.ordered ? "list-decimal" : "list-disc"} style={{ paddingLeft: "1.5em" }}>{rows.map((t, i) => <li key={i}>{t}</li>)}</Tag>
          </div>
        </div>
      );
    }
    case "quote": {
      const t = resolveTypography(p.text, "");
      return (
        <div className="guest-section-tight text-center">
          <blockquote className="mx-auto max-w-2xl rich-content" style={{ borderLeft: "3px solid var(--event-border)", paddingLeft: "1rem", fontStyle: "italic", color: "var(--event-muted)", ...t.style }}>
            {t.text}
            {s(p.author) && <footer className="mt-2 text-sm" style={{ color: "var(--event-muted)" }}>— {s(p.author)}</footer>}
          </blockquote>
        </div>
      );
    }
    case "countdown": return <CountdownBlock targetDate={p.targetDate} label={p.label} />;
    case "map": {
      const addr = s(p.address);
      const src = addr ? `https://maps.google.com/maps?q=${encodeURIComponent(addr)}&output=embed` : "";
      return (
        <div className="guest-section-tight">
          {s(p.label) && <p className="guest-eyebrow mb-3 text-center">{s(p.label)}</p>}
          {src ? (
            <iframe title="Map" src={src} width="100%" height={n(p.height, 300)} style={{ border: 0, borderRadius: "var(--event-radius)" }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <div className="flex items-center justify-center rounded-lg" style={{ height: n(p.height, 300), backgroundColor: "var(--event-surface-alt)", color: "var(--event-muted)" }}>No address provided</div>
          )}
        </div>
      );
    }
    case "rsvp-form": return <RsvpFormBlock heading={p.heading} buttonText={p.buttonText} />;
    case "guest-list": return <div className="guest-section-tight text-center">{s(p.title) && <h2 className="guest-title mb-4">{s(p.title)}</h2>}<p className="guest-subtitle mx-auto">Guest list coming soon.</p></div>;
    case "schedule": return <ScheduleBlock items={p.items} title={p.title} />;
    case "venue":
      return (
        <div className="guest-section-tight">
          {s(p.label) && <p className="guest-eyebrow mb-3 text-center">{s(p.label)}</p>}
          <div className="mx-auto max-w-2xl event-info-card">
            {s(p.name) && <h3 className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>{s(p.name)}</h3>}
            {s(p.address) && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{s(p.address)}</p>}
            {s(p.mapUrl) && <iframe title="Venue map" src={s(p.mapUrl)} width="100%" height={250} style={{ border: 0, borderRadius: "var(--event-radius)", marginTop: "1rem" }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />}
          </div>
        </div>
      );
    case "faq": {
      const rows = a(p.items).map((r) => r as Any);
      return (
        <div className="guest-section-tight">
          {s(p.title) && <h2 className="guest-title mb-6 text-center">{s(p.title)}</h2>}
          <div className="mx-auto max-w-2xl space-y-3">
            {rows.map((r, i) => (
              <details key={i} className="event-info-card">
                <summary className="cursor-pointer font-semibold" style={{ color: "var(--event-heading)" }}>{s(r.question)}</summary>
                <p className="mt-2 text-sm">{s(r.answer)}</p>
              </details>
            ))}
          </div>
        </div>
      );
    }
    default: return null;
  }
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;
  return <>{blocks.map((b) => <div key={b.id}>{renderBlock(b)}</div>)}</>;
}

export function parseBlocks(raw: Json | null | undefined): Block[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const obj = raw as { blocks?: unknown };
  if (!Array.isArray(obj.blocks)) return [];
  return (obj.blocks as Block[]).filter((b) => b && typeof b.type === "string");
}
