import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Copy, Download, Loader2, QrCode, Link as LinkIcon } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { formatDate } from "../../lib/utils";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";
import {
  Button,
  Card,
  FormField,
  Input,
  Badge,
  Toast,
} from "../../components/ui";

export default function SharingPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [slug, setSlug] = useState(event.draft_slug || event.slug || "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrLoading, setQrLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSlug(event.draft_slug || event.slug || "");
  }, [event]);

  const publishedSlug = event.slug || event.draft_slug;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const guestUrl = publishedSlug ? `${baseUrl}/e/${publishedSlug}` : "";

  // Generate QR code
  useEffect(() => {
    if (!guestUrl) {
      setQrDataUrl("");
      return;
    }
    setQrLoading(true);
    generateQrDataUrl(guestUrl, 256)
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(""))
      .finally(() => setQrLoading(false));
  }, [guestUrl]);

  const handleSlugChange = (value: string) => {
    setSlug(value);
    if (value && !isValidSlug(value)) {
      setSlugError("Slug can only contain lowercase letters, numbers, and hyphens.");
    } else {
      setSlugError(null);
    }
  };

  const handleSlugBlur = () => {
    if (slug && !isValidSlug(slug)) {
      const autoSlug = slugify(slug);
      if (autoSlug && isValidSlug(autoSlug)) {
        setSlug(autoSlug);
        setSlugError(null);
      }
    }
  };

  const handleSaveSlug = async () => {
    if (slug && !isValidSlug(slug)) {
      setToast({ message: "Please fix the slug before saving.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_slug: slug || null })
        .eq("id", event.id);

      if (error) throw error;
      setToast({ message: "Slug saved", type: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to save",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!guestUrl) {
      setToast({ message: "No published link available yet", type: "error" });
      return;
    }
    navigator.clipboard
      .writeText(guestUrl)
      .then(() => setToast({ message: "Link copied to clipboard", type: "success" }))
      .catch(() => setToast({ message: "Failed to copy link", type: "error" }));
  };

  const handleDownloadQr = () => {
    if (!guestUrl) return;
    downloadQrCode(guestUrl, `${publishedSlug || "event"}-qr.png`).catch(() => {
      setToast({ message: "Failed to download QR code", type: "error" });
    });
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Sharing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Share your event with guests via link or QR code
        </p>
      </div>

      {/* Event info */}
      <Card className="mb-6 p-5">
        <h3 className="text-sm font-semibold text-gray-700">Event Details</h3>
        <div className="mt-3 flex flex-col gap-1.5 text-sm text-gray-600">
          <p>
            <span className="font-medium text-gray-900">
              {event.draft_name || event.name || "Untitled Event"}
            </span>
          </p>
          {(event.draft_event_date || event.event_date) && (
            <p>{formatDate(event.draft_event_date || event.event_date)}</p>
          )}
          {(event.draft_venue || event.venue) && (
            <p>{event.draft_venue || event.venue}</p>
          )}
        </div>
      </Card>

      {/* Slug editor */}
      <Card className="mb-6 p-5">
        <h3 className="text-sm font-semibold text-gray-700">Event URL</h3>
        <p className="mt-1 text-xs text-gray-500">
          Set a custom slug for your event's public URL
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">/e/</span>
            <div className="flex-1">
              <Input
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                onBlur={handleSlugBlur}
                placeholder="my-event"
              />
            </div>
            <Button
              size="sm"
              onClick={handleSaveSlug}
              disabled={saving || (!!slug && !isValidSlug(slug))}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>

          {slugError && <p className="text-xs text-red-600">{slugError}</p>}

          {slug && isValidSlug(slug) && (
            <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
              <LinkIcon className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-600">
                {baseUrl}/e/{slug}
              </span>
              {slug === event.slug && <Badge variant="success">Published</Badge>}
            </div>
          )}
        </div>
      </Card>

      {/* Published link & QR */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-700">Share Link</h3>

        {guestUrl ? (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {guestUrl}
              </div>
              <Button variant="secondary" size="sm" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>

            <div className="flex flex-col items-center gap-3 border-t border-gray-100 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                QR Code
              </h4>
              {qrLoading ? (
                <div className="flex h-48 w-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="h-48 w-48 rounded-lg border border-gray-200"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-dashed border-gray-300">
                  <QrCode className="h-12 w-12 text-gray-300" />
                </div>
              )}
              <Button variant="secondary" size="sm" onClick={handleDownloadQr} disabled={!qrDataUrl}>
                <Download className="h-4 w-4" />
                Download QR
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Publish your event to generate a shareable link and QR code.
          </div>
        )}
      </Card>

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
