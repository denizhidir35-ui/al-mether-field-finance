"use client";

import { Layers3 } from "lucide-react";
import type { MapLayer } from "@/core/map/types";

export function MapLayers({ layers, onToggle }: { layers: readonly MapLayer[]; onToggle?: (layerId: string) => void }) {
  return (
    <details className="group absolute left-3 top-3 z-20">
      <summary className="flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-xl border border-white/[0.09] bg-[#07101f]/90 px-2.5 text-[8px] font-bold text-slate-400 shadow-xl backdrop-blur-xl"><Layers3 size={12} /> Katmanlar</summary>
      <div className="mt-1.5 w-40 rounded-xl border border-white/[0.09] bg-[#07101f]/95 p-2 shadow-2xl backdrop-blur-xl">
        {layers.map(layer => <button key={layer.id} type="button" disabled={!layer.available} onClick={() => onToggle?.(layer.id)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[8px] text-slate-500 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-45"><span>{layer.label}</span><span className={`h-1.5 w-1.5 rounded-full ${layer.enabled ? "bg-blue-400" : "bg-slate-700"}`} /></button>)}
      </div>
    </details>
  );
}
