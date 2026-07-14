import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { Button, Card, Badge, Toggle, Modal, Input } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";
import { slugify, isValidSlug } from "../../lib/theme";
import { cn } from "../../lib/utils";

export function SharingPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const publishedSlug = event.slug;
  const draftSlug = event.draft_slug ?? event.slug ?? "";
  const [slug, setSlug] = useState(draftSlug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const eventUrl = publishedSlug
    ? `${window.location.origin}/e/${publishedSlug}`
    : null;

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSlug(slug)) throw new Error("Invalid slug");
      // Check slug uniqueness
      const { data: existing } = await supabase
        .from("user_events")
        .select("id")
        .eq("slug", slug)
        .neq("id", eventId)
        .maybeSingle();
      if (existing) throw new Error("This URL is already taken. Please choose another.");

      const { error } = await supabase
        .from("user_events")
        .update({
          slug,
          draft_slug: slug,
          is_published: true,
          published_at: new Date().toISOString(),
          // Publish draft -> live
          name: event.draft_name ?? event.name,
          event_date: event.draft_event_date ?? event.event_date,
          event_time: event.draft_event_time ?? event.event_time,
          venue: event.draft_venue ?? event.venue,
          address: event.draft_address ?? event.address,
          cover_config: (event.draft_cover_config ?? event.cover_config) as Json,
          theme: (event.draft_theme ?? event.theme) as Json,
          logo_config: (event.draft_logo_config ?? event.logo_config) as Json,
          content: (event.draft_content ?? event.content) as Json,
          login_config: (event.draft_login_config ?? event.login_config) as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setShowPublishModal(false);
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ is_published: false })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
  });

  const saveSlugMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_slug: slug })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
  });

  async function handleGenerateQr() {
    if (!eventUrl) return;
    const url = await generateQrDataUrl(eventUrl);
    setQrDataUrl(url);
  }

  function validateSlug(val: string) {
    setSlug(val);
    if (!val) { setSlugError(null); return; }
    const s = slugify(val);
    if (!isValidSlug(s)) {
      setSlugError("Only lowercase letters, numbers and hyphens allowed.");
    } else {
      setSlugError(null);
    }
  }

  const copyToClipboard = (text: string) => navigator.clipboard?.writeText(text);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-lg font-semibold text-dash-text">Sharing</h2>

      {/* Status */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-dash-text">Publication Status</h3>
            <p className="text-sm text-dash-muted mt-0.5">
              {event.is_published
                ? "Your event is live and accessible to guests."
                : "Your event is a draft and not yet visible to guests."}
            </p>
          </div>
          <Badge variant={event.is_published ? "success" : "default"}>
            {event.is_published ? "Live" : "Draft"}
          </Badge>
        </div>
        <div className="mt-4 flex gap-3">
          {event.is_published ? (
            <Button
              variant="danger"
              size="sm"
              loading={unpublishMutation.isPending}
              onClick={() => unpublishMutation.mutate()}
            >
              Unpublish
            </Button>
          ) : (
            <Button size="sm" onClick={() => setShowPublishModal(true)}>
              Publish event
            </Button>
          )}
          {event.is_published && eventUrl && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(eventUrl, "_blank")}
            >
              View live site
            </Button>
          )}
        </div>
      </Card>

      {/* URL Slug */}
      <Card>
        <h3 className="font-semibold text-dash-text mb-3">Event URL</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                value={slug}
                onChange={(e) => validateSlug(e.target.value)}
                placeholder="your-event-name"
                error={slugError ?? undefined}
              />
              <p className="mt-1 text-xs text-dash-muted">
                {window.location.origin}/e/<strong>{slug || "your-event-name"}</strong>
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-0.5 shrink-0"
              onClick={() => saveSlugMutation.mutate()}
              loading={saveSlugMutation.isPending}
              disabled={!!slugError || !slug}
            >
              Save
            </Button>
          </div>

          {eventUrl && (
            <div className="flex items-center gap-2 rounded-md bg-dash-surface-alt border border-dash-border px-3 py-2">
              <span className="flex-1 text-sm text-dash-text truncate">{eventUrl}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(eventUrl)}
                className="shrink-0 text-xs text-dash-primary hover:underline"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* QR Code */}
      {eventUrl && (
        <Card>
          <h3 className="font-semibold text-dash-text mb-3">QR Code</h3>
          {qrDataUrl ? (
            <div className="flex flex-col items-center gap-4">
              <img src={qrDataUrl} alt="QR code" className="h-48 w-48 rounded-md border border-dash-border" />
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => downloadQrCode(eventUrl, `${slug}-qr`)}>
                  Download PNG
                </Button>
                <Button variant="secondary" size="sm" onClick={() => downloadQrSvg(eventUrl, `${slug}-qr`)}>
                  Download SVG
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={handleGenerateQr}>
              Generate QR Code
            </Button>
          )}
        </Card>
      )}

      {/* Publish modal */}
      <Modal
        open={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Publish Event"
      >
        <div className="space-y-4">
          <p className="text-sm text-dash-muted">
            Publishing will make your event live and accessible to guests. Make sure you have set a URL slug.
          </p>
          <Input
            label="Event URL Slug"
            value={slug}
            onChange={(e) => validateSlug(e.target.value)}
            placeholder="your-event-name"
            error={slugError ?? undefined}
          />
          <p className="text-xs text-dash-muted">
            Your event will be at: <strong>{window.location.origin}/e/{slug || "your-slug"}</strong>
          </p>
          {publishMutation.isError && (
            <p className="text-sm text-red-500">
              {publishMutation.error instanceof Error ? publishMutation.error.message : "Failed to publish"}
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowPublishModal(false)}>Cancel</Button>
            <Button
              onClick={() => publishMutation.mutate()}
              loading={publishMutation.isPending}
              disabled={!!slugError || !slug}
            >
              Publish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
