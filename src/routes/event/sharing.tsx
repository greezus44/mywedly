import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type SharingConfig } from "../../lib/supabase";
import { Card, FormField, Toggle, Toast } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import {
  Copy, Download, QrCode, Loader2, Check, FileImage,
} from "lucide-react";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";
import { debounce } from "../../lib/utils";

export default function Sharing() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const [config, setConfig] = useState<SharingConfig>({});
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  const eventUrl = event?.slug
    ? `${window.location.origin}/e/${event.slug}`
    : `${window.location.origin}/e/${eventId}`;

  useEffect(() => {
    if (event && !initialized.current) {
      setConfig(event.draft_sharing_config || event.sharing_config || {});
      initialized.current = true;
    }
  }, [event]);

  useEffect(() => {
    let active = true;
    setQrLoading(true);
    generateQrDataUrl(eventUrl, 256)
      .then((url) => { if (active) setQrUrl(url); })
      .catch(() => { if (active) setQrUrl(null); })
      .finally(() => { if (active) setQrLoading(false); });
    return () => { active = false; };
  }, [eventUrl]);

  const saveMutation = useMutation<void, Error, SharingConfig>({
    mutationFn: async (cfg) => {
      setSaving(true);
      const { error } = await supabase
        .from("events")
        .update({ draft_sharing_config: cfg })
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => setToast({ message: "Saved", type: "success" }),
    onError: () => setToast({ message: "Failed to save", type: "error" }),
    onSettled: () => setSaving(false),
  });

  const debouncedSave = useRef(
    debounce((cfg: SharingConfig) => {
      saveMutation.mutate(cfg);
    }, 800)
  ).current;

  const update = useCallback(
    (patch: Partial<SharingConfig>) => {
      const next = { ...config, ...patch };
      setConfig(next);
      debouncedSave(next);
    },
    [config, debouncedSave]
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setToast({ message: "Link copied", type: "success" });
    } catch {
      setToast({ message: "Failed to copy link", type: "error" });
    }
  };

  const handleDownloadPng = async () => {
    try {
      await downloadQrCode(eventUrl, `qr-${event?.slug || eventId}.png`);
      setToast({ message: "PNG downloaded", type: "success" });
    } catch {
      setToast({ message: "Failed to download PNG", type: "error" });
    }
  };

  const handleDownloadSvg = async () => {
    try {
      await downloadQrSvg(eventUrl, `qr-${event?.slug || eventId}.svg`);
      setToast({ message: "SVG downloaded", type: "success" });
    } catch {
      setToast({ message: "Failed to download SVG", type: "error" });
    }
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sharing</h1>
          <p className="text-sm text-slate-500">Share your event and configure sharing options.</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
          </div>
        )}
      </div>

      <Card className="p-6 mb-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Event Link</h3>
        <div className="flex items-center gap-2">
          <Input value={eventUrl} readOnly className="flex-1 font-mono text-sm" />
          <Button variant="secondary" onClick={copyLink}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">QR Code</h3>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleDownloadPng}>
              <Download className="w-4 h-4" /> PNG
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownloadSvg}>
              <FileImage className="w-4 h-4" /> SVG
            </Button>
          </div>
        </div>
        <div className="flex justify-center">
          {qrLoading ? (
            <div className="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-lg">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-lg border border-slate-200" />
          ) : (
            <div className="w-48 h-48 flex flex-col items-center justify-center bg-slate-50 rounded-lg text-slate-400">
              <QrCode className="w-8 h-8 mb-2" />
              <span className="text-sm">Failed to generate</span>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Sharing Settings</h3>
        <Toggle
          checked={config.showShareButtons ?? true}
          onChange={(v) => update({ showShareButtons: v })}
          label="Show share buttons on event page"
        />
        <FormField label="Share Message" hint="Pre-filled text when guests share your event">
          <Textarea
            value={config.shareMessage || ""}
            onChange={(e) => update({ shareMessage: e.target.value })}
            placeholder="You're invited! Check out the event details here:"
          />
        </FormField>
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
