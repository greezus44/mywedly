import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest, type GuestToken, type SharingConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Toggle, Label } from "../../components/ui/Input";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { generateQRDataURL, downloadQRPNG, downloadQRSVG, downloadQRHighRes, downloadAllGuestQRsAsZip, downloadAllGuestQRsAsPDF, copyToClipboard, getShareUrl } from "../../lib/qr";
import { generateToken } from "../../lib/utils";
import { Download, Copy, QrCode, Share2, FileImage, FileText, Users, Link as LinkIcon } from "lucide-react";

export function SharingPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState<SharingConfig>({ enabled: true, share_url: null, og_title: "", og_description: "", og_image_url: null, twitter_card: "summary_large_image", allow_qr_bypass: true });
  const qc = useQueryClient();

  const { data: wedding } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      if (data) {
        const w = data as Wedding;
        setSharing(w.sharing_config || { enabled: true, share_url: null, og_title: "", og_description: "", og_image_url: null, twitter_card: "summary_large_image", allow_qr_bypass: true });
      }
      return data as Wedding | null;
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["guests-all", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("name", { ascending: true });
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  const { data: guestTokens } = useQuery({
    queryKey: ["guest-tokens", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guest_tokens").select("*").eq("wedding_id", wedding.id);
      return (data || []) as GuestToken[];
    },
    enabled: !!wedding,
  });

  const shareUrl = wedding ? getShareUrl(wedding.slug) : "";
  const qrToken = wedding?.qr_token || "";

  useEffect(() => {
    if (shareUrl) {
      generateQRDataURL(shareUrl, { width: 256 }).then(setQrDataUrl).catch(() => {});
    }
  }, [shareUrl]);

  const saveSharing = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ sharing_config: sharing }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wedding"] }),
  });

  const handleCopy = async () => {
    const ok = await copyToClipboard(shareUrl);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: sharing.og_title || "Wedding Invitation", text: sharing.og_description || "", url: shareUrl }); } catch { /* */ }
    }
  };

  const generateGuestToken = useMutation({
    mutationFn: async (guestId: string) => {
      if (!wedding) throw new Error("No wedding");
      const token = generateToken();
      const { error } = await supabase.from("guest_tokens").insert({ wedding_id: wedding.id, guest_id: guestId, token });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guest-tokens"] }),
  });

  return (
    <AdminLayout>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Sharing</h2>

      <div className="space-y-6">
        <Card className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Website QR Code</h3>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              {qrDataUrl ? <img src={qrDataUrl} alt="QR Code" className="h-48 w-48" /> : <div className="flex h-48 w-48 items-center justify-center text-gray-400"><QrCode className="h-12 w-12" /></div>}
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <LinkIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="flex-1 truncate text-sm text-gray-700">{shareUrl}</span>
                <Button size="sm" variant="outline" onClick={handleCopy}><Copy className="mr-1 h-3 w-3" /> {copied ? "Copied!" : "Copy"}</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => downloadQRPNG(shareUrl, "wedding-qr.png")}><FileImage className="mr-1 h-3 w-3" /> PNG</Button>
                <Button size="sm" variant="outline" onClick={() => downloadQRSVG(shareUrl, "wedding-qr.svg")}><FileText className="mr-1 h-3 w-3" /> SVG</Button>
                <Button size="sm" variant="outline" onClick={() => downloadQRHighRes(shareUrl, "wedding-qr-hd.png", 1024)}><Download className="mr-1 h-3 w-3" /> High-Res</Button>
              </div>
              <Button size="sm" variant="secondary" onClick={shareNative}><Share2 className="mr-1 h-3 w-3" /> Share</Button>
              {qrToken && <p className="text-xs text-gray-400">QR Token: {qrToken}</p>}
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Guest QR Codes</h3>
          <p className="text-sm text-gray-500">Generate individual QR codes for each guest. Download all as a ZIP or PDF.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadAllGuestQRsAsZip(guests || [], shareUrl)} disabled={!guests?.length}><Download className="mr-1 h-3 w-3" /> Download All (ZIP)</Button>
            <Button size="sm" variant="outline" onClick={() => downloadAllGuestQRsAsPDF(guests || [], shareUrl)} disabled={!guests?.length}><FileText className="mr-1 h-3 w-3" /> Download All (PDF)</Button>
          </div>
          {guests && guests.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {guests.map((g) => {
                const token = guestTokens?.find((t) => t.guest_id === g.id);
                return (
                  <div key={g.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{g.name}</p>
                      <p className="text-xs text-gray-400">{g.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => downloadQRPNG(`${shareUrl}?t=${g.username}`, `${g.name.replace(/\s+/g, "_")}-qr.png`)}><Download className="h-3 w-3" /></Button>
                      {!token && <Button size="sm" variant="outline" onClick={() => generateGuestToken.mutate(g.id)}>Generate Token</Button>}
                      {token && <Badge variant="success">Token</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState icon={<Users className="h-8 w-8" />} title="No guests yet" />}
        </Card>

        <Card className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Open Graph Settings</h3>
          <Toggle checked={sharing.enabled} onChange={(v) => setSharing({ ...sharing, enabled: v })} label="Enable sharing" />
          <FormField label="OG Title"><Input value={sharing.og_title} onChange={(e) => setSharing({ ...sharing, og_title: e.target.value })} placeholder="Title for social media preview" /></FormField>
          <FormField label="OG Description"><Textarea value={sharing.og_description} onChange={(e) => setSharing({ ...sharing, og_description: e.target.value })} placeholder="Description for social media preview" /></FormField>
          <FormField label="OG Image"><ImageUpload value={sharing.og_image_url} onChange={(url) => setSharing({ ...sharing, og_image_url: url ?? null })} label="Social media preview image" /></FormField>
          <Toggle checked={sharing.allow_qr_bypass} onChange={(v) => setSharing({ ...sharing, allow_qr_bypass: v })} label="Allow QR code to bypass sign-in" />
          <Button onClick={() => saveSharing.mutate()} disabled={saveSharing.isPending}>Save Sharing Settings</Button>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Share Preview</h3>
          <div className="max-w-sm rounded-lg border border-gray-200 p-4">
            {sharing.og_image_url ? <img src={sharing.og_image_url} alt="OG preview" className="mb-3 h-32 w-full rounded-lg object-cover" /> : <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-gray-100 text-gray-400"><QrCode className="h-8 w-8" /></div>}
            <p className="text-xs text-gray-400">{shareUrl}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{sharing.og_title || "Wedding Invitation"}</p>
            <p className="text-sm text-gray-500">{sharing.og_description || "View our wedding invitation"}</p>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
