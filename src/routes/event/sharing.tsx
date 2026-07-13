import { useState, useEffect, useRef } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SharingConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, FormField, Skeleton, Toast, Toggle } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { Share2, Download, Copy, QrCode, Link2, Check, Loader2 } from "lucide-react";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";

interface OutletContext { event: UserEvent; }

export default function SharingPage() {
  const { event } = useOutletContext<OutletContext>();
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [shareConfig, setShareConfig] = useState<SharingConfig>(
    (event.draft_sharing_config || event.sharing_config || {}) as SharingConfig
  );
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const shareUrl = event.is_published && event.slug ? `${window.location.origin}/e/${event.slug}` : "";

  useEffect(() => {
    setShareConfig((event.draft_sharing_config || event.sharing_config || {}) as SharingConfig);
  }, [event.draft_sharing_config, event.sharing_config]);

  // Generate QR code
  useEffect(() => {
    if (!shareUrl) {
      setQrDataUrl(null);
      return;
    }
    setQrLoading(true);
    generateQrDataUrl(shareUrl, 256)
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(null))
      .finally(() => setQrLoading(false));
  }, [shareUrl]);

  const saveMutation = useMutation({
    mutationFn: async (config: SharingConfig) => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_sharing_config: config, updated_at: new Date().toISOString() })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ msg: "Sharing settings saved", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Save failed: ${err.message}`, type: "error" });
    },
  });

  const updateConfig = (partial: Partial<SharingConfig>) => {
    const newConfig = { ...shareConfig, ...partial };
    setShareConfig(newConfig);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate(newConfig);
    }, 600);
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setToast({ msg: "Link copied to clipboard", type: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast({ msg: "Failed to copy link", type: "error" });
    }
  };

  const handleDownloadPng = async () => {
    if (!shareUrl) return;
    try {
      await downloadQrCode(shareUrl, `${event.slug || "event"}-qr.png`);
      setToast({ msg: "QR code downloaded", type: "success" });
    } catch {
      setToast({ msg: "Failed to download QR code", type: "error" });
    }
  };

  const handleDownloadSvg = async () => {
    if (!shareUrl) return;
    try {
      await downloadQrSvg(shareUrl, `${event.slug || "event"}-qr.svg`);
      setToast({ msg: "QR SVG downloaded", type: "success" });
    } catch {
      setToast({ msg: "Failed to download SVG", type: "error" });
    }
  };

  if (!event) return <div className="p-8"><Skeleton className="h-64" /></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="font-heading text-2xl text-gray-900">Sharing</h2>
        <p className="text-sm text-gray-500 mt-1">Generate QR codes and share your event with guests.</p>
      </div>

      {!event.is_published ? (
        <Card className="p-8 text-center">
          <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-heading text-lg text-gray-900 mb-2">Publish to share</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Your event must be published before you can generate a shareable link or QR code.
            Use the "Publish" button at the top of the page.
          </p>
        </Card>
      ) : (
        <>
          {/* Share Link */}
          <Card className="p-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">Event Link</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md">
                <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900 truncate">{shareUrl}</span>
              </div>
              <Button variant="secondary" size="sm" onClick={copyLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </Card>

          {/* QR Code */}
          <Card className="p-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-4">QR Code</h3>
            <div className="flex flex-col items-center gap-4">
              {qrLoading ? (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              ) : qrDataUrl ? (
                <div className="w-48 h-48 bg-white border border-gray-200 rounded-lg p-2">
                  <img src={qrDataUrl} alt="Event QR Code" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg">
                  <QrCode className="w-12 h-12 text-gray-300" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleDownloadPng} disabled={!qrDataUrl}>
                  <Download className="w-4 h-4" /> PNG
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDownloadSvg} disabled={!shareUrl}>
                  <Download className="w-4 h-4" /> SVG
                </Button>
              </div>
            </div>
          </Card>

          {/* Share Message */}
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Share Message</h3>
            <p className="text-sm text-gray-500">This message will be included when guests share your event link on social media.</p>
            <FormField label="Share Message">
              <Textarea
                value={shareConfig.shareMessage || ""}
                onChange={(e) => updateConfig({ shareMessage: e.target.value })}
                placeholder={`You're invited to ${event.draft_name || event.name}! View the invitation and RSVP here:`}
                className="min-h-[100px]"
              />
            </FormField>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-900">Show share buttons on guest page</span>
              <Toggle checked={shareConfig.showShareButtons ?? true} onChange={(v) => updateConfig({ showShareButtons: v })} />
            </div>
          </Card>
        </>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
