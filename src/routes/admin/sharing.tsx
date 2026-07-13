import { useState, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Share2, Download, QrCode, MessageCircle, Facebook, Instagram, Mail, Link as LinkIcon } from "lucide-react";
import { supabase, Wedding, SharingConfig } from "../../lib/supabase";
import { DEFAULT_SHARING_CONFIG } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, FormField, Toggle, ColorInput, Toast, ErrorState } from "../../components/ui/index";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

type OutletContext = { wedding: Wedding | null };

export default function SharingPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<SharingConfig>(wedding?.draft_sharing_config || wedding?.sharing_config || DEFAULT_SHARING_CONFIG);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    if (wedding) setConfig(wedding.draft_sharing_config || wedding.sharing_config || DEFAULT_SHARING_CONFIG);
  }, [wedding?.id]);

  useEffect(() => {
    const url = config.customUrl || `${window.location.origin}/w/${wedding?.id || ""}`;
    generateQrDataUrl(url, { color: { dark: config.qrColor, light: config.qrBgColor }, width: 200 })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [config.qrColor, config.qrBgColor, config.customUrl, wedding?.id]);

  const update = useCallback((patch: Partial<SharingConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!wedding) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("weddings").update({ draft_sharing_config: config }).eq("id", wedding.id);
      if (error) throw error;
      queryClient.setQueryData(["wedding"], (old: Wedding | null) => old ? { ...old, draft_sharing_config: config } : old);
      setToast("Sharing settings saved!");
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast("Failed: " + err.message);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [wedding, config, queryClient]);

  const handleDownloadQr = useCallback(() => {
    if (qrUrl) downloadQrCode(qrUrl, "wedding-qr.png");
  }, [qrUrl]);

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;

  const shareUrl = config.customUrl || `${window.location.origin}/w/${wedding?.id || ""}`;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sharing</h1>
          <p className="text-sm text-gray-500">Configure how guests can share your invitation</p>
        </div>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>

      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Enable Sharing</h3>
            <p className="text-xs text-gray-500">Allow guests to share your invitation</p>
          </div>
          <Toggle checked={config.enabled} onChange={(v) => update({ enabled: v })} />
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Share Messages</h3>

          <FormField label="General Message"><Textarea value={config.message} onChange={(e) => update({ message: e.target.value })} placeholder="You're invited to our wedding!" /></FormField>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MessageCircle className="w-4 h-4 text-green-600 mt-2 flex-shrink-0" />
              <FormField label="WhatsApp Text"><Textarea value={config.whatsappText} onChange={(e) => update({ whatsappText: e.target.value })} placeholder="WhatsApp share text" /></FormField>
            </div>
            <div className="flex items-start gap-2">
              <Facebook className="w-4 h-4 text-blue-600 mt-2 flex-shrink-0" />
              <FormField label="Facebook Text"><Textarea value={config.facebookText} onChange={(e) => update({ facebookText: e.target.value })} placeholder="Facebook share text" /></FormField>
            </div>
            <div className="flex items-start gap-2">
              <Instagram className="w-4 h-4 text-pink-600 mt-2 flex-shrink-0" />
              <FormField label="Instagram Text"><Textarea value={config.instagramText} onChange={(e) => update({ instagramText: e.target.value })} placeholder="Instagram share text" /></FormField>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-gray-600 mt-2 flex-shrink-0" />
              <FormField label="Email Subject"><Input value={config.emailSubject} onChange={(e) => update({ emailSubject: e.target.value })} placeholder="Email subject" /></FormField>
              <FormField label="Email Body"><Textarea value={config.emailBody} onChange={(e) => update({ emailBody: e.target.value })} placeholder="Email body text" /></FormField>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Custom URL</h3>
          <FormField label="Custom URL" hint="Leave blank to use default"><Input value={config.customUrl} onChange={(e) => update({ customUrl: e.target.value })} placeholder="https://my-wedding.com" /></FormField>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 truncate flex-1">{shareUrl}</span>
            <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(shareUrl); setToast("Link copied!"); setTimeout(() => setToast(null), 2000); }}>Copy</Button>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">QR Code</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              {qrUrl ? (
                <img src={qrUrl} alt="QR Code" className="w-40 h-40 rounded-lg border border-gray-200" />
              ) : (
                <div className="w-40 h-40 rounded-lg border border-gray-200 flex items-center justify-center"><QrCode className="w-12 h-12 text-gray-300" /></div>
              )}
              <Button variant="outline" size="sm" onClick={handleDownloadQr} disabled={!qrUrl}><Download className="w-3.5 h-3.5" /> Download QR</Button>
            </div>
            <div className="flex-1 space-y-3 w-full">
              <FormField label="QR Color"><ColorInput value={config.qrColor} onChange={(v) => update({ qrColor: v })} /></FormField>
              <FormField label="QR Background"><ColorInput value={config.qrBgColor} onChange={(v) => update({ qrBgColor: v })} /></FormField>
            </div>
          </div>
        </div>
      </Card>

      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
