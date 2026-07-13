import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest, type GuestToken, type SharingConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Toggle, Label } from "../../components/ui/Input";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { generateQRDataURL, downloadQRPNG, downloadQRSVG, downloadQRHighRes, downloadAllGuestQRsAsZip, downloadAllGuestQRsAsPDF, copyToClipboard, getShareUrl } from "../../lib/qr";
import { QrCode, Download, Copy, Share2, Users, Globe, Link2, Save } from "lucide-react";

export function SharingPage() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [guestQrUrls, setGuestQrUrls] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [sharing, setSharing] = useState<SharingConfig>({
    enabled: false,
    share_url: null,
    og_title: "",
    og_description: "",
    og_image_url: null,
    twitter_card: "summary_large_image",
    allow_qr_bypass: false,
  });
  const qc = useQueryClient();

  const { data: wedding } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      if (data) {
        const w = data as Wedding;
        if (w.sharing_config) setSharing(w.sharing_config);
      }
      return data as Wedding | null;
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["guests"],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("name", { ascending: true });
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  const { data: guestTokens } = useQuery({
    queryKey: ["guest-tokens"],
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
      generateQRDataURL(shareUrl).then(setQrUrl).catch(() => {});
    }
  }, [shareUrl]);

  useEffect(() => {
    if (shareUrl && guests && guests.length > 0) {
      const tokenMap = new Map((guestTokens || []).map((t) => [t.guest_id, t.token]));
      const promises = guests.slice(0, 50).map(async (g) => {
        const token = tokenMap.get(g.id) || g.username;
        const url = `${shareUrl}?t=${token}`;
        const dataUrl = await generateQRDataURL(url, { width: 128 });
        return [g.id, dataUrl] as [string, string];
      });
      Promise.all(promises).then((entries) => {
        setGuestQrUrls(Object.fromEntries(entries));
      }).catch(() => {});
    }
  }, [shareUrl, guests, guestTokens]);

  const saveSharing = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ sharing_config: sharing }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wedding"] });
      setToast("Sharing settings saved");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    setToast(ok ? "Copied to clipboard" : "Copy failed");
    setTimeout(() => setToast(null), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: sharing.og_title || "Wedding Invitation", text: sharing.og_description || "", url: shareUrl });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy(shareUrl);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Sharing</h2>
        <p className="mt-1 text-sm text-gray-500">Share your wedding invitation via QR codes and social media.</p>
      </div>

      <div className="space-y-6">
        {/* Website URL & Share */}
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <Globe className="h-4 w-4 text-indigo-600" /> Website URL
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[200px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {shareUrl}
            </div>
            <Button variant="outline" onClick={() => handleCopy(shareUrl)}>
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          </div>
          {qrToken && (
            <div className="mt-3">
              <p className="text-xs text-gray-500">QR Token: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-700">{qrToken}</code></p>
            </div>
          )}
        </Card>

        {/* Main QR Code */}
        <Card>
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <QrCode className="h-4 w-4 text-indigo-600" /> Main QR Code
          </h3>
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              {qrUrl ? (
                <img src={qrUrl} alt="QR Code" className="h-48 w-48" />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center text-gray-400">Generating...</div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-600">Download your QR code in different formats:</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadQRPNG(shareUrl, "wedding-qr.png")}>
                  <Download className="mr-2 h-4 w-4" /> PNG
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadQRSVG(shareUrl, "wedding-qr.svg")}>
                  <Download className="mr-2 h-4 w-4" /> SVG
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadQRHighRes(shareUrl, "wedding-qr-hd.png", 1024)}>
                  <Download className="mr-2 h-4 w-4" /> High-Res
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Guest QR Codes */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
              <Users className="h-4 w-4 text-indigo-600" /> Guest QR Codes
            </h3>
            {guests && guests.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadAllGuestQRsAsZip(guests, shareUrl)}>
                  <Download className="mr-2 h-4 w-4" /> ZIP
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadAllGuestQRsAsPDF(guests, shareUrl)}>
                  <Download className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
            )}
          </div>
          {guests && guests.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {guests.slice(0, 24).map((guest) => (
                <div key={guest.id} className="flex flex-col items-center rounded-lg border border-gray-200 p-3">
                  {guestQrUrls[guest.id] ? (
                    <img src={guestQrUrls[guest.id]} alt={guest.name} className="h-24 w-24" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center text-gray-400">...</div>
                  )}
                  <p className="mt-2 text-center text-xs font-medium text-gray-700 truncate w-full">{guest.name}</p>
                  <button
                    onClick={() => {
                      const tokenMap = new Map((guestTokens || []).map((t) => [t.guest_id, t.token]));
                      const token = tokenMap.get(guest.id) || guest.username;
                      handleCopy(`${shareUrl}?t=${token}`);
                    }}
                    className="mt-1 text-xs text-indigo-600 hover:underline"
                  >
                    Copy link
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Users className="h-10 w-10" />} title="No guests yet" description="Add guests to generate individual QR codes." />
          )}
        </Card>

        {/* OG / Share Preview Settings */}
        <Card className="space-y-4">
          <h3 className="font-semibold text-gray-900">Open Graph Settings</h3>
          <div className="flex items-center justify-between">
            <Label>Enable sharing</Label>
            <Toggle checked={sharing.enabled} onChange={(v) => setSharing({ ...sharing, enabled: v })} label={sharing.enabled ? "On" : "Off"} />
          </div>
          <FormField label="OG Title">
            <Input value={sharing.og_title} onChange={(e) => setSharing({ ...sharing, og_title: e.target.value })} placeholder="Title for social media" />
          </FormField>
          <FormField label="OG Description">
            <Textarea value={sharing.og_description} onChange={(e) => setSharing({ ...sharing, og_description: e.target.value })} placeholder="Description for social media" />
          </FormField>
          <FormField label="OG Image">
            <ImageUpload
              value={sharing.og_image_url ?? null}
              onChange={(url) => setSharing({ ...sharing, og_image_url: url ?? null })}
              label="Preview image (1200x630 recommended)"
            />
          </FormField>
          <Button onClick={() => saveSharing.mutate()} disabled={saveSharing.isPending}>
            <Save className="mr-2 h-4 w-4" /> {saveSharing.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </Card>

        {/* Share Preview */}
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <Link2 className="h-4 w-4 text-indigo-600" /> Share Preview
          </h3>
          <div className="max-w-md overflow-hidden rounded-lg border border-gray-200">
            {sharing.og_image_url ? (
              <img src={sharing.og_image_url} alt="OG preview" className="h-48 w-full object-cover" />
            ) : (
              <div className="flex h-48 items-center justify-center bg-gray-100 text-gray-400">No image</div>
            )}
            <div className="p-4">
              <p className="text-xs text-gray-500">{shareUrl}</p>
              <p className="mt-1 font-semibold text-gray-900">{sharing.og_title || "Your Wedding Invitation"}</p>
              <p className="mt-1 text-sm text-gray-600">{sharing.og_description || "View our wedding invitation and RSVP."}</p>
            </div>
          </div>
        </Card>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
