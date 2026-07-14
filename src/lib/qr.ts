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

export async function generateQrSvg(
  text: string,
  options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }
): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    width: options?.width ?? 256,
    margin: options?.margin ?? 2,
    color: {
      dark: options?.color?.dark ?? "#000000",
      light: options?.color?.light ?? "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadQrCode(
  text: string,
  filename = "qr-code.png",
  options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }
): Promise<void> {
  const dataUrl = await generateQrDataUrl(text, options);
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  downloadBlob(blob, filename);
}

export async function downloadQrSvg(
  text: string,
  filename = "qr-code.svg",
  options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }
): Promise<void> {
  const svg = await generateQrSvg(text, options);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  downloadBlob(blob, filename);
}
