import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Download, Loader2, QrCode, Check } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { Card, FormField, useToast } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { slugify, isValidSlug } from "../../lib/theme";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

export default function SharingPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    setSlug(event.draft_slug ?? event.slug ?? "");
  }, [event]);

  const shareUrl = slug ? `${window.location.origin}/e/${slug}` : "";
  const slugValid = isValidSlug(slug);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!slugValid) throw new Error("Invalid slug");
      const { error } = await supabase
        .from("user_events")
        .update({ draft_slug: slug })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      toast("Slug saved", "success");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  useEffect(() => {
    if (!shareUrl) {
      setQrUrl(null);
      return;
    }
    let cancelled = false;
    generateQrDataUrl(shareUrl, 256)
      .then((url) => {
        if (!cancelled) setQrUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [shareUrl]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Sharing</h2>
        <p className="text-sm text-gray-500">Share your event with guests via a link or QR code.</p>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Event URL</h3>
        <FormField
          label="Slug"
          hint={slugValid ? undefined : "Use lowercase letters, numbers, and hyphens (2-50 chars)"}
          error={slug && !slugValid ? "Invalid slug format" : undefined}
        >
          <div className="flex gap-2">
            <Input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="my-event"
            />
            <Button
              variant="secondary"
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!slugValid}
            >
              Save
            </Button>
          </div>
        </FormField>
        {shareUrl && (
          <div className="mt-3">
            <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="flex-1 truncate text-sm text-gray-700">{shareUrl}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast("Link copied", "success");
                }}
                className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">QR Code</h3>
        {shareUrl ? (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-gray-200 bg-white">
              {qrUrl ? (
                <img src={qrUrl} alt="QR code" className="h-44 w-44" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-600">
                Guests can scan this QR code to open your event page.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadQrCode(shareUrl, `${slug || "event"}-qr.png`)}
              >
                <Download className="h-4 w-4" />
                Download QR
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <QrCode className="h-5 w-5" />
            Set a slug to generate a QR code.
          </div>
        )}
      </Card>

      {event.is_published && (
        <Card className="flex items-center gap-2 p-4">
          <Check className="h-5 w-5 text-green-600" />
          <span className="text-sm text-gray-700">This event is published and accessible to guests.</span>
        </Card>
      )}
    </div>
  );
}
