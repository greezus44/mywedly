import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";
import type { EventOutletContext } from "./event-layout";

export default function Sharing(): React.ReactElement {
  const { event, eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const currentSlug = event.draft_slug ?? event.slug ?? "";
  const [slug, setSlug] = useState(currentSlug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    setSlug(currentSlug);
  }, [currentSlug]);

  const guestUrl = `${window.location.origin}/e/${slug}`;
  const publishedUrl = event.slug
    ? `${window.location.origin}/e/${event.slug}`
    : guestUrl;

  useEffect(() => {
    generateQrDataUrl(guestUrl, 256).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [guestUrl]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSlug(slug)) {
        throw new Error("Invalid slug. Use only lowercase letters, numbers, and hyphens.");
      }
      const { error } = await supabase
        .from("user_events")
        .update({ draft_slug: slug })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-event", eventId] });
      setSlugError(null);
    },
    onError: (err: Error) => {
      setSlugError(err.message);
    },
  });

  async function handleCopy(): Promise<void> {
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
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-dash-text">Sharing</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Share your invitation website with guests
        </p>
      </div>

      {/* Slug editor */}
      <Card className="mb-6">
        <h3 className="text-sm font-semibold text-dash-text mb-1">Website URL</h3>
        <p className="text-xs text-dash-muted mb-4">
          Customize the URL for your invitation website
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-dash-muted whitespace-nowrap">
              {window.location.origin}/e/
            </span>
            <Input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              error={slugError ?? undefined}
              placeholder="your-event-slug"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={saveMutation.isPending || slug === currentSlug}
              size="sm"
            >
              Save URL
            </Button>
            {saveMutation.isSuccess && (
              <span className="text-xs text-green-600">URL saved</span>
            )}
          </div>
        </div>
      </Card>

      {/* Copy link */}
      <Card className="mb-6">
        <h3 className="text-sm font-semibold text-dash-text mb-1">Share Link</h3>
        <p className="text-xs text-dash-muted mb-4">
          Copy and share this link with your guests
        </p>
        <div className="flex items-center gap-2">
          <Input value={guestUrl} readOnly />
          <Button variant="secondary" onClick={handleCopy} className="shrink-0">
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </Card>

      {/* QR Code */}
      <Card className="mb-6">
        <h3 className="text-sm font-semibold text-dash-text mb-1">QR Code</h3>
        <p className="text-xs text-dash-muted mb-4">
          Guests can scan this code to open your website
        </p>
        <div className="flex flex-col items-center gap-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="h-48 w-48 rounded-lg border border-dash-border" />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-dash-border bg-dash-bg">
              <span className="text-sm text-dash-muted">Generating...</span>
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadQrCode(guestUrl, `${slug || "event"}-qr.png`, 512)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download QR Code
          </Button>
        </div>
      </Card>

      {/* Open guest page */}
      <Card>
        <h3 className="text-sm font-semibold text-dash-text mb-1">Preview Guest Page</h3>
        <p className="text-xs text-dash-muted mb-4">
          Open the guest-facing website in a new tab
        </p>
        <a href={guestUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Guest Page
          </Button>
        </a>
      </Card>
    </div>
  );
}
