import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";
import { isValidSlug } from "../../lib/theme";

export function SharingPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Use PUBLISHED slug for the public URL
  const publicSlug = event.slug;
  const publicUrl = publicSlug
    ? `${window.location.origin}/e/${publicSlug}`
    : null;

  useEffect(() => {
    setSlug(event.draft_slug ?? event.slug ?? "");
  }, [event]);

  useEffect(() => {
    if (publicUrl) {
      generateQrDataUrl(publicUrl, 256).then(setQrDataUrl).catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(null);
    }
  }, [publicUrl]);

  const saveSlugMutation = useMutation({
    mutationFn: async () => {
      setSlugError(null);
      if (!slug.trim()) {
        setSlugError("Slug is required.");
        throw new Error("Slug is required.");
      }
      if (!isValidSlug(slug)) {
        setSlugError("Slug must be lowercase letters, numbers, and hyphens only.");
        throw new Error("Invalid slug.");
      }
      const { data: existing } = await supabase
        .from("user_events")
        .select("id")
        .eq("draft_slug", slug)
        .neq("id", eventId)
        .maybeSingle();
      if (existing) {
        setSlugError("This URL is already taken. Please choose another.");
        throw new Error("Slug taken.");
      }
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
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadQr = () => {
    if (!publicUrl) return;
    downloadQrCode(publicUrl, `${event.slug || "event"}-qr.png`, 512);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-dash-text">Share</h2>

      {/* Slug Editor */}
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-dash-text">Website URL</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-dash-muted font-mono whitespace-nowrap">
            {window.location.origin}/e/
          </span>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="your-event-url"
            className="flex-1"
          />
        </div>
        {slugError && <p className="text-sm text-dash-danger">{slugError}</p>}
        {saveSlugMutation.isSuccess && !slugError && (
          <p className="text-sm text-green-600">URL saved!</p>
        )}
        <Button
          size="sm"
          onClick={() => saveSlugMutation.mutate()}
          loading={saveSlugMutation.isPending}
        >
          Save URL
        </Button>
      </Card>

      {/* Guest Page */}
      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-dash-text">Guest Page</h3>
        {event.is_published && publicUrl ? (
          <>
            <p className="text-sm text-dash-muted">
              Share this link with your guests so they can view your invitation website and RSVP.
            </p>
            <div className="flex items-center gap-2 rounded-md border border-dash-border bg-dash-bg p-3">
              <span className="text-sm text-dash-text font-mono flex-1 truncate">{publicUrl}</span>
              <Button size="sm" variant="secondary" onClick={handleCopyLink}>
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
            <div className="flex flex-col items-center gap-4">
              {qrDataUrl && (
                <div className="rounded-lg border border-dash-border bg-white p-4">
                  <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                </div>
              )}
              <Button variant="secondary" onClick={handleDownloadQr}>
                Download QR Code
              </Button>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">Open Guest Page</Button>
              </a>
            </div>
          </>
        ) : (
          <p className="text-sm text-dash-muted">
            Publish your invitation website to enable the Guest Page.
          </p>
        )}
      </Card>
    </div>
  );
}
