import { useState, useEffect, useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SharingConfig } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, FormField, Toast } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";
import {
  Share2,
  Copy,
  Download,
  FileCode,
  Link as LinkIcon,
  Loader2,
  Check,
  QrCode,
} from "lucide-react";

export default function SharingPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const slug = event.draft_slug || event.slug || event.id;
  const shareUrl = `${window.location.origin}/e/${slug}`;

  const initialConfig: SharingConfig =
    (event.draft_sharing_config || event.sharing_config || {}) as SharingConfig;

  const [shareMessage, setShareMessage] = useState(
    initialConfig.shareMessage || `You're invited to ${event.draft_name || event.name}! View the invitation here:`
  );

  const updateMutation = useMutation({
    mutationFn: async (config: SharingConfig) => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_sharing_config: config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce((config: SharingConfig) => updateMutation.mutate(config), 600),
    [updateMutation]
  );

  useEffect(() => {
    debouncedSave({ shareMessage });
  }, [shareMessage, debouncedSave]);

  // Generate QR code
  useEffect(() => {
    let cancelled = false;
    setQrLoading(true);
    generateQrDataUrl(shareUrl, 256)
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setToastError("Failed to generate QR code");
      })
      .finally(() => {
        if (!cancelled) setQrLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shareUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setToast("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setToastError("Failed to copy link");
    }
  };

  const handleDownloadPng = async () => {
    try {
      await downloadQrCode(shareUrl, `${slug}-qr.png`);
      setToast("QR code downloaded");
    } catch {
      setToastError("Failed to download QR code");
    }
  };

  const handleDownloadSvg = async () => {
    try {
      await downloadQrSvg(shareUrl, `${slug}-qr.svg`);
      setToast("QR SVG downloaded");
    } catch {
      setToastError("Failed to download QR SVG");
    }
  };

  const fullShareText = `${shareMessage} ${shareUrl}`;

  const handleCopyShareText = async () => {
    try {
      await navigator.clipboard.writeText(fullShareText);
      setToast("Share message copied");
    } catch {
      setToastError("Failed to copy");
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Sharing</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Share your event invitation link and QR code with guests.
        </p>
      </div>

      {/* Share URL */}
      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          Event Link
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-subtle)] border border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
            <LinkIcon className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
            <span className="text-sm text-[var(--color-text)] truncate">{shareUrl}</span>
          </div>
          <Button
            variant={copied ? "primary" : "secondary"}
            onClick={handleCopyLink}
            size="md"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        {!event.is_published && (
          <p className="text-xs text-amber-600">
            This link uses draft content. Publish your event to share the live version.
          </p>
        )}
      </Card>

      {/* QR Code */}
      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          QR Code
        </h3>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            {qrLoading ? (
              <div className="w-48 h-48 flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg-subtle)]" style={{ borderRadius: "var(--radius)" }}>
                <Loader2 className="w-8 h-8 text-[var(--color-text-muted)] animate-spin" />
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-48 h-48 border border-[var(--color-border)]"
                style={{ borderRadius: "var(--radius)" }}
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg-subtle)]" style={{ borderRadius: "var(--radius)" }}>
                <QrCode className="w-12 h-12 text-[var(--color-text-muted)] opacity-30" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3 w-full">
            <p className="text-sm text-[var(--color-text-muted)]">
              Guests can scan this QR code to open your event invitation directly on their phone.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={handleDownloadPng}>
                <Download className="w-3.5 h-3.5" /> Download PNG
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownloadSvg}>
                <FileCode className="w-3.5 h-3.5" /> Download SVG
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Share Message */}
      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          Share Message
        </h3>
        <FormField label="Message" hint="This text will be included when guests share or copy the link">
          <Textarea
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            rows={3}
            placeholder="You're invited! View the invitation here:"
          />
        </FormField>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopyShareText}>
            <Share2 className="w-3.5 h-3.5" /> Copy Full Message
          </Button>
        </div>
        <div className="mt-3 p-3 bg-[var(--color-bg-subtle)] border border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
          <p className="text-sm text-[var(--color-text-muted)] whitespace-pre-wrap">
            {fullShareText}
          </p>
        </div>
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {toastError && <Toast message={toastError} type="error" onClose={() => setToastError(null)} />}
    </div>
  );
}
