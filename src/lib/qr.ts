import QRCode from "qrcode";

export async function generateQrDataUrl(text: string, opts?: { width?: number; margin?: number; dark?: string; light?: string }): Promise<string> {
  return QRCode.toDataURL(text, {
    width: opts?.width ?? 256,
    margin: opts?.margin ?? 2,
    color: { dark: opts?.dark ?? "#000000", light: opts?.light ?? "#ffffff" },
    errorCorrectionLevel: "M",
  });
}

export async function downloadQrCode(text: string, filename = "qr-code.png"): Promise<void> {
  const dataUrl = await generateQrDataUrl(text, { width: 512 });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function downloadQrSvg(text: string, filename = "qr-code.svg"): Promise<void> {
  const svg = await QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 2 });
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
