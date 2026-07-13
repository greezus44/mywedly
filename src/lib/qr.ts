export async function generateQrDataUrl(text: string, size = 256): Promise<string> {
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  const res = await fetch(apiUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to convert QR to data URL"));
    reader.readAsDataURL(blob);
  });
}

export async function downloadQrCode(text: string, filename = "qr-code.png"): Promise<void> {
  const dataUrl = await generateQrDataUrl(text, 512);
  const link = document.createElement("a");
  link.href = dataUrl; link.download = filename; link.click();
}

export async function downloadQrSvg(text: string, filename = "qr-code.svg"): Promise<void> {
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&format=svg&data=${encodeURIComponent(text)}`;
  const res = await fetch(apiUrl);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  URL.revokeObjectURL(url);
}
