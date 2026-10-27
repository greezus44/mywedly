import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, Modal, ColorInput } from "../../components/ui";
import { ButtonColourEditor, type ButtonColors } from "../../components/ui/ButtonColourEditor";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { FontSelect } from "../../components/ui/FontSelect";
import { HEADING_FONT_OPTIONS } from "../../lib/theme";
import type { TypographyStyle } from "../../lib/typography";
import { formatDateTime } from "../../lib/utils";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeCsv(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadBlob(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportWord(messages: EventMessage[], eventName: string) {
  const rows = messages.map((m) => `<tr><td>${escapeHtml(m.guest_name)}</td><td>${escapeHtml(formatDateTime(m.created_at))}</td><td>${escapeHtml(m.message)}</td></tr>`).join("");
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${escapeHtml(eventName)} - Messages</title></head><body><h2>${escapeHtml(eventName)} - Guest Messages</h2><table border="1" cellspacing="0" cellpadding="6"><thead><tr><th>Name</th><th>Date</th><th>Message</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  downloadBlob(html, `${eventName}-messages.doc`, "application/msword");
}

function exportCsv(messages: EventMessage[], eventName: string) {
  const header = "Name,Date,Message\n";
  const rows = messages.map((m) => `${escapeCsv(m.guest_name)},${escapeCsv(formatDateTime(m.created_at))},${escapeCsv(m.message)}`).join("\n");
  downloadBlob("\uFEFF" + header + rows, `${eventName}-messages.csv`, "text/csv;charset=utf-8");
}

function exportPdf(messages: EventMessage[], eventName: string) {
  const rows = messages.map((m) => `<tr><td>${escapeHtml(m.guest_name)}</td><td>${escapeHtml(formatDateTime(m.created_at))}</td><td>${escapeHtml(m.message)}</td></tr>`).join("");
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(eventName)} - Messages</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111}h2{margin-bottom:8px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #ccc;padding:8px;text-align:left;vertical-align:top}th{background:#f5f5f5;font-weight:600}td:nth-child(2){white-space:nowrap}@media print{body{padding:0}}</style></head><body><h2>${escapeHtml(eventName)} - Guest Messages</h2><table><thead><tr><th>Name</th><th>Date</th><th>Message</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`);
  w.document.close();
}

interface EventContextValue { event: UserEvent; eventId: string; }
interface WishesContent { heading?: string; subheading?: string; placeholder?: string; submitLabel?: string; buttonColors?: ButtonColors; enabled?: boolean; headingBm?: string; subheadingBm?: string; placeholderBm?: string; submitLabelBm?: string; navLabel?: string; navLabelBm?: string; headingTypography?: TypographyStyle; placeholderTypography?: TypographyStyle; }

export function MessagesPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"messages" | "settings">("messages");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) setDownloadOpen(false);
    }
    if (downloadOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [downloadOpen]);

  const eventName = event.name || event.draft_name || "event";

  const [wishesContent, setWishesContent] = useState<WishesContent>(() => {
    const raw = (event.content as Record<string, unknown> | null) ?? {};
    return (raw.wishes as WishesContent | undefined) ?? {};
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // FIX #1: Load messages — event_messages has guest_name, not guest_id
  const { data: messages, isLoading, isError, error } = useQuery({
    queryKey: ["event-messages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventMessage[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-messages", eventId] });
      setDeleteTarget(null);
    },
  });

  const saveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    const existing = (event.draft_content as Record<string, unknown> | null) ?? (event.content as Record<string, unknown> | null) ?? {};
    const updated = { ...existing, wishes: wishesContent };
    const { error } = await supabase
      .from("user_events")
      .update({ draft_content: updated })
      .eq("id", eventId);
    setSaving(false);
    if (!error) {
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Messages</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab("messages")} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "messages" ? "bg-dash-primary/10 text-dash-primary" : "text-dash-muted hover:text-dash-text"}`}>Messages {messages ? `(${messages.length})` : ""}</button>
          <button onClick={() => setTab("settings")} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "settings" ? "bg-dash-primary/10 text-dash-primary" : "text-dash-muted hover:text-dash-text"}`}>Page Settings</button>
          {messages && messages.length > 0 && (
            <div className="relative" ref={downloadRef}>
              <button onClick={() => setDownloadOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-md border border-dash-border bg-dash-surface px-3 py-1.5 text-sm font-medium text-dash-text transition-colors hover:bg-dash-primary/5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" /></svg>
                Download
                <svg className={`h-3 w-3 transition-transform ${downloadOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {downloadOpen && (
                <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-dash-border bg-dash-surface py-1 shadow-lg">
                  <button onClick={() => { exportWord(messages, eventName); setDownloadOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-dash-text transition-colors hover:bg-dash-primary/5">
                    <span className="font-medium">Word</span><span className="text-xs text-dash-muted">.doc</span>
                  </button>
                  <button onClick={() => { exportPdf(messages, eventName); setDownloadOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-dash-text transition-colors hover:bg-dash-primary/5">
                    <span className="font-medium">PDF</span><span className="text-xs text-dash-muted">Print to PDF</span>
                  </button>
                  <button onClick={() => { exportCsv(messages, eventName); setDownloadOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-dash-text transition-colors hover:bg-dash-primary/5">
                    <span className="font-medium">CSV</span><span className="text-xs text-dash-muted">Excel / Sheets</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {tab === "messages" && (
        <>
          {isLoading ? <div className="flex justify-center py-12"><LoadingSpinner /></div>
          : isError ? <ErrorState title="Failed to load messages" message={error instanceof Error ? error.message : "Unknown error"} />
          : !messages || messages.length === 0 ? (
            <div className="rounded-lg border border-dash-border bg-dash-surface p-8 text-center"><p className="text-dash-muted">No messages submitted yet.</p></div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="rounded-lg border border-dash-border bg-dash-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-medium text-dash-text">{msg.guest_name}</span>
                        <span className="text-xs text-dash-muted">{formatDateTime(msg.created_at)}</span>
                      </div>
                      <p className="text-sm text-dash-muted whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <button onClick={() => setDeleteTarget(msg.id)} className="shrink-0 rounded p-1 text-dash-muted transition-colors hover:bg-red-50 hover:text-dash-danger" title="Delete message">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "settings" && (
        <div className="space-y-4 rounded-lg border border-dash-border bg-dash-surface p-4">
          <h3 className="text-sm font-semibold text-dash-text">Messages Page Content</h3>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-dash-text">
              <input type="checkbox" checked={wishesContent.enabled ?? true} onChange={(e) => setWishesContent((p) => ({ ...p, enabled: e.target.checked }))} className="accent-dash-primary" />
              Messages feature enabled
            </label>
            <p className="mt-1 text-xs text-dash-muted">When enabled, guests can submit messages. When disabled, the Messages page is hidden from guests.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Nav Label (menu text)</label>
            <input type="text" value={wishesContent.navLabel ?? ""} onChange={(e) => setWishesContent((p) => ({ ...p, navLabel: e.target.value }))} placeholder="Messages" className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
            <p className="mt-1 text-xs text-dash-muted">The text shown in the guest menu. Defaults to "Messages" if empty.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Nav Label (Bahasa Melayu)</label>
            <input type="text" value={wishesContent.navLabelBm ?? ""} onChange={(e) => setWishesContent((p) => ({ ...p, navLabelBm: e.target.value }))} placeholder="Auto-translate if empty" className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Page Heading</label>
            <input type="text" value={wishesContent.heading ?? ""} onChange={(e) => setWishesContent((p) => ({ ...p, heading: e.target.value }))} placeholder="Messages" className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Page Heading (Bahasa Melayu)</label>
            <input type="text" value={wishesContent.headingBm ?? ""} onChange={(e) => setWishesContent((p) => ({ ...p, headingBm: e.target.value }))} placeholder="Auto-translate if empty" className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Subheading</label>
            <input type="text" value={wishesContent.subheading ?? ""} onChange={(e) => setWishesContent((p) => ({ ...p, subheading: e.target.value }))} placeholder="Leave us a message" className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Subheading (Bahasa Melayu)</label>
            <input type="text" value={wishesContent.subheadingBm ?? ""} onChange={(e) => setWishesContent((p) => ({ ...p, subheadingBm: e.target.value }))} placeholder="Auto-translate if empty" className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Input Placeholder</label>
            <input type="text" value={wishesContent.placeholder ?? ""} onChange={(e) => setWishesContent((p) => ({ ...p, placeholder: e.target.value }))} placeholder="Write your message here..." className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Input Placeholder (Bahasa Melayu)</label>
            <input type="text" value={wishesContent.placeholderBm ?? ""} onChange={(e) => setWishesContent((p) => ({ ...p, placeholderBm: e.target.value }))} placeholder="Auto-translate if empty" className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Submit Button Label</label>
            <input type="text" value={wishesContent.submitLabel ?? ""} onChange={(e) => setWishesContent((p) => ({ ...p, submitLabel: e.target.value }))} placeholder="Send Message" className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Submit Button Label (Bahasa Melayu)</label>
            <input type="text" value={wishesContent.submitLabelBm ?? ""} onChange={(e) => setWishesContent((p) => ({ ...p, submitLabelBm: e.target.value }))} placeholder="Auto-translate if empty" className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
          </div>
          <TypographyControls label="Heading Typography" value={wishesContent.headingTypography ?? {}} onChange={(v) => setWishesContent((p) => ({ ...p, headingTypography: v }))} />
          <FontSelect label="Message Placeholder Font" value={wishesContent.placeholderTypography?.fontFamily ?? ""} onChange={(fontFamily) => setWishesContent((p) => ({ ...p, placeholderTypography: { ...p.placeholderTypography, fontFamily } }))} options={HEADING_FONT_OPTIONS} placeholder="Use event font" />
          <ButtonColourEditor label="Submit Button Colours" value={wishesContent.buttonColors ?? {}} onChange={(v) => setWishesContent((p) => ({ ...p, buttonColors: v }))} />
          <div className="flex items-center gap-3 pt-2">
            <Button size="sm" onClick={saveSettings} loading={saving}>Save</Button>
            {saveSuccess && <span className="text-sm text-green-600">Saved!</span>}
          </div>
        </div>
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Message">
        <div className="space-y-4">
          <p className="text-sm text-dash-muted">Are you sure you want to delete this message? This cannot be undone.</p>
          {deleteMutation.isError && <p className="text-sm text-dash-danger">{deleteMutation.error instanceof Error ? deleteMutation.error.message : "Delete failed"}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)} loading={deleteMutation.isPending}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
