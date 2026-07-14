import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

export default function SharingPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const draftSlug = event.draft_slug;
  const [slug, setSlug] = useState(draftSlug ?? event.slug ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const guestUrl = `${origin}/e/${slug}`;

  useEffect(() => {
    if (slug) {
      generateQrDataUrl(guestUrl, 256).then(setQrUrl).catch(() => setQrUrl(""));
    }
  }, [guestUrl, slug]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSlug(slug)) {
        throw new Error("Invalid slug. Use only lowercase letters, numbers, and hyphens (2-50 chars).");
      }
      const { error } = await supabase
        .from("user_events")
        .update({ draft_slug: slug })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSlugError(null);
    },
    onError: (err) => {
      setSlugError(err instanceof Error ? err.message : "Failed to save slug");
    },
  });

  function handleSlugChange(value: string) {
    setSlug(slugify(value));
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-dash-text">Sharing</h2>
        <p className="text-sm text-dash-muted">Share your invitation website with guests.</p>
      </div>

      {/* Slug Editor */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-6">
        <h3 className="text-sm font-semibold text-dash-text mb-3">Website URL</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-dash-muted whitespace-nowrap">{origin}/e/</span>
          <Input
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="my-event"
            error={slugError ?? undefined}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save URL
          </Button>
          {saveMutation.isSuccess && !slugError && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
        </div>
      </div>

      {/* QR Code */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-6">
        <h3 className="text-sm font-semibold text-dash-text mb-3">QR Code</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-lg border border-dash-border" />
          ) : (
            <div className="w-48 h-48 rounded-lg border border-dash-border bg-dash-bg flex items-center justify-center">
              <span className="text-sm text-dash-muted">Generating...</span>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm text-dash-muted">
              Guests can scan this QR code to visit your invitation website.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadQrCode(guestUrl, `${slug}-qr.png`, 512)}
            >
              Download QR Code
            </Button>
          </div>
        </div>
      </div>

      {/* Copy Link */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-6">
        <h3 className="text-sm font-semibold text-dash-text mb-3">Direct Link</h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-md border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text overflow-x-auto">
            {guestUrl}
          </code>
          <Button variant="secondary" size="sm" onClick={copyLink}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <div className="mt-4">
          <a href={guestUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm">
              Open Guest Page →
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
