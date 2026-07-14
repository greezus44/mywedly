import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Input, LoadingSpinner, ErrorState } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";
import { isValidSlug } from "../../lib/theme";

interface EventContextValue { event: UserEvent; eventId: string; }

export function SharingPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSlug(event.draft_slug ?? event.slug ?? "");
  }, [event]);

  const publicUrl = event.slug ? `${window.location.origin}/e/${event.slug}` : "";
  const draftUrl = slug ? `${window.location.origin}/e/${slug}` : "";

  useEffect(() => {
    if (publicUrl) {
      generateQrDataUrl(publicUrl, 256).then(setQrUrl).catch(() => setQrUrl(""));
    } else {
      setQrUrl("");
    }
  }, [publicUrl]);

  const saveSlugMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSlug(slug)) throw new Error("Invalid slug");
      const { error } = await supabase.from("user_events").update({ draft_slug: slug }).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const { data: shareEvents, isLoading } = useQuery({
    queryKey: ["share-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sharing_events")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-dash-text">Sharing</h2>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Event URL</h3>
        <div className="space-y-3">
          <Input
            label="URL Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-wedding"
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => saveSlugMutation.mutate()} loading={saveSlugMutation.isPending}>
              Save Slug
            </Button>
            {saved && <span className="text-sm text-green-600">Saved!</span>}
          </div>
        </div>
      </Card>

      {event.is_published && publicUrl && (
        <>
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Public Link</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={publicUrl}
                readOnly
                className="flex-1 rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text"
              />
              <Button variant="secondary" size="sm" onClick={() => copyToClipboard(publicUrl)}>Copy</Button>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">Open</Button>
              </a>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">QR Code</h3>
            {qrUrl ? (
              <div className="flex flex-col items-center gap-4">
                <img src={qrUrl} alt="QR Code" className="rounded-lg border border-dash-border" />
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => downloadQrCode(publicUrl, `${slug}-qr.png`)}>Download PNG</Button>
                  <Button variant="secondary" size="sm" onClick={() => downloadQrSvg(publicUrl, `${slug}-qr.svg`)}>Download SVG</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-dash-muted">Generating QR code...</p>
            )}
          </Card>
        </>
      )}

      {!event.is_published && (
        <Card>
          <p className="text-sm text-dash-muted">
            Publish your event to get a public link and QR code. Draft URL: {draftUrl || "(set a slug first)"}
          </p>
        </Card>
      )}

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Share History</h3>
        {(shareEvents ?? []).length === 0 ? (
          <p className="text-sm text-dash-muted">No shares recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {(shareEvents ?? []).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded border border-dash-border px-3 py-2">
                <span className="text-sm text-dash-text">{s.type}</span>
                <span className="text-xs text-dash-muted">{new Date(s.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
