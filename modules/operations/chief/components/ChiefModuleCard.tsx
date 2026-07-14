import type { LucideIcon } from "lucide-react";

export function ChiefModuleCard({ title, detail, icon: Icon, active, onClick }: { title: string; detail: string; icon: LucideIcon; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`group flex min-h-0 flex-col items-start justify-between rounded-[24px] border p-4 text-left transition active:scale-[.98] ${active ? "border-blue-400/30 bg-blue-500/[0.12]" : "border-white/[0.065] bg-white/[0.025] hover:border-blue-400/20 hover:bg-white/[0.04]"}`}>
      <div className={`grid h-10 w-10 place-items-center rounded-2xl ${active ? "bg-blue-500 text-white" : "bg-blue-500/10 text-blue-300"}`}><Icon size={19} /></div>
      <div><div className="text-[14px] font-black tracking-[-0.02em] text-white">{title}</div><div className="mt-1 text-[9px] leading-4 text-slate-500">{detail}</div></div>
    </button>
  );
}
