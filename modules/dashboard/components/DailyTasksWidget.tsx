import { Check, Clock3 } from "lucide-react";
import type { ModuleId } from "@/core/navigation/navigation.types";
import type { FieldTask } from "../types";

type DailyTasksWidgetProps = { tasks: readonly FieldTask[]; onNavigate: (module: ModuleId) => void };

export function DailyTasksWidget({ tasks, onNavigate }: DailyTasksWidgetProps) {
  return (
    <article className="mether-surface rounded-[20px] p-3 sm:p-4">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Clock3 size={15} className="text-blue-400" /><h2 className="text-sm font-bold text-white">Günlük Saha Görevleri</h2></div><button type="button" onClick={() => onNavigate("operations")} className="text-[9px] font-bold text-blue-400">Görevler</button></div>
      <div className="mt-3 divide-y divide-white/[0.05]">
        {tasks.map(task => <div key={task.title} className="flex items-center gap-3 py-2.5"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-slate-500"><Check size={13} /></div><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-bold text-slate-300">{task.title}</div><div className="mt-0.5 truncate text-[8px] text-slate-600">{task.team} · {task.location}</div></div><span className="shrink-0 rounded-full bg-blue-500/[0.08] px-2 py-1 text-[7px] font-bold text-blue-300">%{task.progress}</span></div>)}
      </div>
    </article>
  );
}
