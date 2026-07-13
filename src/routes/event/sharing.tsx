import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, FormField, Toast } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";
import { Link2, QrCode, Download, Copy, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { slugify, isValidSlug } from "../../lib/theme";

type Ctx = { event: UserEvent };
export default function SharingPage() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const publicUrl = event.is_published && event.slug ? `${window.location.origin}/e/${event.slug}` : "";

  useEffect(() => { if (publicUrl) generateQrDataUrl(publicUrl).then(setQrUrl); else setQrUrl(""); }, [publicUrl]);

  const updateSlug = useMutation({
    mutationFn: async (slug: string) => { const { error } = await supabase.from("user_events").update({ draft_slug: slug }).eq("id", eventId); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event", eventId] }); setToast("URL updated"); },
    onError: (e: Error) => setToast(`Failed: ${e.message}`),
  });

  const copyUrl = () => { if (publicUrl) { navigator.clipboard.writeText(publicUrl); setToast("Link copied to clipboard"); } };

  return (
    <div className="p-6">
      <h2 className="font-heading text-2xl text-gray-900 mb-6">Sharing</h2>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2"><Link2 className="w-4 h-4" /> Event URL</h3>
            <FormField label="Custom URL Slug"><Input value={event.draft_slug || event.slug || ""} onChange={(e) => updateSlug.mutate(slugify(e.target.value))} placeholder="john-and-jane" /></FormField>
            {publicUrl ? (
              <div><div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200"><span className="text-sm text-gray-600 truncate flex-1">{publicUrl}</span><button onClick={copyUrl} className="p-1.5 hover:bg-gray-200 rounded transition-colors"><Copy className="w-4 h-4 text-gray-500" /></button></div><a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2"><ExternalLink className="w-3 h-3" /> Open live page</a></div>
            ) : <p className="text-xs text-gray-400">Publish your event to get a shareable link.</p>}
          </Card>
          {qrUrl && (
            <Card className="space-y-4 p-5">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2"><QrCode className="w-4 h-4" /> QR Code</h3>
              <div className="flex justify-center"><img src={qrUrl} alt="QR Code" className="w-48 h-48" /></div>
              <div className="flex gap-3 justify-center"><Button size="sm" variant="secondary" onClick={() => downloadQrCode(publicUrl, `${event.slug || "event"}.png`)}><Download className="w-3.5 h-3.5" /> PNG</Button><Button size="sm" variant="secondary" onClick={() => downloadQrSvg(publicUrl, `${event.slug || "event"}.svg`)}><Download className="w-3.5 h-3.5" /> SVG</Button></div>
            </Card>
          )}
        </div>
        <Card className="space-y-3 p-5">
          <h3 className="text-sm font-medium text-gray-700">Sharing Tips</h3>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>• Add the QR code to your printed invitations.</li>
            <li>• Share the link via email, WhatsApp, or social media.</li>
            <li>• Guests can RSVP directly from their phone.</li>
            <li>• Track responses in real-time on the RSVP tab.</li>
          </ul>
        </Card>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
