import QRCode from "qrcode";

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

export async function downloadQrCode(
  text: string,
  filename = "qr-code.png"
): Promise<void> {
  const dataUrl = await generateQrDataUrl(text);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadQrSvg(
  text: string,
  filename = "qr-code.svg"
): Promise<void> {
  const svgString = await QRCode.toString(text, {
    type: "svg",
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
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
