import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

export default function Sharing() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState<string>(event.draft_slug ?? event.slug ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    setSlug(event.draft_slug ?? event.slug ?? "");
  }, [event]);

  const guestUrl = `${window.location.origin}/e/${slug}`;

  useEffect(() => {
    if (!slug) {
      setQrUrl("");
      return;
    }
    generateQrDataUrl(guestUrl, { width: 256 }).then(setQrUrl).catch(() => {});
  }, [guestUrl, slug]);

  const saveSlugMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSlugError(null);
    },
    onError: (err) => {
      setSlugError(err instanceof Error ? err.message : "Failed to save slug");
    },
  });

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugError(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadQr = () => {
    downloadQrCode(guestUrl, `${slug || "event"}-qr.png`, { width: 512 });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Sharing</h2>
        <p className="text-sm text-muted">
          Share your website with guests via URL or QR code.
        </p>
      </div>

      {/* Slug editor */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Website URL
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">{window.location.origin}/e/</span>
            <div className="flex-1">
              <Input
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-event"
                error={slugError ?? undefined}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => saveSlugMutation.mutate()}
              loading={saveSlugMutation.isPending}
              disabled={slug === (event.draft_slug ?? event.slug)}
            >
              Save URL
            </Button>
            {saveSlugMutation.isSuccess && (
              <Badge variant="success">Saved!</Badge>
            )}
          </div>
          <p className="text-xs text-muted">
            Auto-suggest: {slugify(event.draft_name ?? event.name) || "my-event"}
          </p>
        </div>
      </Card>

      {/* Guest URL */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Guest Link
        </h3>
        <div className="flex flex-col gap-3">
          <div
            className={cn(
              "flex items-center gap-2 rounded-md border border-border bg-surface-alt px-3 py-2"
            )}
          >
            <span className="flex-1 truncate text-sm text-foreground">
              {guestUrl}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <a href={guestUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost">Open Guest Page</Button>
            </a>
          </div>
        </div>
      </Card>

      {/* QR Code */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-foreground">QR Code</h3>
        <div className="flex flex-col items-center gap-4">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="QR code"
              className="h-48 w-48 rounded-lg border border-border bg-white p-2"
            />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-dashed border-border bg-surface-alt text-muted">
              Enter a URL to generate QR code
            </div>
          )}
          {qrUrl && (
            <Button variant="secondary" onClick={handleDownloadQr}>
              Download QR Code
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
