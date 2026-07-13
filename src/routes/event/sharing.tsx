import React, { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card, LoadingSpinner } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";
import { isValidSlug } from "../../lib/theme";

export default function Sharing() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSlug(event.draft_slug ?? event.slug ?? "");
  }, [event.id]);

  const guestUrl = `${window.location.origin}/e/${slug}`;
  const slugValid = isValidSlug(slug);

  useEffect(() => {
    if (!slugValid || !slug) { setQrUrl(null); return; }
    generateQrDataUrl(guestUrl).then(setQrUrl).catch(() => setQrUrl(null));
  }, [guestUrl, slugValid, slug]);

  const saveMutation = useMutation({
    mutationFn: async (newSlug: string) => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_slug: newSlug })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (slug !== (event.draft_slug ?? event.slug ?? "") && slugValid) {
      debounceRef.current = setTimeout(() => saveMutation.mutate(slug), 800);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function copyLink() {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Sharing</h2>
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        {saveMutation.isPending && <LoadingSpinner className="h-4 w-4" />}
      </div>

      <Card className="p-5 space-y-4">
        <Input
          label="Website URL"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="my-event-url"
          error={!slugValid && slug ? "Use only lowercase letters, numbers, and hyphens" : undefined}
        />
        <div className="flex items-center gap-2 rounded-lg bg-dash-bg px-3 py-2.5">
          <span className="text-sm text-dash-muted truncate flex-1 font-mono">{guestUrl}</span>
          <Button size="sm" variant="secondary" onClick={copyLink} disabled={!slugValid}>
            {copied ? "✓ Copied" : "Copy"}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-dash-text mb-4">QR Code</h3>
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-lg border border-dash-border" />
          ) : (
            <div className="w-48 h-48 rounded-lg border-2 border-dashed border-dash-border flex items-center justify-center text-sm text-dash-muted">
              Enter a valid URL
            </div>
          )}
          {qrUrl && (
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => downloadQrCode(guestUrl, `${slug}-qr.png`)}
            >
              Download QR
            </Button>
          )}
        </Card>

        <Card className="p-5 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-dash-text mb-4">Guest Page</h3>
          <p className="text-sm text-dash-muted text-center mb-4 max-w-xs">
            Open the guest-facing page to preview what your visitors will see.
          </p>
          <a href={guestUrl} target="_blank" rel="noopener noreferrer">
            <Button disabled={!slugValid}>Open Guest Page</Button>
          </a>
        </Card>
      </div>
    </div>
  );
}
