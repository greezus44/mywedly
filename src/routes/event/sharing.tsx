import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Input, LoadingSpinner, ErrorState } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";
import type { EventContextValue } from "./event-layout";

interface SharingConfig {
  message?: string;
  facebook?: boolean;
  twitter?: boolean;
  whatsapp?: boolean;
  email?: boolean;
}

const DEFAULT_SHARING: SharingConfig = {
  message: "You're invited! Join us for our special day.",
  facebook: true,
  twitter: true,
  whatsapp: true,
  email: true,
};

export function SharingPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isPublished = event.is_published && !!event.slug;
  const guestPageUrl = isPublished
    ? `${window.location.origin}/e/${event.slug}`
    : null;

  const [sharingConfig, setSharingConfig] = useState<SharingConfig>(() => {
    const draft = (event.draft_sharing_config ?? event.sharing_config) as SharingConfig | null;
    return { ...DEFAULT_SHARING, ...draft };
  });

  const { data: sharingStats, isLoading: statsLoading } = useQuery({
    queryKey: ["sharing-stats", eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("sharing_events")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_sharing_config: sharingConfig as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  async function handleGenerateQr() {
    if (!guestPageUrl) return;
    const dataUrl = await generateQrDataUrl(guestPageUrl, { width: 256 });
    setQrUrl(dataUrl);
  }

  async function handleDownloadQr() {
    if (!guestPageUrl) return;
    await downloadQrCode(guestPageUrl, `${event.slug ?? "invitation"}-qr.png`, { width: 512 });
  }

  async function handleCopyLink() {
    if (!guestPageUrl) return;
    try {
      await navigator.clipboard.writeText(guestPageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function update<K extends keyof SharingConfig>(key: K, val: SharingConfig[K]) {
    setSharingConfig((prev) => ({ ...prev, [key]: val }));
  }

  if (!isPublished) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-8 text-center">
          <div className="mb-4 text-4xl">🔒</div>
          <h2 className="text-lg font-semibold text-dash-text">Publish Required</h2>
          <p className="mt-2 text-sm text-dash-muted">
            Publish your invitation website to enable the Guest Page.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Share Your Invitation</h2>
        <p className="text-sm text-dash-muted">Share your invitation website with guests.</p>
      </div>

      {/* Guest Page Link */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Guest Page URL</h3>
        <div className="flex items-center gap-2">
          <Input
            value={guestPageUrl ?? ""}
            readOnly
            className="flex-1"
          />
          <Button variant="secondary" onClick={handleCopyLink}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-dash-muted">
          Share this link with your guests so they can RSVP and view your invitation.
        </p>
      </Card>

      {/* QR Code */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">QR Code</h3>
        <p className="mb-4 text-sm text-dash-muted">
          Generate a QR code that links directly to your guest page.
        </p>
        <div className="flex flex-col items-center gap-4">
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="h-48 w-48 rounded-md border border-dash-border" />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-md border border-dashed border-dash-border bg-dash-bg text-dash-muted">
              <span className="text-sm">QR code will appear here</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleGenerateQr}>
              Generate QR
            </Button>
            <Button variant="secondary" onClick={handleDownloadQr} disabled={!qrUrl}>
              Download QR
            </Button>
          </div>
        </div>
      </Card>

      {/* Sharing Message */}
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-dash-text">Sharing Message</h3>
        <Input
          label="Default Message"
          value={sharingConfig.message ?? ""}
          onChange={(e) => update("message", e.target.value)}
          placeholder="You're invited!"
        />
        <div className="space-y-2">
          {(["facebook", "twitter", "whatsapp", "email"] as const).map((platform) => (
            <label key={platform} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sharingConfig[platform] ?? false}
                onChange={(e) => update(platform, e.target.checked)}
                className="rounded border-dash-border"
              />
              <span className="text-sm capitalize text-dash-text">{platform}</span>
            </label>
          ))}
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={saveMutation.isPending}
        >
          Save Sharing Settings
        </Button>
        {saveMutation.isError && (
          <p className="text-sm text-dash-danger">
            {saveMutation.error?.message ?? "Failed to save"}
          </p>
        )}
        {saveMutation.isSuccess && (
          <p className="text-sm text-green-700">Saved successfully!</p>
        )}
      </Card>

      {/* Sharing Stats */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Sharing Stats</h3>
        {statsLoading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-dash-primary">{sharingStats ?? 0}</span>
            <span className="text-sm text-dash-muted">total shares</span>
          </div>
        )}
      </Card>
    </div>
  );
}

export default SharingPage;
