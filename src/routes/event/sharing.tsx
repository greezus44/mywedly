import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { Input, FormField } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

export default function Sharing() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const guestUrl = `${window.location.origin}/e/${slug || "your-event"}`;

  useEffect(() => {
    let active = true;
    generateQrDataUrl(guestUrl).then((url) => { if (active) setQrUrl(url); }).catch(() => {});
    return () => { active = false; };
  }, [guestUrl]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSlug(slug)) throw new Error("Invalid slug. Use lowercase letters, numbers, and hyphens only.");
      const { data, error } = await supabase
        .from("user_events")
        .update({ draft_slug: slug })
        .eq("id", event.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", event.id] });
      setSlugError(null);
    },
    onError: (err) => {
      setSlugError(err instanceof Error ? err.message : "Failed to save slug.");
    },
  });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Sharing</h2>
        <p className="mt-1 text-sm text-dash-muted">Share your website URL and QR code with guests.</p>
      </div>

      {/* Slug editor */}
      <div className="rounded-xl border border-dash-border bg-dash-surface p-6">
        <h3 className="text-lg font-semibold text-dash-text">Website URL</h3>
        <p className="mt-1 text-sm text-dash-muted">Customize the URL slug for your website.</p>
        <div className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <FormField label="URL Slug">
              <div className="flex items-center rounded-md border border-dash-border bg-dash-surface">
                <span className="border-r border-dash-border px-3 py-2 text-sm text-dash-muted">{window.location.origin}/e/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="your-event"
                  className="w-full px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
                />
              </div>
            </FormField>
          </div>
          <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            Save Slug
          </Button>
        </div>
        {slugError && <p className="mt-2 text-xs text-dash-danger">{slugError}</p>}
        {saveMutation.isSuccess && !slugError && (
          <p className="mt-2 text-xs text-green-600">Slug saved successfully.</p>
        )}
      </div>

      {/* Guest URL */}
      <div className="rounded-xl border border-dash-border bg-dash-surface p-6">
        <h3 className="text-lg font-semibold text-dash-text">Guest Link</h3>
        <p className="mt-1 text-sm text-dash-muted">Share this link with your guests.</p>
        <div className="mt-4 flex items-center gap-3">
          <code className="flex-1 truncate rounded-md border border-dash-border bg-dash-bg px-4 py-2 text-sm text-dash-text">
            {guestUrl}
          </code>
          <Button variant="secondary" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button variant="secondary" onClick={() => window.open(guestUrl, "_blank")}>
            Open
          </Button>
        </div>
      </div>

      {/* QR Code */}
      <div className="rounded-xl border border-dash-border bg-dash-surface p-6">
        <h3 className="text-lg font-semibold text-dash-text">QR Code</h3>
        <p className="mt-1 text-sm text-dash-muted">Guests can scan this code to access your website.</p>
        <div className="mt-4 flex flex-col items-center gap-4">
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="h-48 w-48 rounded-lg border border-dash-border" />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-dash-border bg-dash-bg">
              <span className="text-sm text-dash-muted">Generating...</span>
            </div>
          )}
          <Button variant="secondary" onClick={() => downloadQrCode(guestUrl, `${slug || "event"}-qr.png`)}>
            Download QR Code
          </Button>
        </div>
      </div>
    </div>
  );
}
