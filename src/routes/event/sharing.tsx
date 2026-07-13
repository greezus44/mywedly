import { useState, useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SharingConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, FormField, Toggle, Toast } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";
import { Share2, Copy, Image as ImageIcon, FileCode, Link as LinkIcon, Check } from "lucide-react";

const DEFAULT_SHARING_CONFIG: SharingConfig = {
  showShareButtons: true,
  shareMessage: "",
};

function SharingPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [config, setConfig] = useState<SharingConfig>(
    () => (event.draft_sharing_config || event.sharing_config || DEFAULT_SHARING_CONFIG) as SharingConfig
  );

  const shareUrl = event.is_published && event.slug
    ? `${window.location.origin}/e/${event.slug}`
    : `${window.location.origin}/event/${eventId}/preview`;

  useEffect(() => {
    setConfig((event.draft_sharing_config || event.sharing_config || DEFAULT_SHARING_CONFIG) as SharingConfig);
  }, [event]);

  // Generate QR code
  useEffect(() => {
    let cancelled = false;
    setQrLoading(true);
    generateQrDataUrl(shareUrl, 256)
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(null); })
      .finally(() => { if (!cancelled) setQrLoading(false); });
    return () => { cancelled = true; };
  }, [shareUrl]);

  const saveMutation = useMutation({
    mutationFn: async (data: SharingConfig) => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_sharing_config: data, updated_at: new Date().toISOString() })
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToastType("success");
      setToast("Sharing settings saved");
    },
    onError: (err: Error) => {
      setToastType("error");
      setToast(`Failed to save: ${err.message}`);
    },
  });

  const update = (partial: Partial<SharingConfig>) => {
    const updated = { ...config, ...partial };
    setConfig(updated);
    saveMutation.mutate(updated);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setToastType("success");
      setToast("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setToastType("error");
      setToast("Failed to copy link");
    }
  };

  const handleDownloadPng = async () => {
    try {
      await downloadQrCode(shareUrl, `${event.draft_name || event.name || "event"}-qr.png`);
      setToastType("success");
      setToast("QR code downloaded");
    } catch {
      setToastType("error");
      setToast("Failed to download QR code");
    }
  };

  const handleDownloadSvg = async () => {
    try {
      await downloadQrSvg(shareUrl, `${event.draft_name || event.name || "event"}-qr.svg`);
      setToastType("success");
      setToast("QR SVG downloaded");
    } catch {
      setToastType("error");
      setToast("Failed to download SVG");
    }
  };

  const shareText = config.shareMessage || `You're invited to ${event.draft_name || event.name}! View details and RSVP here:`;
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: event.draft_name || event.name, text: shareText, url: shareUrl });
      } catch { /* user cancelled */ }
    } else {
      copyLink();
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="font-heading text-2xl text-[var(--color-text)] flex items-center gap-2">
          <Share2 className="w-5 h-5" /> Sharing
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Share your event link and QR code with guests</p>
      </div>

      {/* Event Link */}
      <Card className="p-5 mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Event Link</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-[var(--color-bg-subtle)] border border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
            <LinkIcon className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
            <span className="text-sm text-[var(--color-text)] truncate">{shareUrl}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={copyLink}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        {!event.is_published && (
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            This is a preview link. Publish your event to get a public link.
          </p>
        )}
        <div className="mt-3">
          <Button variant="ghost" size="sm" onClick={nativeShare}>
            <Share2 className="w-3.5 h-3.5" /> Share via...
          </Button>
        </div>
      </Card>

      {/* QR Code */}
      <Card className="p-5 mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-3">QR Code</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-48 h-48 flex items-center justify-center bg-[var(--color-bg-subtle)] border border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
            {qrLoading ? (
              <div className="w-32 h-32 animate-pulse bg-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }} />
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-40 h-40" />
            ) : (
              <div className="text-xs text-[var(--color-text-muted)] text-center px-4">Failed to generate QR</div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">
              Guests can scan this QR code to open your event page on their phone.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={handleDownloadPng} disabled={!qrDataUrl}>
                <ImageIcon className="w-3.5 h-3.5" /> Download PNG
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownloadSvg} disabled={!qrDataUrl}>
                <FileCode className="w-3.5 h-3.5" /> Download SVG
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Share Settings */}
      <Card className="p-5 space-y-5">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Share Settings</h3>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-[var(--color-text)]">Show Share Buttons</h4>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Display social share buttons on your event page</p>
          </div>
          <Toggle
            checked={config.showShareButtons ?? true}
            onChange={(v) => update({ showShareButtons: v })}
          />
        </div>

        <FormField label="Share Message" hint="Default text used when guests share your event">
          <Textarea
            value={config.shareMessage || ""}
            onChange={(e) => update({ shareMessage: e.target.value })}
            placeholder={`You're invited to ${event.draft_name || event.name}! View details and RSVP here:`}
            rows={3}
          />
        </FormField>

        {/* Preview */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Share Preview</p>
          <div className="p-4 bg-[var(--color-bg-subtle)] border border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
            <p className="text-sm text-[var(--color-text)]">{shareText}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">{shareUrl}</p>
          </div>
        </div>
      </Card>

      {toast && <Toast message={toast} type={toastType} onClose={() => setToast(null)} />}
    </div>
  );
}

export default SharingPage;
