import { Activity } from "lucide-react";

export function ChiefOperationSummary({ code, projectName, progress, phaseLabel, currentAction }: { code: string; projectName: string; progress: number; phaseLabel: string; currentAction: string }) {
  return (
    <section className="rounded-[24px] border border-blue-400/20 bg-gradient-to-br from-blue-500/[0.12] to-cyan-400/[0.035] px-4 py-3.5 shadow-[0_18px_50px_rgba(8,47,107,.18)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0"><div className="text-[10px] font-black tracking-[0.08em] text-white">{code}</div><div className="mt-1 truncate text-[10px] font-semibold text-slate-400">{projectName}</div></div>
        <div className="text-[28px] font-black leading-none tracking-[-0.06em] text-blue-300">%{progress}</div>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/30" aria-label={`İlerleme yüzde ${progress}`}><div className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.35)] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
      <div className="mt-2.5 flex items-center justify-between gap-3"><span className="text-[9px] font-black tracking-[0.13em] text-blue-300">{phaseLabel}</span><span className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500"><Activity size={12} /> Canlı</span></div>
      <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/[0.055] bg-black/20 px-3 py-2.5"><span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500">Şu an yapılacak iş</span><strong className="text-[10px] font-black tracking-[0.08em] text-white">{currentAction}</strong></div>
    </section>
  );
}
