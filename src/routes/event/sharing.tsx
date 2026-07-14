import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, FormField, Badge } from "../../components/ui";
import { isValidSlug, slugify } from "../../lib/theme";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

export function SharingPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(event.draft_slug ?? "");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const publishedUrl = event.slug ? `${baseUrl}/${event.slug}` : null;
  const draftUrl = `${baseUrl}/${slug || "preview"}`;

  useEffect(() => {
    setSlug(event.draft_slug ?? "");
  }, [event]);

  useEffect(() => {
    const url = event.is_published ? publishedUrl : draftUrl;
    if (url) {
      generateQrDataUrl(url, { width: 256 }).then(setQrUrl).catch(() => setQrUrl(null));
    } else {
      setQrUrl(null);
    }
  }, [event.is_published, event.slug, slug]);

  const slugValid = isValidSlug(slug);
  const slugChanged = slug !== (event.draft_slug ?? "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_slug: slug })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const handleCopyLink = async () => {
    const url = event.is_published ? publishedUrl : draftUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Share</h2>
        <Badge color={event.is_published ? "success" : "warning"}>
          {event.is_published ? "Published" : "Draft"}
        </Badge>
      </div>

      {/* Slug Editor */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">
          Website URL
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-dash-muted">{baseUrl}/</span>
          <Input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="your-event-url"
            className="flex-1"
            error={slug && !slugValid ? "Invalid slug" : undefined}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={!slugValid || !slugChanged}
            size="sm"
          >
            Save URL
          </Button>
          {saveMutation.isError && (
            <span className="text-sm text-red-600">Failed to save</span>
          )}
          {saveMutation.isSuccess && !slugChanged && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
        </div>
      </div>

      {/* QR Code & Share */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">
          QR Code & Share Link
        </h3>

        {event.is_published && publishedUrl ? (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {qrUrl && (
              <div className="rounded-lg border border-dash-border bg-white p-3">
                <img src={qrUrl} alt="QR Code" className="h-48 w-48" />
              </div>
            )}
            <div className="flex-1 space-y-3">
              <div className="rounded-md border border-dash-border bg-dash-bg p-3">
                <p className="break-all text-sm text-dash-text">{publishedUrl}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleCopyLink} variant="secondary" size="sm">
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                {qrUrl && (
                  <Button
                    onClick={() =>
                      downloadQrCode(publishedUrl, `${slug || "event"}-qr.png`)
                    }
                    variant="secondary"
                    size="sm"
                  >
                    Download QR
                  </Button>
                )}
                <Button
                  onClick={() => window.open(publishedUrl, "_blank")}
                  size="sm"
                >
                  Open Guest Page
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 text-4xl">🔒</div>
            <p className="text-sm text-dash-muted">
              Publish your invitation website to enable the Guest Page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
