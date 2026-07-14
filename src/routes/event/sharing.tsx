import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Card, LoadingSpinner, ErrorState } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";
import { useEffect, useState } from "react";

interface EventContextValue { event: UserEvent; eventId: string; }

export function SharingPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const [qrUrl, setQrUrl] = useState<string>("");
  const slug = event.slug ?? event.draft_slug;
  const shareUrl = slug ? `${window.location.origin}/e/${slug}` : "";

  useEffect(() => {
    if (shareUrl) generateQrDataUrl(shareUrl, 256).then(setQrUrl).catch(() => {});
  }, [shareUrl]);

  const { data: stats } = useQuery({
    queryKey: ["sharing-stats", eventId],
    queryFn: async () => {
      const { count } = await supabase.from("sharing_events").select("*", { count: "exact", head: true }).eq("event_id", eventId);
      return { shares: count ?? 0 };
    },
  });

  const copyLink = async () => {
    if (shareUrl) await navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-dash-text">Sharing</h2>
      {!event.is_published ? (
        <Card>
          <p className="text-sm text-dash-muted">Publish your event to enable sharing.</p>
        </Card>
      ) : (
        <>
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Share Link</h3>
            <div className="flex items-center gap-2">
              <input readOnly value={shareUrl} className="flex-1 rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text" />
              <button onClick={copyLink} className="rounded-lg bg-dash-primary px-3 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover">Copy</button>
            </div>
          </Card>
          {qrUrl && (
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">QR Code</h3>
              <div className="flex flex-col items-center gap-3">
                <img src={qrUrl} alt="QR Code" className="h-48 w-48 rounded-lg border border-dash-border" />
                <div className="flex gap-2">
                  <button onClick={() => downloadQrCode(shareUrl, `${slug}-qr.png`)} className="rounded-lg bg-dash-primary px-3 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover">Download PNG</button>
                  <button onClick={() => downloadQrSvg(shareUrl, `${slug}-qr.svg`)} className="rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm font-medium text-dash-text hover:bg-dash-bg">Download SVG</button>
                </div>
              </div>
            </Card>
          )}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Stats</h3>
            <p className="text-sm text-dash-muted">Total shares: {stats?.shares ?? 0}</p>
          </Card>
        </>
      )}
    </div>
  );
}
