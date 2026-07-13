import QRCode from "qrcode";

export async function generateQrDataUrl(
  text: string,
  options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }
): Promise<string> {
  return QRCode.toDataURL(text, {
    width: options?.width ?? 256,
    margin: options?.margin ?? 2,
    color: {
      dark: options?.color?.dark ?? "#000000",
      light: options?.color?.light ?? "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

export async function downloadQrCode(
  text: string,
  fileName = "qr-code.png",
  options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }
): Promise<void> {
  const dataUrl = await generateQrDataUrl(text, options);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadQrSvg(
  text: string,
  fileName = "qr-code.svg",
  options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }
): Promise<void> {
  const svg = await QRCode.toString(text, {
    type: "svg",
    width: options?.width ?? 256,
    margin: options?.margin ?? 2,
    color: {
      dark: options?.color?.dark ?? "#000000",
      light: options?.color?.light ?? "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
