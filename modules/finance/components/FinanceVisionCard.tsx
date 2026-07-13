import { BrainCircuit } from "lucide-react";

export function FinanceVisionCard() {
  return (
    <article className="mether-surface overflow-hidden rounded-[24px]">
      <div className="grid lg:grid-cols-[.85fr_1.15fr]">
        <div className="border-b border-white/[0.06] p-5 sm:p-7 lg:border-b-0 lg:border-r"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-400/70"><BrainCircuit size={14} /> Finance Intelligence</div><h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-white">AL METHER Finance Vision</h2><p className="mt-4 text-xs leading-6 text-slate-400">Finance; manuel veri girişinden uzak, banka merkezli, AI destekli, gerçek zamanlı finans yönetim sistemi olarak geliştirilmektedir.</p></div>
        <div className="p-5 sm:p-7"><div className="text-[10px] font-bold text-slate-400">Platform olay mimarisi</div><p className="mt-4 text-xs leading-6 text-slate-500">Şirket içerisindeki diğer modüllerden gelen finansal olaylar tek merkezde analiz edilecektir.</p><div className="mt-5 flex flex-wrap gap-2">{["HR", "Field", "Operations", "Fleet", "Inventory", "Documents"].map(module => <span key={module} className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 text-[9px] font-bold text-slate-500">{module}</span>)}</div></div>
      </div>
    </article>
  );
}
