"use client";

import { LocateFixed, Minus, Plus } from "lucide-react";

export function MapControls({ onZoomIn, onZoomOut, onRecenter }: { onZoomIn: () => void; onZoomOut: () => void; onRecenter: () => void }) {
  return (
    <div className="absolute right-3 top-3 z-20 overflow-hidden rounded-xl border border-white/[0.09] bg-[#07101f]/90 shadow-xl backdrop-blur-xl">
      <button type="button" onClick={onZoomIn} aria-label="Yakınlaştır" className="grid h-8 w-8 place-items-center text-slate-400 transition hover:bg-white/[0.05] hover:text-white"><Plus size={13} /></button>
      <button type="button" onClick={onZoomOut} aria-label="Uzaklaştır" className="grid h-8 w-8 place-items-center border-t border-white/[0.06] text-slate-400 transition hover:bg-white/[0.05] hover:text-white"><Minus size={13} /></button>
      <button type="button" onClick={onRecenter} aria-label="Haritayı ortala" className="grid h-8 w-8 place-items-center border-t border-white/[0.06] text-blue-300 transition hover:bg-blue-500/10"><LocateFixed size={13} /></button>
    </div>
  );
}
