import QRCode from "qrcode";

export async function generateQrDataUrl(
  text: string,
  options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }
): Promise<string> {
  const opts = {
    width: options?.width ?? 256,
    margin: options?.margin ?? 2,
    color: {
      dark: options?.color?.dark ?? "#000000",
      light: options?.color?.light ?? "#ffffff",
    },
    errorCorrectionLevel: "M" as const,
  };
  return QRCode.toDataURL(text, opts);
}

export async function downloadQrCode(
  text: string,
  filename = "qr-code.png",
  options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }
): Promise<void> {
  const dataUrl = await generateQrDataUrl(text, options);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadQrSvg(
  text: string,
  filename = "qr-code.svg",
  options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }
): Promise<void> {
  const opts = {
    width: options?.width ?? 256,
    margin: options?.margin ?? 2,
    color: {
      dark: options?.color?.dark ?? "#000000",
      light: options?.color?.light ?? "#ffffff",
    },
    errorCorrectionLevel: "M" as const,
  };
  const svg = await QRCode.toString(text, { ...opts, type: "svg" });
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
