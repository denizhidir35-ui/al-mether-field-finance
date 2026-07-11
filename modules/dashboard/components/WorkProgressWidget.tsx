import { ArrowUpRight, HardHat, MapPin, UsersRound } from "lucide-react";
import type { ModuleId } from "@/core/navigation/navigation.types";
import type { FieldTask, FieldTeam } from "../types";

type Props = { tasks: readonly FieldTask[]; teams: readonly FieldTeam[]; onNavigate: (module: ModuleId) => void };

export function WorkProgressWidget({ tasks, teams, onNavigate }: Props) {
  const average = Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length);
  const people = teams.reduce((sum, team) => sum + team.people, 0);

  return (
    <article className="mether-surface flex min-h-0 flex-col rounded-[18px] p-3.5">
      <header className="flex items-start justify-between"><div><div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.16em] text-blue-400/70"><HardHat size={12} />Saha operasyonu</div><h2 className="mt-1 text-[13px] font-bold text-white">Aktif iş akışı</h2></div><button onClick={() => onNavigate("operations")} className="flex items-center gap-1 text-[8px] font-bold text-blue-400">Operasyona git<ArrowUpRight size={11} /></button></header>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <Metric value={String(tasks.length)} label="Aktif iş" />
        <Metric value={`%${average}`} label="İlerleme" accent />
        <Metric value={String(people)} label="Sahada" />
      </div>
      <div className="mt-2.5 space-y-2">
        {tasks.map(task => (
          <div key={task.title} className="rounded-xl border border-white/[0.055] bg-white/[0.018] px-2.5 py-2">
            <div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="truncate text-[10px] font-bold text-slate-200">{task.title}</div><div className="mt-0.5 flex items-center gap-1 text-[7px] text-slate-600"><MapPin size={8} />{task.location}<span>•</span><UsersRound size={8} />{task.team}</div></div><span className="text-[10px] font-black text-blue-300">%{task.progress}</span></div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${task.progress}%` }} /></div>
          </div>
        ))}
      </div>
    </article>
  );
}

function Metric({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return <div className={`rounded-xl border px-2.5 py-2 ${accent ? "border-blue-400/10 bg-blue-500/[0.05]" : "border-white/[0.055] bg-white/[0.018]"}`}><div className={`text-[14px] font-black ${accent ? "text-blue-300" : "text-slate-200"}`}>{value}</div><div className="text-[7px] uppercase tracking-[0.1em] text-slate-600">{label}</div></div>;
}
