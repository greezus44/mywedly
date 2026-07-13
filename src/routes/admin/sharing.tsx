import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest, type GuestToken, type SharingConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Toggle } from "../../components/ui/Input";
import { Card, Badge, EmptyState, Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { generateToken, cn } from "../../lib/utils";
import { generateQRDataURL, downloadQRPNG, downloadQRSVG, downloadQRHighRes, downloadAllGuestQRsAsZip, downloadAllGuestQRsAsPDF, copyToClipboard, getShareUrl } from "../../lib/qr";
import { QrCode, Download, Copy, Share2, MessageCircle, Send, Mail, Smartphone, Globe, Link2, RefreshCw, Users, Check } from "lucide-react";

export function SharingPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"share" | "qr" | "guests" | "og">("share");

  const { data: wedding, isLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("full_name");
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

  const updateSharing = useMutation({
    mutationFn: async (config: SharingConfig) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ sharing_config: config }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wedding"] }); setToast("Sharing settings saved"); },
  });

  const regenerateQrToken = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const newToken = generateToken();
      const { error } = await supabase.from("weddings").update({ qr_token: newToken }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wedding"] }); setToast("QR token regenerated"); },
  });

  const generateGuestToken = useMutation({
    mutationFn: async (guestId: string) => {
      const token = generateToken();
      const { error } = await supabase.from("guest_tokens").insert({ guest_id: guestId, wedding_id: wedding!.id, token, bypass_login: false });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guest-tokens"] }); setToast("Guest QR code generated"); },
  });

  const [sharingConfig, setSharingConfig] = useState<SharingConfig>({});

  useEffect(() => {
    if (wedding) setSharingConfig(wedding.sharing_config || {});
  }, [wedding]);

  useEffect(() => {
    if (wedding?.qr_token) {
      const url = getShareUrl("whatsapp", `${window.location.origin}/w/${wedding.slug}`, "");
      generateQRDataURL(`${window.location.origin}/w/${wedding.slug}?qr=${wedding.qr_token}`).then(setQrUrl).catch(() => {});
    }
  }, [wedding]);

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Loading...</div></div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="p-6 text-gray-500">Wedding not found</div></AdminLayout>;

  const websiteUrl = `${window.location.origin}/w/${wedding.slug}`;
  const qrLink = `${window.location.origin}/w/${wedding.slug}?qr=${wedding.qr_token || ""}`;
  const shareText = sharingConfig.invitationMessage || `You're invited to ${wedding.couple_name_one} & ${wedding.couple_name_two}'s wedding!`;

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setToast("Copied to clipboard");
  };

  const guestTokenMap = new Map((guestTokens || []).map((t) => [t.guest_id, t]));

  const guestQrItems = (guests || [])
    .filter((g) => guestTokenMap.has(g.id))
    .map((g) => ({ guestName: g.full_name, token: guestTokenMap.get(g.id)!.token }));

  const tabs = [
    { key: "share", label: "Share", icon: Share2 },
    { key: "qr", label: "QR Code", icon: QrCode },
    { key: "guests", label: "Guest QR", icon: Users },
    { key: "og", label: "OG / Social", icon: Globe },
  ] as const;

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Share2 size={18} className="text-indigo-600" />
            <h1 className="font-ui text-xl font-bold text-gray-900">Sharing</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-gray-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn("flex items-center gap-1.5 px-4 py-2.5 font-ui text-xs font-medium transition-all border-b-2", activeTab === tab.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700")}>
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Share tab */}
          {activeTab === "share" && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Link2 size={16} className="text-indigo-600" />
                  <h3 className="font-ui text-sm font-semibold text-gray-900">Website URL</h3>
                </div>
                <div className="flex items-center gap-2">
                  <input readOnly value={websiteUrl} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-700" />
                  <Button variant="primary" size="md" onClick={() => handleCopy(websiteUrl)}>{copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />} Copy</Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-ui text-sm font-semibold text-gray-900 mb-4">One-Click Sharing</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    { platform: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-green-600", bg: "bg-green-50" },
                    { platform: "telegram", label: "Telegram", icon: Send, color: "text-blue-500", bg: "bg-blue-50" },
                    { platform: "facebook", label: "Facebook", icon: Share2, color: "text-blue-600", bg: "bg-blue-50" },
                    { platform: "twitter", label: "Twitter/X", icon: Share2, color: "text-gray-700", bg: "bg-gray-100" },
                    { platform: "email", label: "Email", icon: Mail, color: "text-amber-600", bg: "bg-amber-50" },
                    { platform: "sms", label: "SMS", icon: Smartphone, color: "text-purple-600", bg: "bg-purple-50" },
                    { platform: "messenger", label: "Messenger", icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50" },
                  ] as const).map((s) => {
                    const Icon = s.icon;
                    return (
                      <a key={s.platform} href={getShareUrl(s.platform, websiteUrl, shareText)} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-400 transition-colors">
                        <div className={`p-2.5 rounded-lg ${s.bg}`}><Icon size={20} className={s.color} /></div>
                        <span className="font-ui text-xs text-gray-700">{s.label}</span>
                      </a>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-ui text-sm font-semibold text-gray-900 mb-4">Invitation Message</h3>
                <FormField label="Default share message">
                  <Textarea value={sharingConfig.invitationMessage || ""} onChange={(e) => setSharingConfig((prev) => ({ ...prev, invitationMessage: e.target.value }))} placeholder="You're invited to our wedding!" className="!bg-white !border-gray-200 !text-gray-700" />
                </FormField>
                <div className="mt-4">
                  <Button variant="primary" size="md" onClick={() => updateSharing.mutate(sharingConfig)} disabled={updateSharing.isPending}>Save Message</Button>
                </div>
              </Card>
            </div>
          )}

          {/* QR Code tab */}
          {activeTab === "qr" && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <QrCode size={16} className="text-indigo-600" />
                    <h3 className="font-ui text-sm font-semibold text-gray-900">Wedding QR Code</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => regenerateQrToken.mutate()} disabled={regenerateQrToken.isPending}>
                    <RefreshCw size={14} className="mr-1" /> Regenerate Token
                  </Button>
                </div>

                <div className="flex flex-col items-center gap-4">
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-lg border border-gray-200" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                      <QrCode size={48} className="text-gray-300" />
                    </div>
                  )}
                  <p className="font-mono text-xs text-gray-500 text-center break-all">{qrLink}</p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    <Button variant="outline" size="sm" onClick={() => downloadQRPNG(qrLink, `${wedding.slug}-qr.png`)}><Download size={14} className="mr-1" /> PNG</Button>
                    <Button variant="outline" size="sm" onClick={() => downloadQRSVG(qrLink, `${wedding.slug}-qr.svg`)}><Download size={14} className="mr-1" /> SVG</Button>
                    <Button variant="outline" size="sm" onClick={() => downloadQRHighRes(qrLink, `${wedding.slug}-qr-hires.png`)}><Download size={14} className="mr-1" /> High-Res PNG</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(qrLink)}><Copy size={14} className="mr-1" /> Copy Link</Button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <Toggle checked={sharingConfig.enableGuestQr ?? false} onChange={(v) => { const newConfig = { ...sharingConfig, enableGuestQr: v }; setSharingConfig(newConfig); updateSharing.mutate(newConfig); }} />
                    <span className="font-ui text-sm text-gray-700">Enable guest-specific QR codes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle checked={sharingConfig.qrBypassLogin ?? false} onChange={(v) => { const newConfig = { ...sharingConfig, qrBypassLogin: v }; setSharingConfig(newConfig); updateSharing.mutate(newConfig); }} />
                    <span className="font-ui text-sm text-gray-700">QR codes bypass guest login</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Guest QR tab */}
          {activeTab === "guests" && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-indigo-600" />
                    <h3 className="font-ui text-sm font-semibold text-gray-900">Guest QR Codes</h3>
                    {guestQrItems.length > 0 && <Badge variant="default">{guestQrItems.length} generated</Badge>}
                  </div>
                  {guestQrItems.length > 0 && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => downloadAllGuestQRsAsZip(guestQrItems, `${wedding.slug}-guest-qr-codes.zip`, (token) => `${websiteUrl}?qr=${token}`)}><Download size={14} className="mr-1" /> ZIP</Button>
                      <Button variant="outline" size="sm" onClick={() => downloadAllGuestQRsAsPDF(guestQrItems, `${wedding.slug}-guest-qr-codes.pdf`, (token) => `${websiteUrl}?qr=${token}`)}><Download size={14} className="mr-1" /> PDF</Button>
                    </div>
                  )}
                </div>

                {guests && guests.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {guests.map((guest) => {
                      const token = guestTokenMap.get(guest.id);
                      return (
                        <div key={guest.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div>
                            <div className="font-ui text-sm font-medium text-gray-900">{guest.full_name}</div>
                            <div className="font-ui text-xs text-gray-500">@{guest.username}</div>
                          </div>
                          {token ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="success">QR Ready</Badge>
                              <button onClick={() => downloadQRPNG(`${websiteUrl}?qr=${token.token}`, `${guest.username}-qr.png`)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"><Download size={14} className="text-gray-500" /></button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => generateGuestToken.mutate(guest.id)}><QrCode size={14} className="mr-1" /> Generate</Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState icon={<Users size={48} />} title="No guests yet" description="Add guests first to generate their individual QR codes." />
                )}
              </Card>
            </div>
          )}

          {/* OG / Social tab */}
          {activeTab === "og" && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={16} className="text-indigo-600" />
                  <h3 className="font-ui text-sm font-semibold text-gray-900">Social Media Preview (Open Graph)</h3>
                </div>
                <div className="space-y-4">
                  <FormField label="OG Title">
                    <Input value={sharingConfig.ogTitle || ""} onChange={(e) => setSharingConfig((prev) => ({ ...prev, ogTitle: e.target.value }))} placeholder="Our Wedding" className="!bg-white !border-gray-200 !text-gray-700" />
                  </FormField>
                  <FormField label="OG Description">
                    <Textarea value={sharingConfig.ogDescription || ""} onChange={(e) => setSharingConfig((prev) => ({ ...prev, ogDescription: e.target.value }))} placeholder="Description shown on social media" className="!bg-white !border-gray-200 !text-gray-700" />
                  </FormField>
                  <FormField label="OG Image URL">
                    <Input value={sharingConfig.ogImageUrl || ""} onChange={(e) => setSharingConfig((prev) => ({ ...prev, ogImageUrl: e.target.value || null }))} placeholder="https://..." className="!bg-white !border-gray-200 !text-gray-700" />
                  </FormField>
                  <Button variant="primary" size="md" onClick={() => updateSharing.mutate(sharingConfig)} disabled={updateSharing.isPending}><Check size={14} className="mr-1" /> Save OG Settings</Button>
                </div>
              </Card>

              {/* Preview */}
              <Card className="p-6">
                <h3 className="font-ui text-sm font-semibold text-gray-900 mb-4">Share Preview</h3>
                <div className="max-w-sm border border-gray-200 rounded-lg overflow-hidden">
                  {sharingConfig.ogImageUrl ? (
                    <img src={sharingConfig.ogImageUrl} alt="OG Preview" className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                      <Globe size={40} className="text-gray-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-ui text-xs text-gray-400 uppercase tracking-wider mb-1">{websiteUrl}</p>
                    <h4 className="font-ui text-sm font-semibold text-gray-900 mb-1">{sharingConfig.ogTitle || `${wedding.couple_name_one} & ${wedding.couple_name_two}`}</h4>
                    <p className="font-ui text-xs text-gray-500">{sharingConfig.ogDescription || shareText}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
