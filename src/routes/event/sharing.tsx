import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Card } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

export function SharingPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSlug(event.draft_slug ?? event.slug ?? "");
  }, [event]);

  const publishedSlug = event.slug;
  const isPublished = event.is_published && !!publishedSlug;
  const guestUrl = isPublished
    ? `${window.location.origin}/e/${publishedSlug}`
    : null;

  useEffect(() => {
    if (guestUrl) {
      generateQrDataUrl(guestUrl, { width: 256 }).then(setQrCode).catch(() => setQrCode(null));
    } else {
      setQrCode(null);
    }
  }, [guestUrl]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setSlugError(null);
      if (!slug.trim()) {
        setSlugError("Slug is required");
        throw new Error("Slug is required");
      }
      if (!isValidSlug(slug)) {
        setSlugError("Slug must contain only lowercase letters, numbers, and hyphens");
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

  const handleCopyLink = () => {
    if (!guestUrl) return;
    navigator.clipboard.writeText(guestUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadQr = () => {
    if (!guestUrl) return;
    downloadQrCode(guestUrl, `mywedly-${publishedSlug}-qr.png`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Share</h2>
        <p className="text-sm text-dash-muted">
          Share your invitation website with guests
        </p>
      </div>

      {/* Slug editor */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-dash-text">Website URL</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-dash-muted whitespace-nowrap">
            {window.location.origin}/e/
          </span>
          <Input
            type="text"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="your-event-url"
            error={slugError ?? undefined}
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSlug(slugify(event.draft_name ?? event.name))}
          >
            Auto-generate
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            size="sm"
          >
            Save URL
          </Button>
          {saveMutation.isSuccess && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
        </div>
      </Card>

      {/* Published sharing */}
      {isPublished && guestUrl ? (
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-dash-text">
            Share Your Invitation
          </h3>

          {/* Copy link */}
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1">
              Invitation link
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={guestUrl}
                readOnly
                className="flex-1"
              />
              <Button variant="secondary" onClick={handleCopyLink}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          {/* QR code */}
          {qrCode && (
            <div className="flex flex-col items-center gap-3 pt-2">
              <img src={qrCode} alt="QR Code" className="h-48 w-48 rounded-lg border border-dash-border" />
              <Button variant="secondary" size="sm" onClick={handleDownloadQr}>
                Download QR Code
              </Button>
            </div>
          )}

          {/* Open guest page */}
          <div className="pt-2 border-t border-dash-border">
            <a href={guestUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" className="w-full">
                Open Guest Page →
              </Button>
            </a>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <div className="flex flex-col items-center text-center py-6">
            <svg className="h-10 w-10 text-dash-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.181 2.49a53.497 53.497 0 00-2.362 0M9.819 2.49a53.497 53.497 0 012.362 0M9.819 21.51a53.497 53.497 0 012.362 0M13.181 21.51a53.497 53.497 0 00-2.362 0M2.49 13.181a53.497 53.497 0 010-2.362M2.49 9.819a53.497 53.497 0 000 2.362M21.51 13.181a53.497 53.497 0 000-2.362M21.51 9.819a53.497 53.497 0 010 2.362" />
            </svg>
            <p className="text-sm text-dash-muted">
              Publish your invitation website to enable the Guest Page.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
