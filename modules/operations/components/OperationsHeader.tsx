import { HardHat, Plus, RadioTower } from "lucide-react";

export function OperationsHeader({ onOpenChief, onCreateWorkOrder }: { onOpenChief: () => void; onCreateWorkOrder: () => void }) {
  return (
    <header className="mether-surface flex items-center justify-between gap-3 rounded-[20px] px-3.5 py-3 sm:px-5 xl:rounded-[24px] xl:px-6 xl:py-4">
      <div>
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-blue-400/80">
          <RadioTower size={13} /> Operations
        </div>
        <h1 className="mt-1 text-xl font-black tracking-[-0.04em] text-white sm:text-2xl xl:mt-1.5 xl:text-[30px]">Live Operations Center</h1>
        <p className="mt-1 hidden text-[10px] text-slate-500 sm:block">Şirketin canlı saha projeleri, ilerleme ve günlük operasyon merkezi.</p>
      </div>
      <div className="flex items-center gap-1.5"><button type="button" aria-label="Şef Konsolu" onClick={onOpenChief} className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-blue-400/15 bg-blue-500/10 px-2.5 text-[9px] font-bold text-blue-300 xl:h-10 xl:px-3"><HardHat size={14} /><span className="hidden min-[420px]:inline">Şef Konsolu</span></button><button type="button" aria-label="Yeni İş Emri" onClick={onCreateWorkOrder} className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-blue-400/20 bg-blue-600 px-2.5 text-[9px] font-black text-white shadow-[0_10px_30px_rgba(37,99,235,.2)] xl:h-10 xl:gap-2 xl:px-4 xl:text-[10px]"><Plus size={14} /> <span className="hidden min-[520px]:inline">Yeni İş Emri</span></button></div>
    </header>
  );
}
