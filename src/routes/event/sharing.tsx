import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, LoadingSpinner, Badge } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

export function SharingPage() {
  const { event, eventId } = useEventContext();
  const [copied, setCopied] = useState(false);

  const isPublished = event.is_published && !!event.slug;
  const shareUrl = isPublished
    ? `${window.location.origin}/e/${event.slug}`
    : "";

  const { data: qrUrl, isLoading: qrLoading } = useQuery({
    queryKey: ["qr", shareUrl],
    enabled: !!shareUrl,
    queryFn: async () => {
      return generateQrDataUrl(shareUrl, { width: 256, margin: 2 });
    },
  });

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isPublished) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="text-center">
          <div className="mb-4 flex justify-center">
            <svg className="h-12 w-12 text-dash-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.68.283 1.093s-.103.769-.283 1.09m0-2.186c.18.324.283.68.283 1.093s-.103.769-.283 1.09m-4.5 1.093a2.25 2.25 0 1 0 0-2.186m0 2.186c.18.324.283.68.283 1.093s-.103.769-.283 1.09M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-dash-text">Not published yet</h2>
          <p className="mt-2 text-sm text-dash-muted">
            Publish your invitation website to enable the Guest Page.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dash-text">Share</h1>
        <p className="mt-1 text-sm text-dash-muted">
          Share your invitation website with guests.
        </p>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-dash-text">Website URL</h2>
          <Badge variant="success">Published</Badge>
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1"
          />
          <Button onClick={copyLink} variant={copied ? "secondary" : "primary"}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <p className="mt-2 text-sm text-dash-muted">
          Share this link with your guests so they can RSVP and view event details.
        </p>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-dash-text">QR Code</h2>
        {qrLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : qrUrl ? (
          <div className="flex flex-col items-center gap-4">
            <img src={qrUrl} alt="QR Code" className="h-48 w-48 rounded-lg border border-dash-border" />
            <Button
              variant="secondary"
              onClick={() => downloadQrCode(shareUrl, `${event.slug}-qr.png`, { width: 512 })}
            >
              Download QR Code
            </Button>
          </div>
        ) : (
          <p className="text-sm text-dash-muted">QR code unavailable.</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-dash-text">Social Sharing</h2>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`You're invited! ${shareUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-dash-border px-4 py-2 text-sm font-medium text-dash-text hover:bg-dash-bg"
          >
            WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-dash-border px-4 py-2 text-sm font-medium text-dash-text hover:bg-dash-bg"
          >
            Facebook
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-dash-border px-4 py-2 text-sm font-medium text-dash-text hover:bg-dash-bg"
          >
            Twitter / X
          </a>
        </div>
      </Card>
    </div>
  );
}
