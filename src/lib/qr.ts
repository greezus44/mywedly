import QRCode from "qrcode";

/**
 * Generate a QR code as a data URL (base64 PNG by default).
 */
export async function generateQrDataUrl(
  text: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 256,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
    ...options,
  });
}

/**
 * Download a QR code as a PNG image.
 */
export async function downloadQrCode(
  text: string,
  filename: string = "qr-code.png",
  options?: QRCode.QRCodeToDataURLOptions
): Promise<void> {
  const dataUrl = await generateQrDataUrl(text, options);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download a QR code as an SVG file.
 */
export async function downloadQrSvg(
  text: string,
  filename: string = "qr-code.svg",
  options?: QRCode.QRCodeToStringOptions
): Promise<void> {
  const svgString = await QRCode.toString(text, {
    type: "svg",
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
    ...options,
  });
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
