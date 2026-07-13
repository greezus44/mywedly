import { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type SharingConfig } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, Toggle, FormField, Toast, Skeleton } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";
import { Link as LinkIcon, Copy, Download, QrCode, Check, Share2 } from "lucide-react";

export default function SharingPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const [config, setConfig] = useState<SharingConfig>({});
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const initialized = useRef(false);

  const eventUrl = event?.slug ? `${window.location.origin}/e/${event.slug}` : `${window.location.origin}/e/${eventId}`;
  const slug = event?.draft_slug || event?.slug || eventId || "";

  useEffect(() => {
    if (event && !initialized.current) {
      setConfig(event.draft_sharing_config || event.sharing_config || {});
      initialized.current = true;
    }
  }, [event]);

  useEffect(() => {
    if (eventUrl) {
      setQrLoading(true);
      generateQrDataUrl(eventUrl, 256)
        .then((url) => setQrDataUrl(url))
        .catch(() => setToast({ message: "Failed to generate QR code", type: "error" }))
        .finally(() => setQrLoading(false));
    }
  }, [eventUrl]);

  const saveMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { error } = await supabase
        .from("events")
        .update({ draft_sharing_config: config })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => setToast({ message: "Saved", type: "success" }),
    onError: () => setToast({ message: "Failed to save", type: "error" }),
  });

  const debouncedSave = useRef(debounce(() => saveMutation.mutate(), 600)).current;

  const triggerSave = useCallback(() => {
    if (!initialized.current) return;
    debouncedSave();
  }, [debouncedSave]);

  const update = (patch: Partial<SharingConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    triggerSave();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setToast({ message: "Link copied to clipboard", type: "success" });
    } catch {
      setToast({ message: "Failed to copy link", type: "error" });
    }
  };

  const handleDownloadPng = () => {
    downloadQrCode(eventUrl, `qr-${slug}.png`).catch(() =>
      setToast({ message: "Failed to download QR PNG", type: "error" })
    );
  };

  const handleDownloadSvg = () => {
    downloadQrSvg(eventUrl, `qr-${slug}.svg`).catch(() =>
      setToast({ message: "Failed to download QR SVG", type: "error" })
    );
  };

  if (!event) {
    return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Sharing</h1>

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <LinkIcon className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Event URL</h2>
        </div>
        <div className="flex items-center gap-2">
          <Input value={eventUrl} readOnly className="font-mono text-sm" />
          <Button variant="secondary" onClick={copyLink}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">QR Code</h2>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            {qrLoading ? (
              <Skeleton className="w-48 h-48" />
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-sm">QR unavailable</div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleDownloadPng}>
              <Download className="w-4 h-4" /> Download PNG
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownloadSvg}>
              <Download className="w-4 h-4" /> Download SVG
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Sharing Settings</h2>
        </div>
        <div className="space-y-4">
          <Toggle checked={config.showShareButtons ?? true} onChange={(v) => update({ showShareButtons: v })} label="Show share buttons on event page" />
          <FormField label="Share Message">
            <Textarea value={config.shareMessage || ""} onChange={(e) => update({ shareMessage: e.target.value })} placeholder="You're invited! Join us for our special day." />
          </FormField>
        </div>
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
