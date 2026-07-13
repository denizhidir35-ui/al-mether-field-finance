import { Activity, Camera, CheckCircle2, Clock3, Construction, Route } from "lucide-react";
import type { DailyOperationMetric } from "../types";

const ICONS = [CheckCircle2, Construction, Clock3, Camera, Route] as const;

export function DailyOperationCard({ metrics }: { metrics: readonly DailyOperationMetric[] }) {
  return (
    <article className="mether-surface rounded-[16px] px-2.5 py-2 xl:rounded-[15px] xl:px-3 xl:py-1.5">
      <div className="flex items-center gap-2 xl:gap-2">
        <div className="hidden w-[132px] shrink-0 border-r border-white/[0.06] pr-3 sm:block"><div className="flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-[0.16em] text-blue-400/70"><Activity size={11} /> Günlük Akış</div><h2 className="mt-0.5 whitespace-nowrap text-[11px] font-black text-white xl:text-[12px]">Bugünkü Operasyon</h2></div>
        <div className="grid flex-1 grid-cols-5 gap-1 xl:gap-0">
          {metrics.map((metric, index) => { const Icon = ICONS[index]; return <div key={metric.label} className="flex min-w-0 items-center justify-center gap-1 rounded-lg border border-white/[0.05] bg-black/10 px-1.5 py-1.5 xl:justify-start xl:gap-2 xl:rounded-none xl:border-0 xl:border-l xl:border-white/[0.055] xl:bg-transparent xl:px-4 xl:py-1"><Icon size={11} className="hidden shrink-0 text-blue-400/65 min-[440px]:block xl:h-[12px] xl:w-[12px]" /><div className="min-w-0 text-center xl:text-left"><div className="text-sm font-black leading-none text-slate-200 xl:text-[15px]">{metric.value}</div><div className="mt-1 text-[6px] font-bold uppercase tracking-[0.04em] text-slate-600 xl:mt-0.5 xl:text-[7px] xl:tracking-[0.08em]"><span className="xl:hidden">{metric.mobileLabel}</span><span className="hidden xl:inline">{metric.label}</span></div></div></div>; })}
        </div>
      </div>
    </article>
  );
}
