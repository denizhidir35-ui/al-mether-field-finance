import type { FieldPersonnelCode } from "../domain/identifiers.ts";
import { OPERATION_CODE_PATTERNS } from "../domain/identifiers.ts";

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
  if (!Detector) throw new Error("Bu cihaz QR okumayı desteklemiyor. Güncel Chrome ile tekrar deneyin.");
  const bitmap = await createImageBitmap(file);
  try {
    const matches = await new Detector({ formats: ["qr_code"] }).detect(bitmap);
    if (!matches[0]?.rawValue) throw new Error("Fotoğrafta okunabilir QR bulunamadı.");
    return parsePersonnelQr(matches[0].rawValue);
  } finally {
    bitmap.close();
  }
}
