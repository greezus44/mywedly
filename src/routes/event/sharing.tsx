import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Input } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { slugify, isValidSlug } from "../../lib/theme";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

export default function SharingPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const origin = window.location.origin;
  const guestUrl = `${origin}/e/${slug || "your-event"}`;

  useEffect(() => {
    if (slug) {
      generateQrDataUrl(`${origin}/e/${slug}`).then(setQrUrl).catch(() => setQrUrl(null));
    } else {
      setQrUrl(null);
    }
  }, [slug, origin]);

  const slugMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSlug(slug)) {
        throw new Error("Invalid slug. Use lowercase letters, numbers, and hyphens (min 2 chars).");
      }
      // Check uniqueness
      const { data: existing, error: checkErr } = await supabase
        .from("user_events")
        .select("id")
        .eq("draft_slug", slug)
        .neq("id", eventId)
        .maybeSingle();
      if (checkErr) throw checkErr;
      if (existing) throw new Error("This URL is already taken. Please choose another.");

      const { error } = await supabase
        .from("user_events")
        .update({
          draft_slug: slug,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSlugError(null);
      setSavedMsg("URL saved!");
      setTimeout(() => setSavedMsg(null), 3000);
    },
    onError: (err: Error) => {
      setSlugError(err.message);
    },
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = guestUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-dash-text">Sharing</h1>
        <p className="text-sm text-dash-muted">Share your invitation website with guests.</p>
      </div>

      {/* URL Editor */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-6">
        <h2 className="text-lg font-semibold text-dash-text">Website URL</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Customize the URL your guests will visit.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <span className="whitespace-nowrap rounded-md border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-muted">
            {origin}/e/
          </span>
          <Input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="your-event"
            error={slugError ?? undefined}
            className="flex-1"
          />
          <Button
            loading={slugMutation.isPending}
            onClick={() => slugMutation.mutate()}
            disabled={slug === (event.draft_slug ?? event.slug)}
          >
            Save
          </Button>
        </div>

        {savedMsg && <p className="mt-2 text-sm text-green-600">{savedMsg}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-dash-border bg-dash-bg px-3 py-2">
            <span className="text-sm text-dash-text">{guestUrl}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? "✓ Copied!" : "Copy Link"}
          </Button>
          {event.slug && (
            <a
              href={`${origin}/e/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-dash-primary hover:underline"
            >
              Open Guest Page ↗
            </a>
          )}
        </div>
      </div>

      {/* QR Code */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-6">
        <h2 className="text-lg font-semibold text-dash-text">QR Code</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Download a QR code to include in printed invitations.
        </p>

        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="QR Code"
              className="h-48 w-48 rounded-lg border border-dash-border bg-white p-2"
            />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-dash-border bg-dash-bg">
              <span className="text-sm text-dash-muted">Enter a URL to generate QR</span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              onClick={() => downloadQrCode(guestUrl, `${slug || "event"}-qr.png`)}
              disabled={!qrUrl}
            >
              Download PNG
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
