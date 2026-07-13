import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, SharingConfig } from "../../lib/supabase";
import { DEFAULT_SHARING_CONFIG } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, FormField, Toggle, Toast, Skeleton } from "../../components/ui/index";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";
import { cn } from "../../lib/utils";
import { Copy, Download, Link2, QrCode, Loader2, Check } from "lucide-react";

export default function SharingPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [qrLoading, setQrLoading] = useState(false);

  const [config, setConfig] = useState<SharingConfig>({ ...DEFAULT_SHARING_CONFIG, ...(event?.draft_sharing_config || {}) });

  useEffect(() => {
    if (event) {
      setConfig({ ...DEFAULT_SHARING_CONFIG, ...(event.draft_sharing_config || {}) });
    }
  }, [event]);

  const eventSlug = event?.slug || event?.draft_slug;
  const eventUrl = useMemo(() => {
    if (!eventSlug) return "";
    return `${window.location.origin}/e/${eventSlug}`;
  }, [eventSlug]);

  useEffect(() => {
    if (!eventUrl) return;
    let cancelled = false;
    setQrLoading(true);
    generateQrDataUrl(eventUrl, { color: config.qrColor, bgColor: config.qrBgColor, size: 300 })
      .then((url) => {
        if (!cancelled) setQrUrl(url);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setQrLoading(false);
      });
    return () => { cancelled = true; };
  }, [eventUrl, config.qrColor, config.qrBgColor]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  };

  const saveMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({ draft_sharing_config: config })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      showToast("Sharing settings saved");
    },
    onError: () => showToast("Failed to save", "error"),
  });

  const debouncedSave = useMemo(() => {
    let timer: ReturnType<typeof setTimeout>;
    const fn = async () => {
      if (!eventId) return;
      setSaving(true);
      const { error } = await supabase
        .from("user_events")
        .update({ draft_sharing_config: config })
        .eq("id", eventId);
      setSaving(false);
      if (error) {
        showToast("Failed to save", "error");
      }
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    };
    return (..._args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(fn, 800);
    };
  }, [eventId, queryClient, config]);

  useEffect(() => {
    if (!event) return;
    debouncedSave();
  }, [config, event, debouncedSave]);

  const copyLink = async () => {
    if (!eventUrl) {
      showToast("No event URL available", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("Link copied to clipboard");
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  const downloadPng = () => {
    if (!qrUrl) return;
    downloadQrCode(qrUrl, `qr-${eventSlug || eventId}.png`);
    showToast("QR code downloaded as PNG");
  };

  const downloadSvg = async () => {
    if (!eventUrl) return;
    await downloadQrSvg(eventUrl, `qr-${eventSlug || eventId}.svg`, { color: config.qrColor, bgColor: config.qrBgColor });
    showToast("QR code downloaded as SVG");
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center py-16">
        <Skeleton className="w-full h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Sharing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Share your event and manage sharing settings</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
            </span>
          )}
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Event URL</h2>
        </div>
        {eventUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input value={eventUrl} readOnly className="flex-1 font-mono text-sm bg-gray-50" />
              <Button variant="secondary" onClick={copyLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Share this link with your guests. {event?.is_published ? "Your event is published and live." : "Your event is not yet published."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">No custom URL set. Set a slug in Settings to generate a shareable link.</p>
            <Input value="" readOnly placeholder="No slug set" className="bg-gray-50" />
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">QR Code</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-48 h-48 rounded-lg border border-gray-200 flex items-center justify-center bg-white">
              {qrLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              ) : qrUrl ? (
                <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center text-sm text-gray-400 px-4">Set a slug to generate QR code</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={downloadPng} disabled={!qrUrl}>
                <Download className="w-3.5 h-3.5" /> PNG
              </Button>
              <Button variant="secondary" size="sm" onClick={downloadSvg} disabled={!eventUrl}>
                <Download className="w-3.5 h-3.5" /> SVG
              </Button>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <p className="text-sm text-gray-600">
              Guests can scan this QR code to open your event page. The QR code automatically updates when the URL changes.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="QR Color">
                <Input type="color" value={config.qrColor} onChange={(e) => setConfig({ ...config, qrColor: e.target.value })} className="h-10 p-1" />
              </FormField>
              <FormField label="QR Background">
                <Input type="color" value={config.qrBgColor} onChange={(e) => setConfig({ ...config, qrBgColor: e.target.value })} className="h-10 p-1" />
              </FormField>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Sharing Settings</h2>
        <div className="space-y-5">
          <Toggle
            checked={config.showShareButtons}
            onChange={(v) => setConfig({ ...config, showShareButtons: v })}
            label="Show share buttons on event page"
          />
          <FormField label="Share Message" hint="This text appears when guests share your event link">
            <Textarea
              value={config.shareMessage}
              onChange={(e) => setConfig({ ...config, shareMessage: e.target.value })}
              rows={3}
              placeholder="You're invited! Join us for our special event."
            />
          </FormField>
        </div>
      </Card>

      {toast && <Toast message={toast} type={toastType} onClose={() => setToast(null)} />}
    </div>
  );
}
