import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";

type Props = {
  url: string;
  size?: number;
  filename?: string;
};

export function QrCodePanel({ url, size = 200, filename = "qr-code" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const fullUrl = url.startsWith("http") ? url : `${origin}${url}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, fullUrl, {
      width: size,
      margin: 1,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    }).catch(() => {});
  }, [fullUrl, size]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("QR code downloaded");
  };

  const printQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>QR Code</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif">
        <img src="${dataUrl}" style="width:400px;height:400px" />
        <p style="margin-top:16px;font-size:14px;color:#666">${fullUrl}</p>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link copied to clipboard");
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Wedding Website", url: fullUrl });
      } catch {}
    } else {
      copyLink();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="border border-onyx/10 rounded-lg" />
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={downloadPng}
          className="text-xs uppercase tracking-widest border border-onyx px-3 py-2 hover:bg-onyx hover:text-parchment transition-colors"
        >
          Download PNG
        </button>
        <button
          onClick={printQr}
          className="text-xs uppercase tracking-widest border border-onyx px-3 py-2 hover:bg-onyx hover:text-parchment transition-colors"
        >
          Print
        </button>
        <button
          onClick={copyLink}
          className="text-xs uppercase tracking-widest border border-onyx px-3 py-2 hover:bg-onyx hover:text-parchment transition-colors"
        >
          Copy Link
        </button>
        <button
          onClick={share}
          className="text-xs uppercase tracking-widest border border-onyx px-3 py-2 hover:bg-onyx hover:text-parchment transition-colors"
        >
          Share
        </button>
      </div>
      <code className="text-xs text-onyx/50 break-all max-w-xs text-center">{fullUrl}</code>
    </div>
  );
}
