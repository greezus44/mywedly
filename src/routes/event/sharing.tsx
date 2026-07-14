import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Card, Badge, LoadingSpinner } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";

interface SharingConfig {
  message?: string;
  subject?: string;
}

export function SharingPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<SharingConfig>(
    (event.draft_sharing_config as SharingConfig | null) ?? (event.sharing_config as SharingConfig | null) ?? {}
  );
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const isPublished = event.is_published && !!event.slug;
  const shareUrl = isPublished ? `${window.location.origin}/e/${event.slug}` : null;

  useEffect(() => {
    if (shareUrl) {
      generateQrDataUrl(shareUrl).then(setQrDataUrl).catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(null);
    }
  }, [shareUrl]);

  function update<K extends keyof SharingConfig>(key: K, val: SharingConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: val }));
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_sharing_config: config as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  };

  const handleShareNative = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.draft_name || event.name || "Our Event",
          text: config.message || "You're invited! View our invitation website:",
          url: shareUrl,
        });
      } catch {
        // User cancelled — ignore
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Sharing</h2>
          <p className="text-sm text-dash-muted">Share your invitation with guests.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          {savedMsg ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
        </p>
      )}

      {/* Publish status */}
      {!isPublished ? (
        <Card>
          <div className="flex items-center gap-3">
            <Badge variant="warning">Not Published</Badge>
            <p className="text-sm text-dash-muted">
              Your invitation website isn't published yet. Publish your event to get a shareable link.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Share Link */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Share Link</h3>
            <div className="flex items-center gap-2">
              <Input
                value={shareUrl ?? ""}
                readOnly
                className="flex-1"
              />
              <Button variant="secondary" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="mt-4">
              <Button onClick={handleShareNative}>Share Link</Button>
            </div>
          </Card>

          {/* QR Code */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">QR Code</h3>
            {qrDataUrl ? (
              <div className="flex flex-col items-center gap-4">
                <img src={qrDataUrl} alt="QR Code" className="h-48 w-48 rounded-lg border border-dash-border" />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => downloadQrCode(shareUrl!, `${event.slug}-qr.png`)}>
                    Download PNG
                  </Button>
                  <Button variant="secondary" onClick={() => downloadQrSvg(shareUrl!, `${event.slug}-qr.svg`)}>
                    Download SVG
                  </Button>
                </div>
              </div>
            ) : (
              <LoadingSpinner />
            )}
          </Card>
        </>
      )}

      {/* Sharing Message */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Sharing Message</h3>
        <div className="space-y-4">
          <Input
            label="Email Subject"
            value={config.subject ?? ""}
            onChange={(e) => update("subject", e.target.value)}
            placeholder="You're invited to our wedding!"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Message</label>
            <textarea
              value={config.message ?? ""}
              onChange={(e) => update("message", e.target.value)}
              placeholder="You're invited! View our invitation website:"
              rows={4}
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
