import type { MapCoordinate } from "@/core/map/types";

export interface OperationLocationService {
  capture(): Promise<MapCoordinate>;
}

export function captureBrowserLocation(): Promise<MapCoordinate> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Bu cihaz GPS konumunu desteklemiyor."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => reject(new Error("GPS konumu alınamadı. Konum iznini kontrol edin.")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}
