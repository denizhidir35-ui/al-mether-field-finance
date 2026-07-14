import { Trophy } from "lucide-react";

export function ChiefMotivationCard({ leaderCode, leaderProgress, chiefCode, chiefProgress }: { leaderCode: string; leaderProgress: number; chiefCode: string; chiefProgress: number }) {
  return (
    <aside aria-label="Operasyon durumu" className="flex items-center gap-3 rounded-[20px] border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400/[0.09] text-amber-300"><Trophy size={16} /></div>
      <div className="min-w-0 flex-1"><div className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">Operasyon Durumu</div><div className="mt-1 text-[9px] font-bold text-slate-300">Lider <span className="text-white">{leaderCode}</span> · %{leaderProgress}</div></div>
      <div className="border-l border-white/[0.06] pl-3 text-right"><div className="text-[8px] text-slate-500">Sen</div><div className="mt-0.5 text-[10px] font-black text-blue-300">{chiefCode} · %{chiefProgress}</div></div>
    </aside>
  );
}
