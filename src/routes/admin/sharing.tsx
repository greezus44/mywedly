import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest, type SharingConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle } from "../../components/ui/Input";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { generateQRDataURL, downloadQRPNG, downloadQRHighRes, downloadAllGuestQRsAsZip, downloadAllGuestQRsAsPDF, copyToClipboard, getShareUrl } from "../../lib/qr";
import { generateToken } from "../../lib/utils";
import { QrCode, Download, Copy, Share2, FileImage, FileText, Users, Check } from "lucide-react";

export function SharingPage() {
  const queryClient = useQueryClient();
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState<SharingConfig>({
    enabled: false,
    share_url: null,
    og_title: "",
    og_description: "",
    og_image_url: null,
    twitter_card: "summary_large_image",
    allow_qr_bypass: false,
  });
  const [toast, setToast] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: wedding } = useQuery({
    queryKey: ["wedding", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.id).maybeSingle();
      return data as Wedding | null;
    },
    enabled: !!user,
  });

  const { data: guests } = useQuery({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  useEffect(() => {
    if (wedding) {
      setSharing(wedding.sharing_config || {
        enabled: false,
        share_url: null,
        og_title: "",
        og_description: "",
        og_image_url: null,
        twitter_card: "summary_large_image",
        allow_qr_bypass: false,
      });
    }
  }, [wedding]);

  useEffect(() => {
    if (wedding) {
      const shareUrl = getShareUrl(wedding.slug);
      generateQRDataURL(shareUrl, { width: 256 }).then(setQrUrl).catch(() => {});
    }
  }, [wedding]);

  const saveSharingMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("weddings").update({ sharing_config: sharing }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] });
      setToast("Sharing settings saved");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const handleCopy = async () => {
    if (!wedding) return;
    const url = getShareUrl(wedding.slug);
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading sharing...</div>
        </div>
      </AdminLayout>
    );
  }

  const shareUrl = getShareUrl(wedding.slug);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sharing</h1>
          <p className="mt-1 text-sm text-gray-500">Share your invitation via QR codes and social media.</p>
        </div>

        {/* Main QR Code */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Invitation QR Code</h2>
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              {qrUrl ? (
                <img src={qrUrl} alt="QR Code" className="h-48 w-48" />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center text-gray-400">Generating...</div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <Label className="mb-1">Share URL</Label>
                <div className="flex items-center gap-2">
                  <Input value={shareUrl} readOnly className="flex-1" />
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadQRPNG(shareUrl, "invitation-qr.png")}>
                  <Download className="mr-1.5 h-4 w-4" /> PNG
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadQRHighRes(shareUrl, "invitation-qr-hd.png", 1024)}>
                  <FileImage className="mr-1.5 h-4 w-4" /> High-Res
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* One-Click Sharing */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">One-Click Sharing</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: sharing.og_title || "Wedding Invitation", url: shareUrl });
                } else {
                  handleCopy();
                }
              }}
            >
              <Share2 className="mr-1.5 h-4 w-4" /> Native Share
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(sharing.og_title || "Wedding Invitation")}: ${shareUrl}`, "_blank")}
            >
              WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(sharing.og_title || "")}`, "_blank")}
            >
              Telegram
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")}
            >
              Facebook
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(sharing.og_title || "")}`, "_blank")}
            >
              Twitter / X
            </Button>
          </div>
        </Card>

        {/* Guest QR Codes */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Guest QR Codes</h2>
          </div>
          {guests && guests.length > 0 ? (
            <>
              <p className="mb-3 text-sm text-gray-500">
                Generate QR codes for {guests.length} guests. Each code links directly to their personal invitation.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => downloadAllGuestQRsAsZip(guests, shareUrl)}
                >
                  <Download className="mr-1.5 h-4 w-4" /> Download All (ZIP)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadAllGuestQRsAsPDF(guests, shareUrl)}
                >
                  <FileText className="mr-1.5 h-4 w-4" /> Download All (PDF)
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {guests.slice(0, 8).map((guest) => (
                  <div key={guest.id} className="rounded-lg border border-gray-200 p-3 text-center">
                    <GuestQRItem guest={guest} shareUrl={shareUrl} />
                  </div>
                ))}
              </div>
              {guests.length > 8 && (
                <p className="mt-2 text-xs text-gray-400">Showing 8 of {guests.length} guests. Download all for complete set.</p>
              )}
            </>
          ) : (
            <EmptyState icon={<Users className="h-8 w-8" />} title="No guests yet" description="Add guests to generate individual QR codes." />
          )}
        </Card>

        {/* OG Settings */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Open Graph Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <Toggle
                checked={sharing.enabled}
                onChange={(v) => setSharing((p) => ({ ...p, enabled: v }))}
                label="Enable social sharing"
              />
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <Toggle
                checked={sharing.allow_qr_bypass}
                onChange={(v) => setSharing((p) => ({ ...p, allow_qr_bypass: v }))}
                label="Allow QR code bypass (skip login)"
              />
            </div>
            <Input
              label="OG Title"
              value={sharing.og_title || ""}
              onChange={(e) => setSharing((p) => ({ ...p, og_title: e.target.value }))}
              placeholder="Ahmad & Aishah's Wedding"
            />
            <Textarea
              label="OG Description"
              value={sharing.og_description || ""}
              onChange={(e) => setSharing((p) => ({ ...p, og_description: e.target.value }))}
              placeholder="Join us to celebrate our special day..."
              rows={3}
            />
            <FormField label="OG Image">
              <ImageUpload
                value={sharing.og_image_url ?? null}
                onChange={(url) => setSharing((p) => ({ ...p, og_image_url: url ?? null }))}
              />
            </FormField>
            <Button onClick={() => saveSharingMutation.mutate()} disabled={saveSharingMutation.isPending}>
              Save Sharing Settings
            </Button>
          </div>
        </Card>

        {toast && (
          <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function GuestQRItem({ guest, shareUrl }: { guest: Guest; shareUrl: string }) {
  const [qr, setQr] = useState<string>("");
  useEffect(() => {
    const url = `${shareUrl}?t=${guest.username}`;
    generateQRDataURL(url, { width: 128 }).then(setQr).catch(() => {});
  }, [guest.username, shareUrl]);

  return (
    <div>
      {qr ? <img src={qr} alt={`QR for ${guest.name}`} className="mx-auto h-24 w-24" /> : <div className="mx-auto h-24 w-24 animate-pulse bg-gray-100" />}
      <p className="mt-2 truncate text-sm font-medium text-gray-900">{guest.name}</p>
      <p className="text-xs text-gray-400">@{guest.username}</p>
    </div>
  );
}
