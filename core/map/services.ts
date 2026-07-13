import type { MapBounds, MapCoordinate, MapMarker, MapProviderConfiguration } from "./types";

export const IZMIR_CENTER: MapCoordinate = { lat: 38.4237, lng: 27.1428 };

export const DEFAULT_MAP_CONFIGURATION: MapProviderConfiguration = {
  provider: "google",
  center: IZMIR_CENTER,
  zoom: 11
};

export function createBounds(coordinates: readonly MapCoordinate[]): MapBounds | null {
  if (coordinates.length === 0) return null;

  return coordinates.reduce<MapBounds>((bounds, coordinate) => ({
    north: Math.max(bounds.north, coordinate.lat),
    east: Math.max(bounds.east, coordinate.lng),
    south: Math.min(bounds.south, coordinate.lat),
    west: Math.min(bounds.west, coordinate.lng)
  }), {
    north: coordinates[0].lat,
    east: coordinates[0].lng,
    south: coordinates[0].lat,
    west: coordinates[0].lng
  });
}

export function focusMarker(markers: readonly MapMarker[], markerId: string): MapMarker[] {
  return markers.map(marker => ({ ...marker, active: marker.id === markerId }));
}
