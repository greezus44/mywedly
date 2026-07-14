import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";
import { isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge } from "../../components/ui";

export function SharingPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState(event.draft_slug || event.slug || "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // The PUBLIC URL uses the PUBLISHED slug, not the draft slug
  const publicUrl =
    event.is_published && event.slug
      ? `${window.location.origin}/e/${event.slug}`
      : null;

  useEffect(() => {
    if (!publicUrl) {
      setQrDataUrl(null);
      return;
    }
    generateQrDataUrl(publicUrl, { width: 200, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [publicUrl]);

  const slugMutation = useMutation({
    mutationFn: async (newSlug: string) => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_slug: newSlug,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSlugError(null);
    },
    onError: (err: Error) => setSlugError(err.message),
  });

  const handleSaveSlug = () => {
    setSlugError(null);
    if (!slug.trim()) {
      setSlugError("Slug is required");
      return;
    }
    if (!isValidSlug(slug)) {
      setSlugError("Slug can only contain lowercase letters, numbers, and hyphens");
      return;
    }
    slugMutation.mutate(slug.trim());
  };

  const handleCopy = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGuestPage = () => {
    if (!publicUrl) return;
    window.open(publicUrl, "_blank");
  };

  const handleDownloadQr = async () => {
    if (!publicUrl) return;
    await downloadQrCode(publicUrl, `${event.slug || "event"}-qr.png`, {
      width: 400,
      margin: 2,
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-dash-text">Share Your Invitation</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Share your invitation website with guests via link or QR code.
        </p>
      </div>

      {/* Publish status */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-dash-text">Publish Status</h3>
            <p className="mt-1 text-sm text-dash-muted">
              {event.is_published
                ? "Your invitation website is published and live."
                : "Your invitation website is not yet published."}
            </p>
          </div>
          {event.is_published ? (
            <Badge variant="success">Published</Badge>
          ) : (
            <Badge variant="default">Draft</Badge>
          )}
        </div>
      </Card>

      {/* URL Slug editor */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text">Website URL</h3>
        <p className="mt-1 text-sm text-dash-muted">
          Customize the URL for your invitation website. Changes take effect when you publish.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className="whitespace-nowrap text-sm text-dash-muted">
            {window.location.origin}/e/
          </span>
          <Input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-event"
            error={slugError ?? undefined}
          />
          <Button
            onClick={handleSaveSlug}
            loading={slugMutation.isPending}
            disabled={slug === (event.draft_slug || event.slug)}
          >
            Save
          </Button>
        </div>
        {slugMutation.isSuccess && !slugError && (
          <p className="mt-2 text-sm text-green-600">URL saved!</p>
        )}
      </Card>

      {/* Guest Page section */}
      {event.is_published && publicUrl ? (
        <Card>
          <h3 className="text-sm font-medium text-dash-text">Guest Page</h3>
          <p className="mt-1 text-sm text-dash-muted">
            Share this link with your guests so they can view your invitation website.
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-dash-border bg-dash-bg p-3">
            <code className="flex-1 truncate text-sm text-dash-text">{publicUrl}</code>
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>

          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="rounded-lg border border-dash-border"
                  style={{ width: 200, height: 200 }}
                />
                <Button size="sm" variant="ghost" onClick={handleDownloadQr}>
                  Download QR
                </Button>
              </div>
            )}

            <div className="flex flex-1 flex-col gap-3">
              <Button onClick={handleOpenGuestPage}>Open Guest Page</Button>
              <p className="text-sm text-dash-muted">
                The QR code encodes the same URL. Guests can scan it with their phone camera
                to open your invitation website.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="text-4xl">🔗</span>
            <h3 className="text-sm font-medium text-dash-text">Guest Page Not Available</h3>
            <p className="text-sm text-dash-muted">
              Publish your invitation website to enable the Guest Page.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
