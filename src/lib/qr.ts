import QRCode from "qrcode";

export async function generateQrDataUrl(text: string, opts?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }): Promise<string> {
  const qrOpts = {
    width: opts?.width ?? 256,
    margin: opts?.margin ?? 2,
    color: {
      dark: opts?.color?.dark ?? "#000000",
      light: opts?.color?.light ?? "#ffffff",
    },
  };
  return QRCode.toDataURL(text, qrOpts);
}

export async function downloadQrCode(
  text: string,
  fileName: string = "qr-code.png",
  opts?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }
): Promise<void> {
  const dataUrl = await generateQrDataUrl(text, opts);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadQrSvg(
  text: string,
  fileName: string = "qr-code.svg",
  opts?: { margin?: number; color?: { dark?: string; light?: string } }
): Promise<void> {
  const svgOpts = {
    type: "svg" as const,
    margin: opts?.margin ?? 2,
    color: {
      dark: opts?.color?.dark ?? "#000000",
      light: opts?.color?.light ?? "#ffffff",
    },
  };
  const svg = await QRCode.toString(text, svgOpts);
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
