import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

export function SharingPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const isPublished = event.is_published && !!event.slug;
  // CRITICAL: Use published slug for the public URL, NOT draft_slug
  const publicSlug = event.slug;
  const guestUrl = publicSlug
    ? `${window.location.origin}/e/${publicSlug}`
    : "";

  useEffect(() => {
    if (guestUrl) {
      generateQrDataUrl(guestUrl, 256).then(setQrDataUrl).catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(null);
    }
  }, [guestUrl]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanedSlug = slugify(slug);
      if (!isValidSlug(cleanedSlug)) {
        throw new Error("Invalid slug. Use letters, numbers, and hyphens only.");
      }
      const { data, error } = await supabase
        .from("user_events")
        .update({ draft_slug: cleanedSlug })
        .eq("id", eventId)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setSlugError(null);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err: Error) => {
      setSlugError(err.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleCopyLink = async () => {
    if (!guestUrl) return;
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = guestUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQr = () => {
    if (!guestUrl) return;
    downloadQrCode(guestUrl, `${slug || "invitation"}-qr.png`, 512);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-dash-text">Share</h1>
        <p className="mt-1 text-sm text-dash-muted">
          Manage your website URL and share it with guests
        </p>
      </div>

      {/* Slug Editor */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Website URL</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-dash-muted">{window.location.origin}/e/</span>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-website"
              className="flex-1"
            />
          </div>
          {slugError && <p className="text-sm text-dash-danger">{slugError}</p>}
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-green-600">✓ Saved</span>}
            <Button onClick={handleSave} loading={saveMutation.isPending} size="sm">
              Save URL
            </Button>
          </div>
          <p className="text-xs text-dash-muted">
            This is the URL your guests will visit. Only published URLs are accessible.
          </p>
        </div>
      </Card>

      {/* Sharing */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Share Your Website</h3>

        {isPublished && guestUrl ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <a href={guestUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="sm">
                  Open Guest Page ↗
                </Button>
              </a>
              <Button variant="secondary" size="sm" onClick={handleCopyLink}>
                {copied ? "✓ Copied!" : "Copy Link"}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownloadQr}>
                Download QR Code
              </Button>
            </div>

            <div className="rounded-lg border border-dash-border bg-dash-bg p-3">
              <p className="text-sm font-medium text-dash-text">Public URL</p>
              <p className="mt-1 break-all text-sm text-dash-primary">{guestUrl}</p>
            </div>

            {qrDataUrl && (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="h-48 w-48 rounded-lg border border-dash-border"
                />
                <p className="text-xs text-dash-muted">
                  Guests can scan this to open your invitation website
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dash-border bg-dash-bg p-6 text-center">
            <p className="text-sm text-dash-muted">
              Publish your invitation website to enable the Guest Page.
            </p>
          </div>
        )}
      </Card>

      {/* Publish Status */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-dash-text">Publish Status</h3>
            <p className="mt-1 text-sm text-dash-muted">
              {isPublished
                ? "Your website is live and accessible to guests."
                : "Your website is in draft mode. Publish it to make it live."}
            </p>
          </div>
          {isPublished ? (
            <Badge color="success">Published</Badge>
          ) : (
            <Badge color="warning">Draft</Badge>
          )}
        </div>
      </Card>
    </div>
  );
}
