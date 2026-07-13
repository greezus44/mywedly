import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  QrCode,
  Download,
  Copy,
  Check,
  Link as LinkIcon,
  Share2,
  MessageCircle,
} from "lucide-react";
import { supabase, type UserEvent, type SharingConfig } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, FormField, Skeleton, ErrorState, Toast } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";

function SharingPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: event, isLoading, isError, refetch } = useQuery<UserEvent>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const slug = event?.draft_slug || event?.slug || event?.id;
  const shareUrl = `${window.location.origin}/e/${slug}`;
  const sharingConfig = (event?.draft_sharing_config || event?.sharing_config || {}) as SharingConfig;

  useEffect(() => {
    if (event) {
      setShareMessage(
        sharingConfig.shareMessage ||
          `You're invited to ${event.draft_name || event.name}! View details and RSVP here: ${shareUrl}`,
      );
    }
  }, [event]);

  useEffect(() => {
    if (shareUrl) {
      setQrLoading(true);
      generateQrDataUrl(shareUrl, 256)
        .then((url) => setQrDataUrl(url))
        .catch(() => setQrDataUrl(null))
        .finally(() => setQrLoading(false));
    }
  }, [shareUrl]);

  const updateSharingMutation = useMutation({
    mutationFn: async (config: SharingConfig) => {
      const { data, error } = await supabase
        .from("user_events")
        .update({ draft_sharing_config: config, updated_at: new Date().toISOString() })
        .eq("id", eventId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["event", eventId], data);
      setToast({ message: "Share settings saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save", type: "error" }),
  });

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setToast({ message: "Link copied to clipboard", type: "success" });
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  const handleDownloadPng = useCallback(() => {
    downloadQrCode(shareUrl, `${slug}-qr.png`).then(() => {
      setToast({ message: "QR code downloaded", type: "success" });
    });
  }, [shareUrl, slug]);

  const handleDownloadSvg = useCallback(() => {
    downloadQrSvg(shareUrl, `${slug}-qr.svg`).then(() => {
      setToast({ message: "QR SVG downloaded", type: "success" });
    });
  }, [shareUrl, slug]);

  const handleSaveMessage = useCallback(() => {
    updateSharingMutation.mutate({ ...sharingConfig, shareMessage });
  }, [sharingConfig, shareMessage, updateSharingMutation]);

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return <ErrorState message="Failed to load event" onRetry={refetch} />;
  }

  return (
    <div>
      <div className="px-6 lg:px-8 py-6 border-b border-onyx/10">
        <h1 className="font-heading text-3xl text-onyx">Sharing</h1>
        <p className="mt-1 text-sm text-onyx/50">Share your event link and QR code with guests</p>
      </div>

      <div className="p-6 lg:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Share Link */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="w-5 h-5 text-onyx/50" />
              <h2 className="font-heading text-xl text-onyx">Event Link</h2>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button variant="secondary" onClick={handleCopyLink} className="shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="mt-3 text-xs text-onyx/40">
              Share this link with your guests so they can view the event and RSVP.
            </p>

            <div className="mt-6">
              <FormField label="Share Message" hint="Used when sharing via social media or messaging">
                <Textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  rows={4}
                  placeholder="You're invited! View details and RSVP here..."
                />
              </FormField>
              <Button
                className="mt-3"
                variant="secondary"
                size="sm"
                onClick={handleSaveMessage}
                loading={updateSharingMutation.isPending}
              >
                <Share2 className="w-3.5 h-3.5" /> Save Message
              </Button>
            </div>
          </Card>

          {/* QR Code */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-onyx/50" />
              <h2 className="font-heading text-xl text-onyx">QR Code</h2>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 border border-onyx/10 flex items-center justify-center bg-white">
                {qrLoading ? (
                  <div className="text-sm text-onyx/30">Generating...</div>
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-full h-full" />
                ) : (
                  <div className="text-sm text-onyx/30">Failed to generate</div>
                )}
              </div>
              <p className="mt-3 text-xs text-onyx/40 text-center max-w-xs">
                Guests can scan this code to open the event page directly on their device.
              </p>
              <div className="flex gap-3 mt-4">
                <Button variant="secondary" size="sm" onClick={handleDownloadPng}>
                  <Download className="w-3.5 h-3.5" /> PNG
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDownloadSvg}>
                  <Download className="w-3.5 h-3.5" /> SVG
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default SharingPage;
