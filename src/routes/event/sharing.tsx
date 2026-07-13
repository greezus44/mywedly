import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";
import { Input, Button, Card, Badge } from "../../components/ui";

export default function SharingPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSlug(event.draft_slug ?? event.slug ?? "");
  }, [event]);

  const guestUrl = `${window.location.origin}/e/${slug}`;

  // Generate QR code
  useEffect(() => {
    if (!slug) {
      setQrUrl(null);
      return;
    }
    generateQrDataUrl(guestUrl, { width: 256 })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [guestUrl, slug]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const trimmed = slug.trim();
      if (!trimmed || !isValidSlug(trimmed)) {
        throw new Error("Invalid slug. Use only lowercase letters, numbers, and hyphens.");
      }
      const { error } = await supabase
        .from("user_events")
        .update({ draft_slug: trimmed })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", event.id] });
      setSlugError(null);
      setSavedMsg("Saved successfully");
      setTimeout(() => setSavedMsg(null), 3000);
    },
    onError: (err: Error) => {
      setSlugError(err.message);
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

  const handleOpenGuest = () => {
    window.open(guestUrl, "_blank");
  };

  const handleDownloadQr = () => {
    downloadQrCode(guestUrl, `${slug || "event"}-qr.png`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Sharing</h2>
        <p className="text-sm text-dash-muted">Share your website URL and QR code with guests.</p>
      </div>

      {/* URL Editor */}
      <Card className="space-y-4">
        <div>
          <label className="text-sm font-medium text-dash-text">Website URL</label>
          <p className="mt-1 text-xs text-dash-muted">
            This is the link your guests will visit. Use lowercase letters, numbers, and hyphens.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-dash-muted">{window.location.origin}/e/</span>
          <Input
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="my-event"
            error={slugError ?? undefined}
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save URL
          </Button>
          {savedMsg && <span className="text-sm text-green-600">{savedMsg}</span>}
        </div>
      </Card>

      {/* Guest Link */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dash-text">Guest Link</h3>
          {event.is_published ? (
            <Badge variant="success">Live</Badge>
          ) : (
            <Badge variant="warning">Unpublished</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-dash-border bg-dash-bg px-3 py-2">
          <span className="flex-1 truncate text-sm text-dash-text">{guestUrl}</span>
          <Button size="sm" variant="secondary" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleOpenGuest}>
            Open
          </Button>
        </div>
      </Card>

      {/* QR Code */}
      <Card className="space-y-3">
        <h3 className="text-sm font-semibold text-dash-text">QR Code</h3>
        <p className="text-xs text-dash-muted">
          Download and share this QR code on your physical invitations.
        </p>
        {qrUrl ? (
          <div className="flex flex-col items-center gap-3">
            <img src={qrUrl} alt="QR Code" className="h-48 w-48 rounded-lg border border-dash-border" />
            <Button variant="secondary" onClick={handleDownloadQr}>
              Download QR Code
            </Button>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dash-border bg-dash-bg text-sm text-dash-muted">
            Enter a URL to generate a QR code
          </div>
        )}
      </Card>
    </div>
  );
}
