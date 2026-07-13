import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer, Copy, Share2 } from "lucide-react";

type Props = {
  url: string;
  title: string;
};

export function QrCodePanel({ url, title }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 200, margin: 2 }, (err) => {
        if (err) console.error(err);
      });
    }
  }, [url]);

  const download = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${title.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch {}
    }
  };

  return (
    <div className="border border-onyx/10 bg-card p-6 rounded-md">
      <h3 className="text-sm uppercase tracking-widest text-sepia mb-4">{title}</h3>
      <div className="flex flex-col items-center">
        <canvas ref={canvasRef} className="mb-4" />
        <p className="text-sepia text-sm mb-4 break-all text-center">{url}</p>
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={download} className="flex items-center gap-1 text-sepia text-sm hover:text-onyx"><Download className="w-4 h-4" /> PNG</button>
          <button onClick={() => window.print()} className="flex items-center gap-1 text-sepia text-sm hover:text-onyx"><Printer className="w-4 h-4" /> Print</button>
          <button onClick={copyLink} className="flex items-center gap-1 text-sepia text-sm hover:text-onyx"><Copy className="w-4 h-4" /> {copied ? "Copied!" : "Copy"}</button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button onClick={share} className="flex items-center gap-1 text-sepia text-sm hover:text-onyx"><Share2 className="w-4 h-4" /> Share</button>
          )}
        </div>
      </div>
    </div>
  );
}
