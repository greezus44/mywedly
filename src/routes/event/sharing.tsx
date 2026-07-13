import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

export default function Sharing() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const slug = event.draft_slug ?? event.slug ?? "";
  const [slugInput, setSlugInput] = useState(slug);
  const [slugValid, setSlugValid] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const origin = window.location.origin;
  const guestUrl = `${origin}/e/${slug}`;

  useEffect(() => {
    setSlugInput(slug);
  }, [slug]);

  useEffect(() => {
    if (slug) {
      generateQrDataUrl(guestUrl, 256).then(setQrUrl).catch(() => setQrUrl(null));
    }
  }, [guestUrl, slug]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSlug(slugInput)) throw new Error("Invalid slug");
      const { error } = await supabase
        .from("user_events")
        .update({ draft_slug: slugInput })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
    },
  });

  const handleSlugChange = (val: string) => {
    const cleaned = slugify(val);
    setSlugInput(cleaned);
    setSlugValid(isValidSlug(cleaned));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(guestUrl);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Sharing</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Share your invitation website with guests.
        </p>
      </div>

      {/* Slug Editor */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-dash-text">Website URL</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-dash-muted">{origin}/e/</span>
          <Input
            value={slugInput}
            onChange={(e) => handleSlugChange(e.target.value)}
            error={!slugValid ? "Invalid slug — use lowercase letters, numbers, and hyphens" : undefined}
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={!slugValid || slugInput === slug}
          >
            Save Slug
          </Button>
          {saveMutation.isSuccess && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
          {saveMutation.isError && (
            <span className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed"}
            </span>
          )}
        </div>
      </Card>

      {/* Guest Link */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-dash-text">Guest Link</h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text">
            {guestUrl}
          </code>
          <Button size="sm" variant="secondary" onClick={copyLink}>
            Copy
          </Button>
        </div>
        <a href={guestUrl} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="ghost">
            Open Guest Page →
          </Button>
        </a>
      </Card>

      {/* QR Code */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-dash-text">QR Code</h3>
        {qrUrl ? (
          <div className="flex flex-col items-center gap-4">
            <img src={qrUrl} alt="QR Code" className="h-48 w-48 rounded-lg border border-dash-border" />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => downloadQrCode(guestUrl, `${slug}-qr.png`, 256)}
            >
              Download QR Code
            </Button>
          </div>
        ) : (
          <p className="text-sm text-dash-muted">Save a valid slug to generate QR code.</p>
        )}
      </Card>
    </div>
  );
}
