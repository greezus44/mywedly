import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOutletContext } from "./event-layout";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

export default function Sharing() {
  const { event, eventId } = useOutletContext();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const guestUrl = `${window.location.origin}/e/${slug}`;

  useEffect(() => {
    if (slug) {
      generateQrDataUrl(guestUrl).then(setQrDataUrl).catch(() => {});
    }
  }, [guestUrl]);

  const saveSlugMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSlug(slug)) {
        throw new Error("Invalid slug. Use only lowercase letters, numbers, and hyphens (2-80 chars).");
      }
      const { data, error } = await supabase
        .from("user_events")
        .update({ draft_slug: slug })
        .eq("id", eventId)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_event", eventId] });
      setSlugError(null);
    },
    onError: (err) => {
      setSlugError(err instanceof Error ? err.message : "Failed to save slug");
    },
  });

  const handleSlugChange = (value: string) => {
    const slugified = slugify(value);
    setSlug(slugified);
    setSlugError(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleOpenGuestPage = () => {
    window.open(guestUrl, "_blank");
  };

  const handleDownloadQr = () => {
    downloadQrCode(guestUrl, `${slug}-qr.png`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-lg font-semibold text-dash-text">Sharing</h2>

      {/* Slug editor */}
      <div className="mb-6 rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-1 text-sm font-semibold text-dash-text">
          Website URL
        </h3>
        <p className="mb-3 text-sm text-dash-muted">
          Customize the URL for your invitation website.
        </p>
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-sm text-dash-muted">
            {window.location.origin}/e/
          </span>
          <Input
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="my-event"
            error={slugError ?? undefined}
            className="flex-1"
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button
            onClick={() => saveSlugMutation.mutate()}
            loading={saveSlugMutation.isPending}
            size="sm"
          >
            Save URL
          </Button>
          {saveSlugMutation.isSuccess && !slugError && (
            <span className="text-sm text-green-600">URL saved!</span>
          )}
        </div>
      </div>

      {/* Guest link */}
      <div className="mb-6 rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-1 text-sm font-semibold text-dash-text">
          Guest Link
        </h3>
        <p className="mb-3 text-sm text-dash-muted">
          Share this link with your guests so they can access your invitation website.
        </p>
        <div className="flex items-center gap-2 rounded-md border border-dash-border bg-dash-bg px-3 py-2">
          <span className="flex-1 truncate text-sm text-dash-text">{guestUrl}</span>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={handleOpenGuestPage}>
            Open Guest Page
          </Button>
        </div>
      </div>

      {/* QR Code */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-1 text-sm font-semibold text-dash-text">
          QR Code
        </h3>
        <p className="mb-3 text-sm text-dash-muted">
          Guests can scan this QR code to open your invitation website.
        </p>
        <div className="flex flex-col items-center gap-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="h-48 w-48 rounded-md border border-dash-border"
            />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-md border border-dash-border bg-dash-bg">
              <span className="text-sm text-dash-muted">Generating...</span>
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={handleDownloadQr}>
            Download QR Code
          </Button>
        </div>
      </div>
    </div>
  );
}
