import { useState, useEffect, useCallback } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { Download, QrCode as QrCodeIcon, Globe, FileText, Mail } from "lucide-react";
import { UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, ErrorState, Skeleton } from "../../components/ui/index";
import { generateQrDataUrl, downloadQrCode } from "../../lib/qr";

type Ctx = { event: UserEvent | null };

interface QrTarget {
  id: string;
  label: string;
  url: string;
  icon: React.ReactNode;
  description: string;
}

export default function QrCodesPage() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const eventUrl = eventId ? `${baseUrl}/${eventId}` : "";

  const targets: QrTarget[] = [
    {
      id: "event",
      label: "Event Page",
      url: eventUrl,
      icon: <Globe className="w-5 h-5" />,
      description: "Main event landing page",
    },
    {
      id: "cover",
      label: "Cover Page",
      url: `${eventUrl}#cover`,
      icon: <FileText className="w-5 h-5" />,
      description: "Cover / welcome page",
    },
    {
      id: "rsvp",
      label: "RSVP Page",
      url: `${eventUrl}#rsvp`,
      icon: <Mail className="w-5 h-5" />,
      description: "RSVP submission page",
    },
  ];

  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateAll = useCallback(async () => {
    if (!eventUrl) return;
    setLoading(true);
    setError(null);
    try {
      const results: Record<string, string> = {};
      for (const target of targets) {
        const dataUrl = await generateQrDataUrl(target.url, { width: 300 });
        results[target.id] = dataUrl;
      }
      setQrDataUrls(results);
    } catch (err: any) {
      setError(err.message || "Failed to generate QR codes");
    } finally {
      setLoading(false);
    }
  }, [eventUrl]);

  useEffect(() => {
    generateAll();
  }, [generateAll]);

  const handleDownload = (target: QrTarget) => {
    const dataUrl = qrDataUrls[target.id];
    if (!dataUrl) return;
    const safeName = event?.name?.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "event";
    downloadQrCode(dataUrl, `qr-${safeName}-${target.id}.png`);
  };

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">QR Codes</h1>
        <p className="text-sm text-gray-500">Generate and download QR codes for your event pages</p>
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Event URL</label>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700 font-mono truncate">{eventUrl || "—"}</span>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={generateAll} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {targets.map((target) => (
              <Card key={target.id} className="p-4 flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-3 text-gray-700">
                  {target.icon}
                  <h3 className="text-sm font-semibold">{target.label}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">{target.description}</p>
                <div className="w-48 h-48 flex items-center justify-center bg-white border border-gray-200 rounded-lg mb-4">
                  {loading ? (
                    <Skeleton className="w-40 h-40" />
                  ) : qrDataUrls[target.id] ? (
                    <img src={qrDataUrls[target.id]} alt={`QR code for ${target.label}`} className="w-40 h-40" />
                  ) : (
                    <QrCodeIcon className="w-12 h-12 text-gray-300" />
                  )}
                </div>
                <p className="text-xs text-gray-400 font-mono mb-3 truncate max-w-full">{target.url}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(target)}
                  disabled={loading || !qrDataUrls[target.id]}
                >
                  <Download className="w-4 h-4" /> Download PNG
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <p className="text-xs text-gray-400 text-center">
        QR codes link directly to your guest-facing pages. Share them on invitations, posters, or digital media.
      </p>
    </div>
  );
}
