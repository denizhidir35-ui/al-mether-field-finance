import { ChevronRight, MapPin, UserRound } from "lucide-react";
import type { OperationProject } from "../types";

type ProjectsListProps = {
  projects: readonly OperationProject[];
  selectedId: string;
  onSelect: (project: OperationProject) => void;
};

export function ProjectsList({ projects, selectedId, onSelect }: ProjectsListProps) {
  return (
    <article className="mether-surface flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] p-3.5">
      <header className="flex items-center justify-between px-1"><div><div className="text-[8px] font-bold uppercase tracking-[0.18em] text-blue-400/70">Project Pipeline</div><h2 className="mt-1 text-[15px] font-black text-white">Aktif Projeler</h2></div><span className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[8px] font-bold text-slate-500">{projects.length} proje</span></header>
      <div className="mether-scroll mt-3 min-h-0 space-y-2 overflow-y-auto pr-1">
        {projects.map(project => {
          const active = project.id === selectedId;
          return (
            <button key={project.id} type="button" onClick={() => onSelect(project)} className={`w-full rounded-[16px] border p-3 text-left transition ${active ? "border-blue-400/25 bg-blue-500/[0.08] shadow-[0_10px_30px_rgba(37,99,235,.08)]" : "border-white/[0.055] bg-black/10 hover:border-blue-400/15 hover:bg-white/[0.025]"}`}>
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate text-[10px] font-bold text-slate-200">{project.name}</div><div className="mt-1 flex items-center gap-1 text-[8px] text-slate-500"><MapPin size={9} /> {project.city} · {project.district} · Ada {project.island}</div></div><ChevronRight size={13} className={active ? "text-blue-300" : "text-slate-700"} /></div>
              <div className="mt-2.5 flex items-center justify-between"><span className="flex items-center gap-1 text-[8px] text-slate-500"><UserRound size={9} /> {project.supervisor}</span><span className="text-[9px] font-black text-blue-300">%{project.progress}</span></div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${project.progress}%` }} /></div>
              <div className="mt-2 flex items-center justify-between text-[8px]"><span className="rounded-md bg-white/[0.035] px-1.5 py-0.5 font-bold text-slate-500">{project.status}</span><span className="text-slate-600">{project.streets} sokak</span></div>
            </button>
          );
        })}
      </div>
    </article>
  );
}
