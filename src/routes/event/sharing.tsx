import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { slugify, isValidSlug } from "../../lib/theme";
import { generateQrDataUrl } from "../../lib/qr";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { LoadingSpinner } from "../../components/ui";

export default function Sharing() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const guestUrl = `${window.location.origin}/e/${slug}`;
  const slugValid = isValidSlug(slug);

  useEffect(() => {
    setSlug(event.draft_slug ?? event.slug ?? "");
  }, [event]);

  useEffect(() => {
    if (!slugValid) {
      setQrUrl(null);
      return;
    }
    let cancelled = false;
    generateQrDataUrl(guestUrl, { width: 256, margin: 2 })
      .then((url) => {
        if (!cancelled) setQrUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [guestUrl, slugValid]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSlug(slug)) {
        setSlugError("Invalid slug. Use lowercase letters, numbers, and hyphens only (2-80 chars).");
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
        throw new Error("Slug not unique");
      }

      setSlugError(null);
      const { error } = await supabase
        .from("user_events")
        .update({ draft_slug: slug })
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", eventId] });
    },
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-dash-text">Sharing</h1>
        <p className="mt-1 text-sm text-dash-muted">
          Share your website URL with guests via link or QR code.
        </p>
      </div>

      {/* URL Editor */}
      <div className="mb-6 rounded-xl border border-dash-border bg-dash-surface p-6">
        <h2 className="mb-4 text-sm font-semibold text-dash-text">Website URL</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-dash-muted">{window.location.origin}/e/</span>
          <Input
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugError(null);
            }}
            placeholder="your-event-url"
            error={slugError ?? undefined}
            className="flex-1"
          />
        </div>
        <p className="mt-2 text-xs text-dash-muted">
          Only lowercase letters, numbers, and hyphens. 2-80 characters.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            size="sm"
          >
            {saveMutation.isPending ? <LoadingSpinner size="sm" /> : "Save URL"}
          </Button>
          {saveMutation.isSuccess && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
        </div>
      </div>

      {/* Guest URL */}
      <div className="mb-6 rounded-xl border border-dash-border bg-dash-surface p-6">
        <h2 className="mb-4 text-sm font-semibold text-dash-text">Guest Link</h2>
        <div className="flex items-center gap-2 rounded-lg border border-dash-border bg-dash-bg px-3 py-2">
          <span className="flex-1 truncate text-sm text-dash-text">{guestUrl}</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            disabled={!slugValid}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <a
          href={guestUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-dash-primary hover:underline"
        >
          Open guest page ↗
        </a>
      </div>

      {/* QR Code */}
      <div className="rounded-xl border border-dash-border bg-dash-surface p-6">
        <h2 className="mb-4 text-sm font-semibold text-dash-text">QR Code</h2>
        {slugValid && qrUrl ? (
          <div className="flex flex-col items-center gap-4">
            <img
              src={qrUrl}
              alt="QR Code"
              className="h-48 w-48 rounded-lg border border-dash-border"
            />
            <a
              href={qrUrl}
              download="qr-code.png"
              className="text-sm text-dash-primary hover:underline"
            >
              Download QR Code
            </a>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-dash-muted">
            {slugValid ? (
              <LoadingSpinner />
            ) : (
              "Enter a valid URL to generate QR code"
            )}
          </div>
        )}
      </div>
    </div>
  );
}
