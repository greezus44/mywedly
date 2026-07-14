import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card, Badge } from "../../components/ui";

export default function SharingPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const slug = event.draft_slug ?? event.slug ?? "";
  const [slugValue, setSlugValue] = useState(slug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const guestUrl = `${window.location.origin}/e/${slugValue || slugify(event.name)}`;

  useEffect(() => {
    setSlugValue(slug);
  }, [slug]);

  useEffect(() => {
    generateQrDataUrl(guestUrl).then(setQrUrl).catch(() => {});
  }, [guestUrl]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSlug(slugValue)) {
        throw new Error("Invalid slug. Use only lowercase letters, numbers, and hyphens.");
      }
      const { data: existing } = await supabase
        .from("user_events")
        .select("id")
        .eq("slug", slugValue)
        .neq("id", eventId)
        .maybeSingle();
      if (existing) throw new Error("This URL is already taken. Please choose another.");

      const { error } = await supabase
        .from("user_events")
        .update({ draft_slug: slugValue })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setSlugError(null);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => {
      setSlugError(err instanceof Error ? err.message : "Failed to save slug.");
    },
  });

  function handleCopy() {
    navigator.clipboard.writeText(guestUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Sharing</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Share your event website with guests via link or QR code.
        </p>
      </div>

      {/* URL Editor */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Website URL</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-dash-muted">{window.location.origin}/e/</span>
            <Input
              value={slugValue}
              onChange={(e) => {
                setSlugValue(slugify(e.target.value));
                setSlugError(null);
              }}
              placeholder="your-event-url"
              error={slugError ?? undefined}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-sm text-green-600">Saved!</span>}
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={slugValue === slug}
            >
              Save URL
            </Button>
          </div>
        </div>
      </Card>

      {/* Share Link */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Share Link</h3>
        <div className="flex items-center gap-2">
          <Input value={guestUrl} readOnly className="flex-1" />
          <Button variant="secondary" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </Button>
          <a href={guestUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">Open</Button>
          </a>
        </div>
        <p className="mt-2 text-xs text-dash-muted">
          Share this link with your guests so they can view your event website.
        </p>
      </Card>

      {/* QR Code */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-dash-text">QR Code</h3>
        <div className="flex flex-col items-center gap-4">
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="h-48 w-48 rounded-lg border border-dash-border" />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-dash-border bg-dash-bg">
              <span className="text-sm text-dash-muted">Generating...</span>
            </div>
          )}
          <Button variant="secondary" onClick={() => downloadQrCode(guestUrl, `${slugValue || "event"}-qr.png`)}>
            Download QR Code
          </Button>
          <p className="text-xs text-dash-muted">
            Print this QR code on your invitations for easy access.
          </p>
        </div>
      </Card>

      {/* Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-dash-muted">Publication Status</span>
          {event.is_published ? (
            <Badge variant="success">Published</Badge>
          ) : (
            <Badge variant="warning">Draft — not visible to guests</Badge>
          )}
        </div>
      </Card>
    </div>
  );
}
