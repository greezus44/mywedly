import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";
import { Button } from "../../components/ui/Button";
import { Input, Card, Badge } from "../../components/ui";
import type { EventOutletContext } from "./event-layout";

export default function Sharing() {
  const { event, eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const guestUrl = `${origin}/e/${slug}`;
  const slugValid = isValidSlug(slug);

  useEffect(() => {
    if (slugValid) {
      generateQrDataUrl(guestUrl, { width: 256 })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(null);
    }
  }, [guestUrl, slugValid]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!slugValid) {
        setSlugError("Invalid slug. Use only lowercase letters, numbers, and hyphens.");
        throw new Error("Invalid slug");
      }
      // Check uniqueness
      const { data: existing, error: checkError } = await supabase
        .from("user_events")
        .select("id")
        .eq("draft_slug", slug)
        .neq("id", eventId)
        .maybeSingle();
      if (checkError) throw checkError;
      if (existing) {
        setSlugError("This URL is already taken. Please choose another.");
        throw new Error("Slug already taken");
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
    },
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadQr = () => {
    downloadQrCode(guestUrl, `${slug || "event"}-qr.png`);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Sharing</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Share your invitation website with guests
          </p>
        </div>

        {/* Slug editor */}
        <Card>
          <h3 className="text-sm font-semibold text-dash-text">Website URL</h3>
          <p className="mt-1 text-xs text-dash-muted">
            Set a custom URL for your invitation website
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-dash-muted">{origin}/e/</span>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugError(null);
              }}
              placeholder="my-event"
              error={slugError ?? undefined}
              className="flex-1"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            {slugValid ? (
              <Badge variant="success">Valid URL</Badge>
            ) : slug ? (
              <Badge variant="danger">Invalid URL</Badge>
            ) : null}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSlug(slugify(event.draft_name ?? event.name))}
            >
              Auto-generate
            </Button>
          </div>
          <div className="mt-4">
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!slugValid || slug === (event.draft_slug ?? event.slug)}
            >
              Save URL
            </Button>
          </div>
        </Card>

        {/* Guest URL */}
        <Card>
          <h3 className="text-sm font-semibold text-dash-text">Guest Link</h3>
          <p className="mt-1 text-xs text-dash-muted">
            Share this link with your guests
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-dash-border bg-dash-bg px-3 py-2">
            <span className="flex-1 truncate text-sm text-dash-text">
              {guestUrl}
            </span>
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="mt-3">
            <a href={guestUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Open Guest Page
              </Button>
            </a>
          </div>
        </Card>

        {/* QR Code */}
        <Card>
          <h3 className="text-sm font-semibold text-dash-text">QR Code</h3>
          <p className="mt-1 text-xs text-dash-muted">
            Guests can scan this to access your invitation website
          </p>
          <div className="mt-4 flex flex-col items-center gap-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="h-48 w-48 rounded-lg border border-dash-border"
              />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-dash-border bg-dash-bg text-sm text-dash-muted">
                Enter a valid URL
              </div>
            )}
            {qrDataUrl && (
              <Button size="sm" variant="secondary" onClick={handleDownloadQr}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Download QR
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
