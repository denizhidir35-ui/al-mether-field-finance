"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Map } from "lucide-react";
import { MapEngine } from "@/components/map/MapEngine";
import type { MapEngineHandle, MapLegendItem, MapMarker } from "@/core/map/types";
import type { OperationProject } from "../types";

export function OperationMapCard({ projects, projectedMarkers, selectedId, onSelect }: { projects: readonly OperationProject[]; projectedMarkers: readonly MapMarker[]; selectedId: string; onSelect: (project: OperationProject) => void }) {
  const mapRef = useRef<MapEngineHandle>(null);
  const markers = useMemo<readonly MapMarker[]>(() => projectedMarkers.map(marker => ({ ...marker, active: marker.id === selectedId })), [projectedMarkers, selectedId]);
  const legend = useMemo<readonly MapLegendItem[]>(() => [
    { id: "selected", label: "Seçili proje", tone: "active" },
    { id: "field", label: "Sahada", tone: "default" },
    { id: "complete", label: "Teslim", tone: "success" }
  ], []);

  const focusProject = useCallback((lat: number, lng: number) => {
    mapRef.current?.setCenter({ lat, lng });
    mapRef.current?.setZoom(13);
  }, []);

  useEffect(() => {
    const selectedProject = projects.find(project => project.id === selectedId);
    if (selectedProject) focusProject(selectedProject.coordinates.lat, selectedProject.coordinates.lng);
  }, [focusProject, projects, selectedId]);

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    const project = projects.find(candidate => candidate.id === marker.id);
    if (!project) return;
    onSelect(project);
    focusProject(project.coordinates.lat, project.coordinates.lng);
  }, [focusProject, onSelect, projects]);

  return (
    <article className="mether-surface relative h-full min-h-0 overflow-hidden rounded-[22px] xl:min-h-[280px]">
      <header className="theme-dark-zone relative z-10 flex items-start justify-between border-b border-white/[0.055] bg-[#07101f]/92 px-4 py-3 backdrop-blur-xl"><div><div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.17em] text-blue-400/70"><Map size={12} /> Live Field View</div><h2 className="mt-1 text-[15px] font-black text-white">Operation Map</h2></div><span className="rounded-lg border border-emerald-400/10 bg-emerald-500/[0.06] px-2 py-1 text-[7px] font-bold uppercase tracking-[0.12em] text-emerald-300/75">Google Maps · Live</span></header>
      <div className="absolute inset-x-0 bottom-0 top-[62px]"><MapEngine ref={mapRef} center={{ lat: 38.4237, lng: 27.1428 }} zoom={11} markers={markers} legend={legend} onMarkerClick={handleMarkerClick} /></div>
    </article>
  );
}
