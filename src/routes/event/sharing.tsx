import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Download, Loader2, QrCode, Link as LinkIcon, Check } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { formatDate } from "../../lib/utils";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Card,
  FormField,
  Badge,
  Toast,
  type ToastType,
} from "../../components/ui";

export default function SharingPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const slugValid = !slug || isValidSlug(slug);
  const baseUrl = window.location.origin;
  const shareUrl = slug ? `${baseUrl}/e/${slug}` : `${baseUrl}/e/your-slug`;

  useEffect(() => {
    if (!slug) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    generateQrDataUrl(shareUrl, 256)
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, shareUrl]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from("user_events")
        .update(updates)
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ message: "Slug saved!", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const handleSaveSlug = () => {
    if (!slug || !isValidSlug(slug)) {
      setToast({ message: "Invalid slug. Use only lowercase letters, numbers, and hyphens.", type: "error" });
      return;
    }
    updateMutation.mutate({ draft_slug: slug });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setToast({ message: "Link copied!", type: "success" });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadQr = () => {
    downloadQrCode(shareUrl, `${slug || "event"}-qr.png`).catch(() => {
      setToast({ message: "Failed to download QR code", type: "error" });
    });
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Sharing
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Share your event website with guests.
          </p>
        </div>

        {/* Event info */}
        <Card className="space-y-2 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Event Details
          </h3>
          <p className="text-lg font-medium text-gray-900">
            {event.draft_name ?? event.name}
          </p>
          {(event.draft_event_date ?? event.event_date) && (
            <p className="text-sm text-gray-600">
              {formatDate(event.draft_event_date ?? event.event_date)}
            </p>
          )}
          {(event.draft_venue ?? event.venue) && (
            <p className="text-sm text-gray-600">
              {event.draft_venue ?? event.venue}
            </p>
          )}
        </Card>

        {/* Slug */}
        <Card className="space-y-4 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Custom URL
          </h3>
          <FormField
            label="URL slug"
            hint="This will be used in your event link: /e/your-slug"
          >
            <div className="flex gap-2">
              <Input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="my-event"
              />
              <Button
                size="md"
                onClick={handleSaveSlug}
                disabled={updateMutation.isPending || !slugValid}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </FormField>
          {!slugValid && (
            <p className="text-xs text-red-600">
              Slug can only contain lowercase letters, numbers, and hyphens.
            </p>
          )}
          {slugValid && slug && (
            <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
              <LinkIcon className="h-4 w-4 text-gray-400" />
              <span className="flex-1 truncate text-sm text-gray-700">
                {shareUrl}
              </span>
              <button
                onClick={handleCopy}
                className="text-gray-500 transition-colors hover:text-gray-900"
                aria-label="Copy link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
          {event.is_published ? (
            <Badge variant="success">Published</Badge>
          ) : (
            <Badge variant="warning">Not published yet — publish to share</Badge>
          )}
        </Card>

        {/* QR Code */}
        <Card className="space-y-4 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            QR Code
          </h3>
          {qrDataUrl ? (
            <div className="flex flex-col items-center gap-4">
              <img
                src={qrDataUrl}
                alt="QR code for event link"
                className="h-48 w-48 rounded-lg border border-gray-200"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadQr}
              >
                <Download className="h-4 w-4" /> Download PNG
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8 text-gray-400">
              <QrCode className="h-16 w-16" />
              <p className="text-sm">
                {slug
                  ? "Generating QR code..."
                  : "Enter a slug to generate a QR code"}
              </p>
            </div>
          )}
        </Card>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
