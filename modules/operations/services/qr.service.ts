import type { FieldPersonnelCode } from "../domain/identifiers.ts";
import { OPERATION_CODE_PATTERNS } from "../domain/identifiers.ts";
import jsQR from "jsqr";

export interface OperationQrService {
  scan(): Promise<string>;
}

type BarcodeDetectorInstance = { detect(source: ImageBitmapSource): Promise<readonly { rawValue: string }[]> };
type BarcodeDetectorConstructor = new (options: { formats: readonly string[] }) => BarcodeDetectorInstance;

export function parsePersonnelQr(rawValue: string): FieldPersonnelCode {
  const code = rawValue.trim().toUpperCase().split(":").find(part => OPERATION_CODE_PATTERNS.fieldPersonnel.test(part)) ?? "";
  if (!OPERATION_CODE_PATTERNS.fieldPersonnel.test(code)) throw new Error("Geçersiz AL METHER personel QR kodu.");
  return code as FieldPersonnelCode;
}

export async function scanPersonnelQrImage(file: File): Promise<FieldPersonnelCode> {
  const Detector = (globalThis as typeof globalThis & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  const bitmap = await createImageBitmap(file);
  try {
    if (Detector) {
      try {
        const matches = await new Detector({ formats: ["qr_code"] }).detect(bitmap);
        if (matches[0]?.rawValue) return parsePersonnelQr(matches[0].rawValue);
      } catch {
        // Native detector başarısız olduğunda tüm tarayıcılarda çalışan jsQR devralır.
      }
    }

    const maxDimension = 2048;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("QR görüntüsü işlenemedi.");
    context.drawImage(bitmap, 0, 0, width, height);
    const image = context.getImageData(0, 0, width, height);
    const decoded = jsQR(image.data, width, height, { inversionAttempts: "attemptBoth" });
    if (!decoded?.data) throw new Error("Fotoğrafta okunabilir QR bulunamadı. QR kodunu kadraja yaklaştırıp tekrar deneyin.");
    return parsePersonnelQr(decoded.data);
  } finally {
    bitmap.close();
  }
}
