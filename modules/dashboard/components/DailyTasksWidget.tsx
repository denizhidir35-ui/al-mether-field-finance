import { CheckCircle2, ChevronRight, Clock3 } from "lucide-react";
import type { ModuleId } from "@/core/navigation/navigation.types";
import type { FieldTask } from "../types";

export function DailyTasksWidget({ tasks, onNavigate }: { tasks: readonly FieldTask[]; onNavigate: (module: ModuleId) => void }) {
  return (
    <article className="mether-surface rounded-[18px] p-3.5">
      <header className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-500/10 text-violet-300"><CheckCircle2 size={14} /></span><div><h2 className="text-[12px] font-bold text-white">Günlük görevler</h2><p className="text-[7px] text-slate-600">Bugünün operasyon planı</p></div></div><button onClick={() => onNavigate("operations")} className="text-slate-600 hover:text-blue-400"><ChevronRight size={14} /></button></header>
      <div className="mt-2.5 divide-y divide-white/[0.045]">
        {tasks.map((task, index) => <div key={task.title} className="flex items-center gap-2 py-2"><button aria-label="Görevi tamamla" className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-white/[0.09] text-transparent hover:border-emerald-400/40 hover:text-emerald-400"><CheckCircle2 size={11} /></button><div className="min-w-0 flex-1"><div className="truncate text-[9px] font-semibold text-slate-300">{task.title}</div><div className="mt-0.5 text-[7px] text-slate-600">{task.team} · {task.location}</div></div><span className="flex items-center gap-1 text-[7px] text-slate-500"><Clock3 size={9} />{task.dueTime}</span>{index === 0 ? <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> : null}</div>)}
      </div>
    </article>
  );
}
