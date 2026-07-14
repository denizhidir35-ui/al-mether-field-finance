"use client";

import { useEffect } from "react";
import type { MapMarker } from "@/core/map/types";

const TONE_CLASSES: Record<NonNullable<MapMarker["tone"]>, string> = {
  default: "border-slate-400/40 bg-[#111b2e] text-slate-200",
  active: "border-blue-200/70 bg-blue-500 text-white shadow-[0_0_0_6px_rgba(59,130,246,.16),0_14px_35px_rgba(37,99,235,.45)]",
  success: "border-emerald-300/50 bg-emerald-500 text-white",
  warning: "border-amber-300/50 bg-amber-500 text-white"
};

export function MapMarkers({ map, markerLibrary, markers, onMarkerClick }: { map: google.maps.Map; markerLibrary: google.maps.MarkerLibrary; markers: readonly MapMarker[]; onMarkerClick?: (marker: MapMarker) => void }) {
  useEffect(() => {
    const instances = markers.map(marker => {
      const content = document.createElement("button");
      const tone = marker.tone ?? "default";
      content.type = "button";
      content.className = `grid min-h-9 min-w-9 place-items-center rounded-full border px-2 text-[9px] font-black transition ${TONE_CLASSES[tone]} ${marker.active ? "ring-2 ring-blue-100/80 ring-offset-2 ring-offset-[#07101f]" : ""}`;
      content.textContent = marker.label ?? "•";
      content.setAttribute("aria-label", marker.title ?? marker.label ?? "Harita işareti");

      const instance = new markerLibrary.AdvancedMarkerElement({
        map,
        position: marker.position,
        title: marker.title,
        content,
        zIndex: marker.active ? 20 : 10
      });

      instance.addEventListener("gmp-click", () => onMarkerClick?.(marker));
      return instance;
    });

    return () => { instances.forEach(instance => { instance.map = null; }); };
  }, [map, markerLibrary, markers, onMarkerClick]);

  return null;
}
