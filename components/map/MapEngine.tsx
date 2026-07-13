"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { MapBounds, MapCoordinate, MapEngineHandle, MapLayer, MapLegendItem, MapMarker, MapProviderId } from "@/core/map/types";
import { DEFAULT_MAP_CONFIGURATION } from "@/core/map/services";
import { GoogleMapProvider, useGoogleMap } from "./GoogleMapProvider";
import { MapControls } from "./MapControls";
import { MapLayers } from "./MapLayers";
import { MapLegend } from "./MapLegend";
import { MapMarkers } from "./MapMarkers";

type MapEngineProps = {
  provider?: MapProviderId;
  center?: MapCoordinate;
  zoom?: number;
  markers?: readonly MapMarker[];
  layers?: readonly MapLayer[];
  legend?: readonly MapLegendItem[];
  onMarkerClick?: (marker: MapMarker) => void;
};

const DEFAULT_LAYERS: readonly MapLayer[] = [
  { id: "supervisors", label: "Şefler", enabled: false, available: false },
  { id: "distribution-boxes", label: "DK", enabled: false, available: false },
  { id: "streets", label: "Sokaklar", enabled: false, available: false },
  { id: "buildings", label: "Binalar", enabled: false, available: false },
  { id: "photos", label: "Fotoğraflar", enabled: false, available: false },
  { id: "completed", label: "Tamamlananlar", enabled: false, available: false },
  { id: "pending", label: "Bekleyenler", enabled: false, available: false }
];

function GoogleMapCanvas({ center, zoom, markers, layers, legend, onMarkerClick }: Required<Pick<MapEngineProps, "center" | "zoom" | "markers" | "layers" | "legend">> & Pick<MapEngineProps, "onMarkerClick">, ref: React.ForwardedRef<MapEngineHandle>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { libraries, loading, error } = useGoogleMap();

  useEffect(() => {
    if (!libraries || !containerRef.current || mapRef.current) return;

    mapRef.current = new libraries.maps.Map(containerRef.current, {
      center,
      zoom,
      disableDefaultUI: true,
      clickableIcons: false,
      gestureHandling: "greedy",
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
      backgroundColor: "#07101f",
      colorScheme: "DARK"
    });
    setMap(mapRef.current);
  }, [center, libraries, zoom]);

  useEffect(() => { mapRef.current?.setCenter(center); }, [center]);
  useEffect(() => { mapRef.current?.setZoom(zoom); }, [zoom]);

  useImperativeHandle(ref, () => ({
    fitBounds: (bounds: MapBounds) => mapRef.current?.fitBounds(bounds),
    setCenter: (nextCenter: MapCoordinate) => mapRef.current?.panTo(nextCenter),
    setZoom: (nextZoom: number) => mapRef.current?.setZoom(nextZoom)
  }), []);

  const zoomBy = useCallback((amount: number) => {
    const currentZoom = mapRef.current?.getZoom() ?? zoom;
    mapRef.current?.setZoom(currentZoom + amount);
  }, [zoom]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#07101f]">
      <div ref={containerRef} className="h-full w-full" aria-label="Google Operations Map" />
      {map && libraries ? <MapMarkers map={map} markerLibrary={libraries.marker} markers={markers} onMarkerClick={onMarkerClick} /> : null}
      {map ? <><MapControls onZoomIn={() => zoomBy(1)} onZoomOut={() => zoomBy(-1)} onRecenter={() => { map.panTo(center); map.setZoom(zoom); }} /><MapLayers layers={layers} /><MapLegend items={legend} /></> : null}
      {loading ? <div className="absolute inset-0 grid place-items-center bg-[#07101f]"><div className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-400/70">Google Maps yükleniyor</div></div> : null}
      {error ? <div className="absolute inset-0 grid place-items-center bg-[#07101f] px-6 text-center"><div><div className="text-[11px] font-bold text-rose-300">{error}</div><p className="mt-2 text-[9px] leading-5 text-slate-600">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ve Maps JavaScript API ayarlarını kontrol edin.</p></div></div> : null}
    </div>
  );
}

const ForwardedGoogleMapCanvas = forwardRef(GoogleMapCanvas);

export const MapEngine = forwardRef<MapEngineHandle, MapEngineProps>(function MapEngine({ provider = DEFAULT_MAP_CONFIGURATION.provider, center = DEFAULT_MAP_CONFIGURATION.center, zoom = DEFAULT_MAP_CONFIGURATION.zoom, markers = [], layers = DEFAULT_LAYERS, legend = [], onMarkerClick }, ref) {
  if (provider !== "google") return <div className="grid h-full place-items-center bg-[#07101f] text-[10px] text-slate-500">Harita sağlayıcısı henüz aktif değil.</div>;

  return <GoogleMapProvider><ForwardedGoogleMapCanvas ref={ref} center={center} zoom={zoom} markers={markers} layers={layers} legend={legend} onMarkerClick={onMarkerClick} /></GoogleMapProvider>;
});
