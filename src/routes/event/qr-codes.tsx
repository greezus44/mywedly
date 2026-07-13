import { useState, useEffect } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { UserEvent, SharingConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { FormField, ColorInput, ErrorState, Skeleton, Toast } from "../../components/ui/index";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";
import { Download, QrCode } from "lucide-react";

type Ctx = { event: UserEvent | null };

const defaultSharing: SharingConfig = {
  showShareButtons: true, shareMessage: "", whatsappText: "", facebookText: "",
  emailSubject: "", emailBody: "", qrColor: "#000000", qrBgColor: "#ffffff",
};

export default function QrCodes() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [qrColor, setQrColor] = useState(event?.sharing_config?.qrColor || "#000000");
  const [qrBgColor, setQrBgColor] = useState(event?.sharing_config?.qrBgColor || "#ffffff");
  const [eventUrl, setEventUrl] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [rsvpUrl, setRsvpUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (event?.sharing_config) {
      setQrColor(event.sharing_config.qrColor || "#000000");
      setQrBgColor(event.sharing_config.qrBgColor || "#ffffff");
    }
  }, [event?.id]);

  useEffect(() => {
    if (!eventId) return;
    const base = `${window.location.origin}/e/${eventId}`;
    setEventUrl(base);
    setCoverUrl(`${base}`);
    setRsvpUrl(`${base}/rsvp`);
    setLoading(false);
  }, [eventId]);

  const generate = async (text: string) => {
    return generateQrDataUrl(text, { color: qrColor, bgColor: qrBgColor, size: 300 });
  };

  const handleDownload = async (text: string, filename: string) => {
    try {
      const url = await generate(text);
      downloadQrCode(url, filename);
      setToast("Downloaded");
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast("Failed to generate QR");
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;

  const codes = [
    { label: "Event URL", url: eventUrl, filename: `qr-event-${eventId}.png`, description: "Link to the main event page" },
    { label: "Cover Page", url: coverUrl, filename: `qr-cover-${eventId}.png`, description: "Link to the event cover" },
    { label: "RSVP Page", url: rsvpUrl, filename: `qr-rsvp-${eventId}.png`, description: "Direct link to RSVP form" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">QR Codes</h1>
        <p className="text-sm text-gray-500">Generate and download QR codes for your event</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">QR Colors</h3>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <FormField label="QR Color"><ColorInput value={qrColor} onChange={setQrColor} /></FormField>
          <FormField label="Background Color"><ColorInput value={qrBgColor} onChange={setQrBgColor} /></FormField>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {codes.map(code => (
            <div key={code.label} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center text-center">
              <div className="w-48 h-48 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 mb-4 overflow-hidden">
                <QrCodePreview text={code.url} color={qrColor} bgColor={qrBgColor} />
              </div>
              <h3 className="font-semibold text-gray-900">{code.label}</h3>
              <p className="text-xs text-gray-500 mt-1 mb-3">{code.description}</p>
              <p className="text-xs text-gray-400 truncate w-full mb-4">{code.url}</p>
              <Button variant="secondary" size="sm" onClick={() => handleDownload(code.url, code.filename)}><Download className="w-4 h-4" /> Download PNG</Button>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function QrCodePreview({ text, color, bgColor }: { text: string; color: string; bgColor: string }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    generateQrDataUrl(text, { color, bgColor, size: 300 }).then(setSrc);
  }, [text, color, bgColor]);

  if (!src) return <QrCode className="w-16 h-16 text-gray-300" />;
  return <img src={src} alt="QR Code" className="w-44 h-44" />;
}
