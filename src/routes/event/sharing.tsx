import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, FormField, Card } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

export function SharingPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(event.draft_slug ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    setSlug(event.draft_slug ?? "");
  }, [event]);

  const publishedUrl = event.slug
    ? `${window.location.origin}/w/${event.slug}`
    : null;
  const draftUrl = slug ? `${window.location.origin}/w/${slug}` : null;

  useEffect(() => {
    const url = publishedUrl ?? draftUrl;
    if (url) {
      generateQrDataUrl(url).then(setQrUrl).catch(() => setQrUrl(null));
    } else {
      setQrUrl(null);
    }
  }, [publishedUrl, draftUrl]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!slug.trim()) {
        setSlugError("Slug is required");
        throw new Error("Slug is required");
      }
      if (!isValidSlug(slug)) {
        setSlugError("Slug must be 2-80 chars, lowercase letters, numbers, and hyphens only");
        throw new Error("Invalid slug");
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
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  function handleCopyLink() {
    const url = publishedUrl ?? draftUrl;
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setSlugError(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Share</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Share your invitation website with guests via link or QR code.
        </p>
      </div>

      {/* Slug Editor */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Website URL</h3>
        <FormField label="URL Slug" error={slugError ?? undefined}>
          <div className="flex items-center gap-2">
            <span className="text-sm text-dash-muted">{window.location.origin}/w/</span>
            <Input
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="sarah-and-john"
              className="flex-1"
            />
          </div>
        </FormField>
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSlug(slugify(slug || event.name))}
          >
            Auto-generate
          </Button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Slug
          </Button>
          {savedMsg && <span className="text-sm text-green-600">Saved!</span>}
          {saveMutation.isError && (
            <span className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </span>
          )}
        </div>
      </Card>

      {/* Share Link */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Share Link</h3>
        {event.is_published && publishedUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input value={publishedUrl} readOnly className="flex-1" />
              <Button variant="secondary" onClick={handleCopyLink}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div>
              <Button
                variant="secondary"
                onClick={() => window.open(publishedUrl, "_blank")}
              >
                Open Guest Page
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
        <h3 className="mb-4 text-sm font-semibold text-dash-text">QR Code</h3>
        {event.is_published && qrUrl ? (
          <div className="flex flex-col items-center gap-4">
            <img src={qrUrl} alt="QR Code" className="h-48 w-48 rounded-lg border border-dash-border" />
            <Button
              variant="secondary"
              onClick={() => downloadQrCode(publishedUrl ?? draftUrl ?? "", `${slug || "invitation"}-qr.png`)}
            >
              Download QR Code
            </Button>
          </div>
        ) : (
          <p className="text-sm text-dash-muted">
            Publish your invitation website to generate a QR code.
          </p>
        )}
      </Card>
    </div>
  );
}
