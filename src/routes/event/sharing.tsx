import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

export function SharingPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState(event.draft_slug ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    setSlug(event.draft_slug ?? "");
  }, [event.draft_slug]);

  // Generate QR code
  useEffect(() => {
    if (event.slug) {
      const shareUrl = `${window.location.origin}/e/${event.slug}`;
      generateQrDataUrl(shareUrl, 256)
        .then(setQrUrl)
        .catch(() => setQrUrl(null));
    } else {
      setQrUrl(null);
    }
  }, [event.slug]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSlug(slug)) {
        setSlugError("Slug can only contain lowercase letters, numbers, and hyphens.");
        throw new Error("Invalid slug");
      }
      setSlugError(null);
      const { error } = await supabase
        .from("user_events")
        .update({ draft_slug: slug })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  const publishedUrl = event.slug
    ? `${window.location.origin}/e/${event.slug}`
    : null;
  const draftUrl = slug ? `${window.location.origin}/e/${slug}` : null;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Sharing</h2>
        <p className="text-sm text-dash-muted mt-1">
          Manage your website URL and share your invitation with guests.
        </p>
      </div>

      {/* Slug Editor */}
      <Card>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Website URL</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-dash-muted whitespace-nowrap">
              {window.location.origin}/e/
            </span>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugError(null);
              }}
              placeholder="my-wedly-site"
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSlug(slugify(event.draft_name || "my-event"))}
            >
              Auto-generate
            </Button>
          </div>
          {slugError && <p className="text-xs text-dash-danger">{slugError}</p>}
          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!slug || slug === event.draft_slug}
            >
              Save URL
            </Button>
            {saveMutation.isError && (
              <span className="text-sm text-dash-danger">
                {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
              </span>
            )}
            {savedMsg && <span className="text-sm text-green-600">Saved!</span>}
          </div>
        </div>
      </Card>

      {/* Published URL */}
      {publishedUrl && (
        <Card>
          <h3 className="text-sm font-semibold text-dash-text mb-3">
            Published URL
          </h3>
          <div className="flex items-center gap-2">
            <Input value={publishedUrl} readOnly className="flex-1" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(publishedUrl);
              }}
            >
              Copy
            </Button>
          </div>
          <p className="text-xs text-dash-muted mt-2">
            This is the URL your guests will visit. Available after publishing.
          </p>
        </Card>
      )}

      {/* Draft URL */}
      {draftUrl && !publishedUrl && (
        <Card>
          <h3 className="text-sm font-semibold text-dash-text mb-3">
            Preview URL
          </h3>
          <div className="flex items-center gap-2">
            <Input value={draftUrl} readOnly className="flex-1" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigator.clipboard.writeText(draftUrl)}
            >
              Copy
            </Button>
          </div>
          <p className="text-xs text-dash-muted mt-2">
            This URL will be active once you publish your website.
          </p>
        </Card>
      )}

      {/* QR Code */}
      {qrUrl && (
        <Card>
          <h3 className="text-sm font-semibold text-dash-text mb-3">QR Code</h3>
          <div className="flex flex-col items-center gap-4">
            <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (publishedUrl) {
                  downloadQrCode(publishedUrl, `${event.slug || "event"}-qr.png`, 512);
                }
              }}
            >
              Download QR Code
            </Button>
          </div>
          <p className="text-xs text-dash-muted mt-3 text-center">
            Share this QR code with guests for easy access to your invitation.
          </p>
        </Card>
      )}
    </div>
  );
}
