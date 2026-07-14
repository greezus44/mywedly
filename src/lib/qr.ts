import QRCode from "qrcode";

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 2,
    width: 256,
    errorCorrectionLevel: "M",
  });
}

export async function downloadQrCode(text: string, filename: string): Promise<void> {
  const dataUrl = await generateQrDataUrl(text);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function downloadQrSvg(text: string, filename: string): Promise<void> {
  const svgString = await QRCode.toString(text, {
    type: "svg",
    margin: 2,
    errorCorrectionLevel: "M",
  });
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".svg") ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
