import React from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Card, FormField } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";
import { Copy, Download, ExternalLink } from "lucide-react";
import { formatDate } from "../../lib/utils";

export default function SharingEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [slug, setSlug] = React.useState(event.draft_slug || event.slug || slugify(event.name));
  const [qrUrl, setQrUrl] = React.useState<string>("");
  const baseUrl = window.location.origin;
  const guestUrl = `${baseUrl}/e/${slug}`;
  React.useEffect(() => { generateQrDataUrl(guestUrl, 200).then(setQrUrl); }, [slug]);

  const saveMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("user_events").update({ draft_slug: slug }).eq("id", event.id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", event.id] }),
    onError: (err: any) => alert("Failed to save: " + (err.message || "Unknown error")),
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-dash-text mb-6">Sharing</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 space-y-4">
          <FormField label="Custom URL Slug" hint="Letters, numbers, and hyphens only. At least 3 characters.">
            <Input value={slug} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlug(slugify(e.target.value))} placeholder="my-event" />
          </FormField>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-slate-50 border border-dash-border rounded-lg text-sm text-dash-muted truncate">{guestUrl}</div>
            <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(guestUrl)}><Copy className="w-4 h-4" /></Button>
          </div>
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={!isValidSlug(slug)}>Save Slug</Button>
          {event.is_published && event.slug && (<a href={`/e/${event.slug}`} target="_blank" rel="noopener" className="block text-sm text-teal-700 hover:underline"><ExternalLink className="w-4 h-4 inline mr-1" /> Open Guest Page</a>)}
        </Card>
        <Card className="p-4 text-center">
          <h3 className="font-medium text-dash-text mb-3">QR Code</h3>
          {qrUrl && <img src={qrUrl} alt="QR Code" className="w-48 h-48 mx-auto mb-3" />}
          <Button variant="secondary" onClick={() => downloadQrCode(guestUrl, `${slug}-qr.png`)}><Download className="w-4 h-4" /> Download QR</Button>
        </Card>
      </div>
    </div>
  );
}
