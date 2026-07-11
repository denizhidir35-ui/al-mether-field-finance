import type { ModuleId } from "@/core/navigation/navigation.types";
import type { FieldTask } from "../types";

type WorkProgressWidgetProps = { tasks: readonly FieldTask[]; onNavigate: (module: ModuleId) => void };

export function WorkProgressWidget({ tasks, onNavigate }: WorkProgressWidgetProps) {
  const averageProgress = Math.round(
    tasks.reduce((total, task) => total + task.progress, 0) / tasks.length
  );

  return (
    <article className="mether-surface flex h-full flex-col rounded-[20px] p-3 sm:p-4">
      <div className="flex items-center justify-between"><div><div className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">Field Operations</div><h2 className="mt-1 text-sm font-bold text-white">İş ilerlemesi</h2></div><button type="button" onClick={() => onNavigate("operations")} className="text-[9px] font-bold text-blue-400">Tüm işler</button></div>
      <div className="mt-3 space-y-3">
        {tasks.map(task => <div key={task.title}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-[11px] font-bold text-slate-200">{task.title}</div><div className="mt-0.5 truncate text-[8px] text-slate-600">{task.location} · {task.team} · {task.status}</div></div><div className="shrink-0 text-[11px] font-black text-blue-300">%{task.progress}</div></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-400" style={{ width: `${task.progress}%` }} /></div></div>)}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.018] px-3 py-2.5"><div className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-600">Aktif işler</div><div className="mt-1 text-sm font-black text-slate-200">{tasks.length}</div></div>
        <div className="rounded-xl border border-blue-400/[0.08] bg-blue-500/[0.035] px-3 py-2.5"><div className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-600">Ortalama ilerleme</div><div className="mt-1 text-sm font-black text-blue-300">%{averageProgress}</div></div>
      </div>
    </article>
  );
}
