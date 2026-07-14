import type { LucideIcon } from "lucide-react";
import type { ChiefTone } from "../chief-experience.view-model";

const TONE_STYLES: Record<ChiefTone, string> = {
  active: "border-blue-400/20 bg-blue-500/[0.075]",
  complete: "border-emerald-400/20 bg-emerald-500/[0.065]",
  warning: "border-amber-400/15 bg-amber-500/[0.035]",
  critical: "border-rose-400/20 bg-rose-500/[0.055]",
  passive: "border-white/[0.05] bg-white/[0.018] opacity-70"
};

const ICON_STYLES: Record<ChiefTone, string> = {
  active: "bg-blue-500/15 text-blue-300",
  complete: "bg-emerald-500/15 text-emerald-300",
  warning: "bg-amber-500/10 text-amber-300",
  critical: "bg-rose-500/15 text-rose-300",
  passive: "bg-white/[0.04] text-slate-500"
};

export function ChiefModuleCard({ title, metrics, icon: Icon, tone, onClick }: { title: string; metrics: readonly string[]; icon: LucideIcon; tone: ChiefTone; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`group flex min-h-[116px] flex-col items-start rounded-[22px] border p-3.5 text-left shadow-[0_12px_35px_rgba(0,0,0,.12)] transition hover:-translate-y-0.5 hover:border-blue-400/25 active:scale-[.98] ${TONE_STYLES[tone]}`}>
      <div className="flex w-full items-center justify-between"><div className={`grid h-9 w-9 place-items-center rounded-xl ${ICON_STYLES[tone]}`}><Icon size={18} /></div><span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" /></div>
      <div className="mt-auto pt-3"><div className="text-[13px] font-black tracking-[-0.02em] text-white">{title}</div><div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">{metrics.map(metric => <span key={metric} className="text-[8px] font-semibold leading-3 text-slate-500">{metric}</span>)}</div></div>
    </button>
  );
}
