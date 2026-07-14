import QRCode from "qrcode";

export async function generateQrDataUrl(
  text: string,
  options?: QRCode.QRCodeToDataURLOptions,
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    width: 320,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
    errorCorrectionLevel: "M",
  };
  return QRCode.toDataURL(text, { ...defaultOptions, ...options });
}

export async function downloadQrCode(
  text: string,
  filename = "qr-code.png",
  options?: QRCode.QRCodeToDataURLOptions,
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
  options?: QRCode.QRCodeToStringOptions,
): Promise<void> {
  const defaultOptions: QRCode.QRCodeToStringOptions = {
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
    errorCorrectionLevel: "M",
    type: "svg",
  };
  const svg = await QRCode.toString(text, { ...defaultOptions, ...options });
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
