import { useState } from "react";
import { useEventContext } from "./event-layout";
import { Card, Badge } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

export function SharingPage() {
  const { event } = useEventContext();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isPublished = event.is_published && !!event.slug;
  const shareUrl = isPublished
    ? `${window.location.origin}/e/${event.slug}`
    : null;

  const handleGenerateQr = async () => {
    if (!shareUrl) return;
    const url = await generateQrDataUrl(shareUrl);
    setQrDataUrl(url);
  };

  const handleDownloadQr = async () => {
    if (!shareUrl) return;
    await downloadQrCode(shareUrl, `${event.slug || "event"}-qr.png`);
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Share</h2>
        <p className="text-sm text-dash-muted">Share your event website with guests.</p>
      </div>

      {!isPublished ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-dash-text">Event not published</h3>
            <p className="max-w-sm text-sm text-dash-muted">
              Publish your event in Settings to generate a shareable link and QR code.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Share Link</h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1 rounded-lg border border-dash-border bg-dash-bg px-3 py-2">
                <p className="break-all text-sm text-dash-text">{shareUrl}</p>
              </div>
              <Button onClick={handleCopy} variant="secondary">
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="mt-3">
              <Badge variant="success">Published</Badge>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">QR Code</h3>
            <p className="mb-4 text-sm text-dash-muted">
              Generate a QR code that guests can scan to access your event site.
            </p>
            <div className="flex flex-col items-center gap-4">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="h-48 w-48 rounded-lg border border-dash-border" />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed border-dash-border text-sm text-dash-muted">
                  QR code will appear here
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleGenerateQr} variant="secondary">
                  Generate QR
                </Button>
                {qrDataUrl && (
                  <Button onClick={handleDownloadQr}>Download PNG</Button>
                )}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
