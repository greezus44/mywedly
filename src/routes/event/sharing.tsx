import React, { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge, FormField } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";
import { cn } from "../../lib/utils";

export const SharingPage: React.FC = () => {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(event.draft_slug || "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const publishedSlug = event.slug;
  const isPublished = event.is_published && !!publishedSlug;
  const draftUrl = slug ? `${window.location.origin}/e/${slug}` : "";
  const publishedUrl = publishedSlug ? `${window.location.origin}/e/${publishedSlug}` : "";

  // Generate QR code for the draft URL
  useEffect(() => {
    if (!draftUrl) {
      setQrCode(null);
      return;
    }
    let cancelled = false;
    generateQrDataUrl(draftUrl, { width: 240 })
      .then((url) => {
        if (!cancelled) setQrCode(url);
      })
      .catch(() => {
        if (!cancelled) setQrCode(null);
      });
    return () => {
      cancelled = true;
    };
  }, [draftUrl]);

  const slugMutation = useMutation({
    mutationFn: async (newSlug: string) => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_slug: newSlug })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err: unknown) => {
      setSlugError(err instanceof Error ? err.message : "Failed to save slug");
    },
  });

  const handleSlugChange = (value: string) => {
    const cleaned = slugify(value);
    setSlug(cleaned);
    if (cleaned && !isValidSlug(cleaned)) {
      setSlugError("Slug must be 2-80 characters, lowercase letters, numbers, and hyphens only.");
    } else {
      setSlugError(null);
    }
  };

  const handleSaveSlug = () => {
    if (!slug || !isValidSlug(slug)) {
      setSlugError("Please enter a valid slug.");
      return;
    }
    slugMutation.mutate(slug);
  };

  const handleCopyLink = useCallback(async () => {
    const url = isPublished ? publishedUrl : draftUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [isPublished, publishedUrl, draftUrl]);

  const handleDownloadQr = () => {
    if (!draftUrl) return;
    downloadQrCode(draftUrl, `${slug || "invitation"}-qr.png`, { width: 480 });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Share</h2>
        <p className="text-sm text-dash-muted">
          Manage your website URL and share your invitation with guests.
        </p>
      </div>

      {/* Slug Editor */}
      <Card>
        <h3 className="mb-1 text-sm font-semibold text-dash-text">Website URL</h3>
        <p className="mb-4 text-sm text-dash-muted">
          Set a custom URL for your invitation website. This will be used in the published link.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex h-10 flex-1 items-center rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-muted">
            {window.location.origin}/e/
          </div>
          <div className="flex-1">
            <Input
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="my-wedding"
              error={slugError ?? undefined}
            />
          </div>
          <Button
            onClick={handleSaveSlug}
            loading={slugMutation.isPending}
            disabled={slugMutation.isPending || !slug || !isValidSlug(slug)}
          >
            {saved ? "Saved!" : "Save"}
          </Button>
        </div>
        {slug && (
          <div className="mt-3 flex items-center gap-2">
            <Badge variant={isPublished ? "success" : "default"}>
              {isPublished ? "Published" : "Draft"}
            </Badge>
            <code className="text-sm text-dash-muted">
              {isPublished ? publishedUrl : draftUrl}
            </code>
          </div>
        )}
      </Card>

      {/* QR Code */}
      <Card>
        <h3 className="mb-1 text-sm font-semibold text-dash-text">QR Code</h3>
        <p className="mb-4 text-sm text-dash-muted">
          Scan to open the invitation website on a mobile device.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {qrCode ? (
            <div className="rounded-lg border border-dash-border bg-white p-3">
              <img src={qrCode} alt="QR Code" className="h-48 w-48" />
            </div>
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-dash-border bg-dash-bg text-sm text-dash-muted">
              Enter a slug to generate QR code
            </div>
          )}
          <div className="space-y-2">
            <Button variant="secondary" onClick={handleDownloadQr} disabled={!qrCode}>
              Download QR Code
            </Button>
            <p className="text-sm text-dash-muted">
              The QR code links to your draft URL. After publishing, it will use the published URL.
            </p>
          </div>
        </div>
      </Card>

      {/* Copy Link */}
      <Card>
        <h3 className="mb-1 text-sm font-semibold text-dash-text">Copy Link</h3>
        <p className="mb-4 text-sm text-dash-muted">
          Share this link directly with your guests.
        </p>
        <div className="flex items-center gap-2">
          <Input
            value={isPublished ? publishedUrl : draftUrl}
            readOnly
            placeholder="Set a slug to generate your link"
          />
          <Button
            variant="secondary"
            onClick={handleCopyLink}
            disabled={!draftUrl && !publishedUrl}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </Card>

      {/* Open Guest Page */}
      <Card>
        <h3 className="mb-1 text-sm font-semibold text-dash-text">Guest Page</h3>
        <p className="mb-4 text-sm text-dash-muted">
          Open the live guest-facing website in a new tab.
        </p>
        {isPublished && publishedUrl ? (
          <a href={publishedUrl} target="_blank" rel="noopener noreferrer">
            <Button>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Guest Page
            </Button>
          </a>
        ) : (
          <div className="rounded-md border border-dash-border bg-dash-bg px-4 py-3 text-sm text-dash-muted">
            Publish your invitation website to enable the Guest Page.
          </div>
        )}
      </Card>
    </div>
  );
};
