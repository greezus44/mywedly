const QR_API = "https://api.qrserver.com/v1";

export async function generateQrDataUrl(text: string, size = 256): Promise<string> {
  const url = `${QR_API}/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to generate QR code: ${res.status}`);
  }
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function downloadFromUrl(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export async function downloadQrCode(text: string, filename = "qr-code.png") {
  const url = `${QR_API}/create-qr-code/?size=512x512&data=${encodeURIComponent(text)}`;
  await downloadFromUrl(url, filename);
}

export async function downloadQrSvg(text: string, filename = "qr-code.svg") {
  const url = `${QR_API}/create-qr-code/?size=512x512&format=svg&data=${encodeURIComponent(text)}`;
  await downloadFromUrl(url, filename);
}
