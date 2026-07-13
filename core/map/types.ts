export type MapProviderId = "google" | "openstreetmap" | "mapbox";

export type MapCoordinate = {
  lat: number;
  lng: number;
};

export type MapMarker = {
  id: string;
  position: MapCoordinate;
  label?: string;
  title?: string;
  active?: boolean;
  tone?: "default" | "active" | "success" | "warning";
};

export type MapLayer = {
  id: string;
  label: string;
  enabled: boolean;
  available: boolean;
};

export type MapLegendItem = {
  id: string;
  label: string;
  tone: NonNullable<MapMarker["tone"]>;
};

export type MapBounds = {
  north: number;
  east: number;
  south: number;
  west: number;
};

export type MapEngineHandle = {
  fitBounds: (bounds: MapBounds) => void;
  setCenter: (center: MapCoordinate) => void;
  setZoom: (zoom: number) => void;
};

export type MapProviderConfiguration = {
  provider: MapProviderId;
  center: MapCoordinate;
  zoom: number;
};
