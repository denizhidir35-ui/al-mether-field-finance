import type { MapCoordinate } from "@/core/map/types";

export interface OperationLocationService {
  capture(): Promise<MapCoordinate>;
}

function requestLocation(options: PositionOptions): Promise<MapCoordinate> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      reject,
      options,
    );
  });
}

function locationError(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = Number((error as { code: number }).code);
    if (code === 1) return new Error("Konum izni reddedildi. Tarayıcı ayarlarından bu site için konum iznini açın.");
    if (code === 2) return new Error("Cihaz konumu belirleyemedi. GPS veya Wi-Fi bağlantısını açıp tekrar deneyin.");
    if (code === 3) return new Error("Konum isteği zaman aşımına uğradı. Açık alanda tekrar deneyin.");
  }
  return new Error("GPS konumu alınamadı. Konum iznini ve cihaz konum ayarını kontrol edin.");
}

export async function captureBrowserLocation(): Promise<MapCoordinate> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("Bu tarayıcı konum algılamayı desteklemiyor.");
  }
  if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
    throw new Error("Konum algılama için uygulamayı güvenli HTTPS bağlantısından açın.");
  }

  try {
    return await requestLocation({ enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && Number((error as { code: number }).code) === 1) throw locationError(error);
    try {
      return await requestLocation({ enableHighAccuracy: false, timeout: 20_000, maximumAge: 60_000 });
    } catch (fallbackError) {
      throw locationError(fallbackError);
    }
  }
}
