export async function generateQrDataUrl(text: string, size: number = 200): Promise<string> {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
}
export async function downloadQrCode(text: string, filename: string = "qr-code.png"): Promise<void> {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(text)}`;
  const response = await fetch(url); const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = downloadUrl; a.download = filename; a.click();
  URL.revokeObjectURL(downloadUrl);
}
export async function downloadQrSvg(text: string, filename: string = "qr-code.svg"): Promise<void> {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=svg&data=${encodeURIComponent(text)}`;
  const response = await fetch(url); const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = downloadUrl; a.download = filename; a.click();
  URL.revokeObjectURL(downloadUrl);
}
