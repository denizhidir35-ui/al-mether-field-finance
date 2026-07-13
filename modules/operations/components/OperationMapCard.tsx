import { LocateFixed, Map, Navigation } from "lucide-react";
import type { OperationProject } from "../types";

export function OperationMapCard({ projects, selectedId, onSelect }: { projects: readonly OperationProject[]; selectedId: string; onSelect: (project: OperationProject) => void }) {
  return (
    <article className="mether-surface relative h-full min-h-0 overflow-hidden rounded-[22px] xl:min-h-[280px]">
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(96,165,250,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,.055)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_48%,rgba(37,99,235,.12),transparent_34%)]" />
      <header className="relative z-10 flex items-start justify-between border-b border-white/[0.055] px-4 py-3"><div><div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.17em] text-blue-400/70"><Map size={12} /> Live Field View</div><h2 className="mt-1 text-[15px] font-black text-white">Operation Map</h2></div><button type="button" aria-label="Haritayı ortala" className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-slate-500"><LocateFixed size={14} /></button></header>
      <div className="absolute inset-x-0 bottom-0 top-[62px]">
        {projects.map(project => {
          const active = project.id === selectedId;
          return <button key={project.id} type="button" onClick={() => onSelect(project)} aria-label={`${project.name} harita noktası`} className={`absolute -translate-x-1/2 -translate-y-1/2 transition ${active ? "z-20 scale-110" : "z-10 opacity-70 hover:opacity-100"}`} style={{ left: `${project.coordinates.x}%`, top: `${project.coordinates.y}%` }}><span className={`grid h-9 w-9 place-items-center rounded-full border shadow-[0_12px_28px_rgba(0,0,0,.45)] ${active ? "border-blue-300/50 bg-blue-500 text-white" : "border-white/10 bg-[#101a2d] text-blue-300"}`}><Navigation size={14} fill="currentColor" /></span><span className={`mt-1 block whitespace-nowrap rounded-md border px-2 py-1 text-[8px] font-bold backdrop-blur-xl ${active ? "border-blue-400/25 bg-blue-500/15 text-blue-200" : "border-white/[0.06] bg-[#07101f]/80 text-slate-500"}`}>{project.island}</span></button>;
        })}
        <div className="absolute bottom-3 left-4 rounded-lg border border-white/[0.055] bg-[#07101f]/75 px-2.5 py-1.5 text-[8px] text-slate-600 backdrop-blur-xl">Google Maps entegrasyon alanı</div>
      </div>
    </article>
  );
}
