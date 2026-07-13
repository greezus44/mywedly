import { useState, useEffect, useCallback } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Check, Share2, MessageCircle, Facebook, Twitter, Mail, QrCode as QrCodeIcon } from "lucide-react";
import { supabase, UserEvent, SharingConfig } from "../../lib/supabase";
import { DEFAULT_SHARING_CONFIG } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, Toggle, FormField, Toast, ErrorState, Skeleton } from "../../components/ui/index";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

type Ctx = { event: UserEvent | null };

export default function SharingPage() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<SharingConfig>(DEFAULT_SHARING_CONFIG);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const eventUrl = eventId ? `${baseUrl}/${eventId}` : "";

  useEffect(() => {
    if (event) {
      setConfig(event.draft_sharing_config || event.sharing_config || DEFAULT_SHARING_CONFIG);
    }
  }, [event?.id]);

  useEffect(() => {
    if (!eventUrl) return;
    setQrLoading(true);
    generateQrDataUrl(eventUrl, { width: 256, color: { dark: config.qrColor, light: config.qrBgColor } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
      .finally(() => setQrLoading(false));
  }, [eventUrl, config.qrColor, config.qrBgColor]);

  const updateConfig = useCallback((patch: Partial<SharingConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { error } = await supabase
        .from("user_events")
        .update({ draft_sharing_config: config })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      if (event) {
        queryClient.setQueryData(["event", eventId], (old: UserEvent | null) =>
          old ? { ...old, draft_sharing_config: config } : old
        );
      }
      showToast("Sharing settings saved");
    },
    onError: (err: any) => showToast("Failed to save: " + err.message, "error"),
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = eventUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = (platform: "whatsapp" | "facebook" | "twitter" | "email") => {
    const message = config.message || "You're invited!";
    const encodedUrl = encodeURIComponent(eventUrl);
    const encodedMsg = encodeURIComponent(message);
    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodedMsg}%20${encodedUrl}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMsg}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodedMsg}&url=${encodedUrl}`;
        break;
      case "email":
        url = `mailto:?subject=${encodeURIComponent(config.emailSubject || "You're invited")}&body=${encodeURIComponent((config.emailBody || message) + "\n\n" + eventUrl)}`;
        break;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const safeName = event?.name?.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "event";
    downloadQrCode(qrDataUrl, `qr-${safeName}.png`);
  };

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Sharing</h1>
        <p className="text-sm text-gray-500">Share your event with guests</p>
      </div>

      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Event Link</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 font-mono truncate">
            {eventUrl}
          </div>
          <Button variant="outline" onClick={handleCopyLink}>
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Share via</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => handleShare("whatsapp")}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-gray-700">WhatsApp</span>
          </button>
          <button
            onClick={() => handleShare("facebook")}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Facebook className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Facebook</span>
          </button>
          <button
            onClick={() => handleShare("twitter")}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Twitter className="w-6 h-6 text-gray-900" />
            <span className="text-sm font-medium text-gray-700">Twitter</span>
          </button>
          <button
            onClick={() => handleShare("email")}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Mail className="w-6 h-6 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Email</span>
          </button>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">QR Code</h3>
          <Button variant="outline" size="sm" onClick={handleDownloadQr} disabled={!qrDataUrl}>
            <Share2 className="w-4 h-4" /> Download
          </Button>
        </div>
        <div className="flex justify-center">
          <div className="w-48 h-48 flex items-center justify-center bg-white border border-gray-200 rounded-lg">
            {qrLoading ? (
              <Skeleton className="w-40 h-40" />
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="Event QR code" className="w-40 h-40" />
            ) : (
              <QrCodeIcon className="w-12 h-12 text-gray-300" />
            )}
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Sharing Settings</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Show Share Buttons</p>
            <p className="text-xs text-gray-500">Display share buttons on the guest site</p>
          </div>
          <Toggle checked={config.enabled} onChange={(v) => updateConfig({ enabled: v })} />
        </div>
        <FormField label="Share Message">
          <Textarea
            value={config.message}
            onChange={(e) => updateConfig({ message: e.target.value })}
            placeholder="You're invited!"
          />
        </FormField>
        <FormField label="WhatsApp Text">
          <Input
            value={config.whatsappText}
            onChange={(e) => updateConfig({ whatsappText: e.target.value })}
            placeholder="WhatsApp share text"
          />
        </FormField>
        <FormField label="Facebook Text">
          <Input
            value={config.facebookText}
            onChange={(e) => updateConfig({ facebookText: e.target.value })}
            placeholder="Facebook share text"
          />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Email Subject">
            <Input
              value={config.emailSubject}
              onChange={(e) => updateConfig({ emailSubject: e.target.value })}
              placeholder="Email subject"
            />
          </FormField>
          <FormField label="Email Body">
            <Input
              value={config.emailBody}
              onChange={(e) => updateConfig({ emailBody: e.target.value })}
              placeholder="Email body text"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="QR Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.qrColor}
                onChange={(e) => updateConfig({ qrColor: e.target.value })}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <Input
                value={config.qrColor}
                onChange={(e) => updateConfig({ qrColor: e.target.value })}
                className="font-mono"
              />
            </div>
          </FormField>
          <FormField label="QR Background Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.qrBgColor}
                onChange={(e) => updateConfig({ qrBgColor: e.target.value })}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <Input
                value={config.qrBgColor}
                onChange={(e) => updateConfig({ qrBgColor: e.target.value })}
                className="font-mono"
              />
            </div>
          </FormField>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Settings
          </Button>
        </div>
      </Card>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
