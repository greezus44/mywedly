import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest, type SharingConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle } from "../../components/ui/Input";
import { Card, Badge, Toast, EmptyState } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { generateQRDataURL, downloadQRPNG, downloadQRHighRes, downloadAllGuestQRsAsZip, downloadAllGuestQRsAsPDF, copyToClipboard, getShareUrl } from "../../lib/qr";
import { QrCode, Share2, Copy, Download, FileImage, FileText, Archive, Link2, Users } from "lucide-react";

export function SharingPage() {
  const queryClient = useQueryClient();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [sharing, setSharing] = useState<SharingConfig>({ enabled: true, share_url: null, og_title: "", og_description: "", og_image_url: null, twitter_card: "summary_large_image", allow_qr_bypass: false });

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });

  const { data: wed, isLoading, error } = useQuery({
    queryKey: ["wedding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user!.id).maybeSingle();
      if (error) throw error;
      return data as Wedding | null;
    },
  });

  const { data: guestData } = useQuery({
    queryKey: ["guests-share", wed?.id],
    enabled: !!wed,
    queryFn: async () => {
      const { data, error } = await supabase.from("guests").select("*").eq("wedding_id", wed!.id).order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as Guest[];
    },
  });

  useEffect(() => {
    if (wed) {
      setWedding(wed);
      if (wed.sharing_config) setSharing(wed.sharing_config);
    }
  }, [wed]);
  useEffect(() => { if (guestData) setGuests(guestData); }, [guestData]);

  useEffect(() => {
    if (wedding?.slug) {
      const url = getShareUrl(wedding.slug);
      generateQRDataURL(url, { width: 256 }).then(setQrDataUrl).catch(() => {});
    }
  }, [wedding?.slug]);

  const saveSharingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("weddings").update({ sharing_config: sharing }).eq("id", wedding!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] }); setToast({ message: "Sharing settings saved", type: "success" }); },
    onError: (e) => setToast({ message: e.message, type: "error" }),
  });

  if (isLoading) return <AdminLayout><div className="py-20 text-center text-gray-500">Loading…</div></AdminLayout>;
  if (error) return <AdminLayout><div className="py-20 text-center text-red-600">{error.message}</div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="py-20 text-center text-gray-500">No wedding found.</div></AdminLayout>;

  const shareUrl = getShareUrl(wedding.slug);

  const handleCopy = async () => {
    const ok = await copyToClipboard(shareUrl);
    setToast({ message: ok ? "Link copied to clipboard" : "Failed to copy", type: ok ? "success" : "error" });
  };

  const handleOneClickShare = async (platform: "whatsapp" | "telegram" | "email" | "copy") => {
    const text = `You're invited! ${sharing.og_title || "Our Wedding"} - ${shareUrl}`;
    if (platform === "copy") { await handleCopy(); return; }
    let url = "";
    if (platform === "whatsapp") url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    else if (platform === "telegram") url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(sharing.og_title || "")}`;
    else if (platform === "email") url = `mailto:?subject=${encodeURIComponent(sharing.og_title || "Wedding Invitation")}&body=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setToast({ message: "Opening share dialog…", type: "success" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sharing</h2>
          <p className="text-sm text-gray-500">Share your invitation and generate QR codes.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">Invitation QR Code</h3>
            </div>
            {qrDataUrl ? (
              <div className="flex flex-col items-center gap-4">
                <img src={qrDataUrl} alt="QR Code" className="rounded-lg border border-gray-200" />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadQRPNG(shareUrl, "invitation-qr.png")}><FileImage className="mr-1.5 h-4 w-4" /> PNG</Button>
                  <Button variant="outline" size="sm" onClick={() => downloadQRHighRes(shareUrl, "invitation-qr-hd.png", 2048)}><Download className="mr-1.5 h-4 w-4" /> High-Res</Button>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-gray-400"><QrCode className="h-12 w-12" /></div>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Link2 className="h-5 w-5 text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">Share Link</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <span className="flex-1 truncate text-sm text-gray-700">{shareUrl}</span>
                <Button variant="outline" size="sm" onClick={handleCopy}><Copy className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOneClickShare("whatsapp")}><Share2 className="mr-1.5 h-4 w-4" /> WhatsApp</Button>
                <Button variant="outline" size="sm" onClick={() => handleOneClickShare("telegram")}><Share2 className="mr-1.5 h-4 w-4" /> Telegram</Button>
                <Button variant="outline" size="sm" onClick={() => handleOneClickShare("email")}><Share2 className="mr-1.5 h-4 w-4" /> Email</Button>
                <Button variant="outline" size="sm" onClick={() => handleOneClickShare("copy")}><Copy className="mr-1.5 h-4 w-4" /> Copy Link</Button>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-900">Guest QR Codes</h3>
            <Badge variant="default">{guests.length} guests</Badge>
          </div>
          {guests.length === 0 ? (
            <EmptyState icon={<Users className="h-8 w-8" />} title="No guests yet" description="Add guests to generate individual QR codes." />
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => downloadAllGuestQRsAsZip(guests, shareUrl)}><Archive className="mr-1.5 h-4 w-4" /> Download All as ZIP</Button>
              <Button variant="outline" onClick={() => downloadAllGuestQRsAsPDF(guests, shareUrl)}><FileText className="mr-1.5 h-4 w-4" /> Download All as PDF</Button>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-900">Open Graph Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div>
                <Label>Allow QR Bypass</Label>
                <p className="mt-1 text-xs text-gray-500">Allow QR code scans to skip the sign-in page.</p>
              </div>
              <Toggle checked={sharing.allow_qr_bypass} onChange={(v) => setSharing((s) => ({ ...s, allow_qr_bypass: v }))} />
            </div>
            <FormField label="OG Title" hint="Title shown when sharing on social media">
              <Input value={sharing.og_title} onChange={(e) => setSharing((s) => ({ ...s, og_title: e.target.value }))} placeholder="Our Wedding Invitation" />
            </FormField>
            <FormField label="OG Description" hint="Description shown when sharing on social media">
              <Textarea value={sharing.og_description} onChange={(e) => setSharing((s) => ({ ...s, og_description: e.target.value }))} placeholder="We invite you to celebrate with us…" />
            </FormField>
            <FormField label="OG Image" hint="Image shown when sharing on social media">
              <ImageUpload value={sharing.og_image_url ?? null} onChange={(url) => setSharing((s) => ({ ...s, og_image_url: url ?? null }))} />
            </FormField>
            <Button onClick={() => saveSharingMutation.mutate()} disabled={saveSharingMutation.isPending}>Save Settings</Button>
          </div>
        </Card>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </AdminLayout>
  );
}
