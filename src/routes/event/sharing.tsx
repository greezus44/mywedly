import { useState, useEffect } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, SharingConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { FormField, Toggle, ErrorState, Toast } from "../../components/ui/index";
import { generateQrDataUrl } from "../../lib/qr";
import { Copy, Check, Save, MessageCircle, Facebook, Twitter, Mail, QrCode } from "lucide-react";

type Ctx = { event: UserEvent | null };

const defaultSharing: SharingConfig = {
  showShareButtons: true, shareMessage: "", whatsappText: "", facebookText: "",
  emailSubject: "", emailBody: "", qrColor: "#000000", qrBgColor: "#ffffff",
};

export default function Sharing() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<SharingConfig>(defaultSharing);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrSrc, setQrSrc] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const eventUrl = eventId ? `${window.location.origin}/e/${eventId}` : "";

  useEffect(() => {
    if (event?.draft_sharing_config) {
      setConfig({ ...defaultSharing, ...event.draft_sharing_config });
    }
  }, [event?.id]);

  useEffect(() => {
    if (!eventUrl) return;
    generateQrDataUrl(eventUrl, { color: config.qrColor, bgColor: config.qrBgColor, size: 200 }).then(setQrSrc);
  }, [eventUrl, config.qrColor, config.qrBgColor]);

  const update = (patch: Partial<SharingConfig>) => setConfig(c => ({ ...c, ...patch }));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast({ message: "Failed to copy", type: "error" });
    }
  };

  const handleSave = async () => {
    if (!eventId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_events").update({ draft_sharing_config: config }).eq("id", eventId);
      if (error) throw error;
      queryClient.setQueryData(["event", eventId], (old: UserEvent | null) => old ? { ...old, draft_sharing_config: config } : old);
      setToast({ message: "Sharing settings saved", type: "success" });
    } catch (err: any) {
      setToast({ message: "Failed: " + err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const shareText = config.shareMessage || `You're invited to ${event?.name || "our event"}!`;

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${eventUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(config.emailSubject || shareText)}&body=${encodeURIComponent(config.emailBody || `${shareText}\n\n${eventUrl}`)}`,
  };

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sharing</h1>
          <p className="text-sm text-gray-500">Share your event with guests</p>
        </div>
        <Button onClick={handleSave} loading={saving}><Save className="w-4 h-4" /> Save Changes</Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Event Link</h3>
        <div className="flex items-center gap-2">
          <Input value={eventUrl} readOnly className="font-mono text-sm" />
          <Button variant="secondary" onClick={handleCopy}>
            {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Social Share</h3>
          <Toggle checked={config.showShareButtons} onChange={(v) => update({ showShareButtons: v })} label="Show share buttons on event page" />
          <div className="grid grid-cols-4 gap-3">
            <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gray-900 transition-colors">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <span className="text-xs text-gray-600">WhatsApp</span>
            </a>
            <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gray-900 transition-colors">
              <Facebook className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-gray-600">Facebook</span>
            </a>
            <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gray-900 transition-colors">
              <Twitter className="w-5 h-5 text-gray-900" />
              <span className="text-xs text-gray-600">Twitter</span>
            </a>
            <a href={shareLinks.email} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gray-900 transition-colors">
              <Mail className="w-5 h-5 text-gray-700" />
              <span className="text-xs text-gray-600">Email</span>
            </a>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">QR Code</h3>
          <div className="flex justify-center">
            <div className="w-44 h-44 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
              {qrSrc ? <img src={qrSrc} alt="Event QR Code" className="w-40 h-40" /> : <QrCode className="w-16 h-16 text-gray-300" />}
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">Scans to your event page</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Share Message</h3>
        <FormField label="Default Share Message" hint="Used for WhatsApp and Twitter shares">
          <Textarea value={config.shareMessage} onChange={(e) => update({ shareMessage: e.target.value })} placeholder={`You're invited to ${event?.name || "our event"}!`} rows={2} />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Email Subject"><Input value={config.emailSubject} onChange={(e) => update({ emailSubject: e.target.value })} placeholder="Email subject line" /></FormField>
          <FormField label="Email Body"><Textarea value={config.emailBody} onChange={(e) => update({ emailBody: e.target.value })} placeholder="Email body text" rows={2} /></FormField>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
