import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { supabase, type UserEvent, type SharingConfig } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";
import { Card, Toggle, FormField, Toast, Skeleton, Badge } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Copy, Download, FileImage, QrCode, Link2, Loader2 } from "lucide-react";

export default function SharingPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();

  const [config, setConfig] = useState<SharingConfig>({});
  const [qrUrl, setQrUrl] = useState<string>("");
  const [qrLoading, setQrLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  const slug = event?.draft_slug || event?.slug || event?.id;
  const eventUrl = `${window.location.origin}/e/${slug}`;

  useEffect(() => {
    if (!event) return;
    setConfig(event.draft_sharing_config || event.sharing_config || {});
    initialized.current = true;
  }, [event]);

  useEffect(() => {
    if (!event) return;
    let cancelled = false;
    setQrLoading(true);
    generateQrDataUrl(eventUrl, 256)
      .then((url) => { if (!cancelled) setQrUrl(url); })
      .catch(() => { if (!cancelled) setQrUrl(""); })
      .finally(() => { if (!cancelled) setQrLoading(false); });
    return () => { cancelled = true; };
  }, [eventUrl, event]);

  const save = useCallback(async (data: SharingConfig) => {
    if (!eventId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({ draft_sharing_config: data })
        .eq("id", eventId);
      if (error) throw error;
      setToast({ message: "Saved", type: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Save failed", type: "error" });
    } finally {
      setSaving(false);
    }
  }, [eventId]);

  const debouncedSave = useRef(debounce(save, 800)).current;

  const update = (patch: Partial<SharingConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      if (initialized.current) debouncedSave(next);
      return next;
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setToast({ message: "Link copied to clipboard", type: "success" });
    } catch {
      setToast({ message: "Failed to copy link", type: "error" });
    }
  };

  const handleDownloadPng = async () => {
    try {
      await downloadQrCode(eventUrl, `qr-${slug}.png`);
      setToast({ message: "QR code downloaded", type: "success" });
    } catch {
      setToast({ message: "Failed to download QR code", type: "error" });
    }
  };

  const handleDownloadSvg = async () => {
    try {
      await downloadQrSvg(eventUrl, `qr-${slug}.svg`);
      setToast({ message: "QR SVG downloaded", type: "success" });
    } catch {
      setToast({ message: "Failed to download SVG", type: "error" });
    }
  };

  if (!event) {
    return (
      <div className="p-6 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sharing</h1>
          <p className="text-sm text-slate-500">Share your event and manage QR codes</p>
        </div>
        {saving && <span className="text-sm text-slate-500">Saving...</span>}
      </div>

      <Card className="p-6 mb-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2"><Link2 className="w-4 h-4" /> Event URL</h2>
        <div className="flex gap-2">
          <Input value={eventUrl} readOnly className="font-mono text-sm bg-slate-50" />
          <Button variant="secondary" onClick={copyLink}><Copy className="w-4 h-4" /> Copy</Button>
        </div>
        <div className="mt-2">
          <Badge variant="info">{event.is_published ? "Published" : "Draft"}</Badge>
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2"><QrCode className="w-4 h-4" /> QR Code</h2>
        <div className="flex flex-col items-center gap-4">
          {qrLoading ? (
            <div className="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-lg border border-slate-200" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-400">Failed to generate</div>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleDownloadPng} disabled={!qrUrl}><FileImage className="w-4 h-4" /> Download PNG</Button>
            <Button variant="secondary" size="sm" onClick={handleDownloadSvg}><Download className="w-4 h-4" /> Download SVG</Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Sharing Settings</h2>
        <div className="space-y-4">
          <Toggle checked={config.showShareButtons ?? true} onChange={(v) => update({ showShareButtons: v })} label="Show share buttons on event page" />
          <FormField label="Share Message">
            <Textarea value={config.shareMessage || ""} onChange={(e) => update({ shareMessage: e.target.value })} placeholder="You're invited to our event!" />
          </FormField>
        </div>
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
