import QRCode from "qrcode";

export async function generateQrDataUrl(
  text: string,
  options: { width?: number; margin?: number; dark?: string; light?: string } = {}
): Promise<string> {
  const {
    width = 256,
    margin = 2,
    dark = "#000000",
    light = "#ffffff",
  } = options;
  return QRCode.toDataURL(text, {
    width,
    margin,
    color: { dark, light },
    errorCorrectionLevel: "M",
  });
}

export async function downloadQrCode(
  text: string,
  fileName = "qr-code.png",
  options: { width?: number; margin?: number; dark?: string; light?: string } = {}
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
  options: { margin?: number; dark?: string; light?: string } = {}
): Promise<void> {
  const { margin = 2, dark = "#000000", light = "#ffffff" } = options;
  const svg = await QRCode.toString(text, {
    type: "svg",
    margin,
    color: { dark, light },
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
