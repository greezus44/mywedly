import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SharingEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";
import { useEffect } from "react";

interface EventContextValue { event: UserEvent; eventId: string; }

export function SharingPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const publicUrl = event.slug ? `${window.location.origin}/e/${event.slug}` : "";

  const { data: shares } = useQuery({
    queryKey: ["sharing-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sharing_events").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as SharingEvent[];
    },
  });

  useEffect(() => {
    if (publicUrl) generateQrDataUrl(publicUrl, { width: 256 }).then(setQrUrl).catch(() => {});
  }, [publicUrl]);

  const copyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-dash-text">Share</h2>
      {!event.is_published && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Your event is not published yet. Publish it to share with guests.</div>
      )}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-dash-text">Public Link</h3>
        <div className="flex gap-2">
          <Input value={publicUrl || "Publish to get a link"} readOnly />
          <Button variant="secondary" onClick={copyLink} disabled={!publicUrl}>{copied ? "Copied!" : "Copy"}</Button>
        </div>
      </div>
      {qrUrl && (
        <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-dash-text">QR Code</h3>
          <div className="flex flex-col items-center gap-3">
            <img src={qrUrl} alt="QR code" className="h-48 w-48 rounded-lg border border-dash-border" />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => downloadQrCode(publicUrl, `${event.slug || "event"}-qr.png`)}>Download PNG</Button>
              <Button size="sm" variant="secondary" onClick={() => downloadQrSvg(publicUrl, `${event.slug || "event"}-qr.svg`)}>Download SVG</Button>
            </div>
          </div>
        </div>
      )}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Share History</h3>
        {!shares || shares.length === 0 ? (
          <p className="text-sm text-dash-muted">No shares recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {shares.map((s) => <li key={s.id} className="text-sm text-dash-text">{s.type} — {new Date(s.created_at).toLocaleString()}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
