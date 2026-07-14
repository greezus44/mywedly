import QRCode from "qrcode";

export async function generateQrDataUrl(
  text: string,
  options: { width?: number; margin?: number; darkColor?: string; lightColor?: string } = {}
): Promise<string> {
  const {
    width = 256,
    margin = 2,
    darkColor = "#000000",
    lightColor = "#ffffff",
  } = options;

  return QRCode.toDataURL(text, {
    width,
    margin,
    color: { dark: darkColor, light: lightColor },
    errorCorrectionLevel: "M",
  });
}

export async function downloadQrCode(
  text: string,
  fileName: string = "qr-code.png",
  options: { width?: number; margin?: number; darkColor?: string; lightColor?: string } = {}
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
  fileName: string = "qr-code.svg",
  options: { margin?: number; darkColor?: string; lightColor?: string } = {}
): Promise<void> {
  const {
    margin = 2,
    darkColor = "#000000",
    lightColor = "#ffffff",
  } = options;

  const svg = await QRCode.toString(text, {
    type: "svg",
    margin,
    color: { dark: darkColor, light: lightColor },
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
