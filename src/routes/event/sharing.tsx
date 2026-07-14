import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, Badge } from "../../components/ui";
import { isValidSlug } from "../../lib/theme";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

export function SharingPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(event.draft_slug ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isPublished = event.is_published;
  const publicUrl = `${window.location.origin}/e/${event.slug}`;

  useEffect(() => {
    if (isPublished) {
      generateQrDataUrl(publicUrl).then(setQrDataUrl).catch(() => setQrDataUrl(null));
    }
  }, [isPublished, publicUrl]);

  const saveSlugMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSlug(slug)) {
        throw new Error("Invalid slug. Use only lowercase letters, numbers, and hyphens.");
      }
      const { data: existing } = await supabase
        .from("user_events")
        .select("id")
        .eq("draft_slug", slug)
        .neq("id", eventId)
        .maybeSingle();
      if (existing) throw new Error("This URL slug is already taken. Please choose another.");

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
    },
    onError: (err: Error) => {
      setSlugError(err.message);
    },
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Share</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Share your invitation website with guests via a custom URL or QR code.
        </p>
      </div>

      {/* Website URL */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Website URL</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-dash-muted">{window.location.origin}/e/</span>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="your-event-slug"
              error={slugError ?? undefined}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => saveSlugMutation.mutate()}
              loading={saveSlugMutation.isPending}
              disabled={slug === (event.draft_slug ?? "")}
            >
              Save URL
            </Button>
            {saveSlugMutation.isSuccess && (
              <Badge variant="success">URL saved</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Guest Page Access */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Guest Page</h3>
        {isPublished ? (
          <div className="space-y-4">
            <p className="text-sm text-dash-muted">
              Your invitation website is live. Guests can access it at the URL below.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => window.open(publicUrl, "_blank")}>
                Open Guest Page
              </Button>
              <Button variant="secondary" onClick={handleCopyLink}>
                {copied ? "✓ Copied!" : "Copy Link"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-dash-muted">
            Publish your invitation website to enable the Guest Page.
          </p>
        )}
      </Card>

      {/* QR Code */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">QR Code</h3>
        {isPublished ? (
          <div className="flex flex-col items-center gap-4">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="rounded-lg border border-dash-border" />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-lg border border-dash-border bg-dash-bg">
                <span className="text-sm text-dash-muted">Generating QR code...</span>
              </div>
            )}
            <Button
              variant="secondary"
              onClick={() => downloadQrCode(publicUrl, `${event.slug}-qr.png`)}
            >
              Download QR Code
            </Button>
          </div>
        ) : (
          <p className="text-sm text-dash-muted">
            Publish your invitation website to enable the QR code.
          </p>
        )}
      </Card>
    </div>
  );
}
