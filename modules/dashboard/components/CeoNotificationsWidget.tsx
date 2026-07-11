import { ArrowUpRight, ShieldCheck } from "lucide-react";
import type { CeoNotification } from "../types";

const tones = { amber: "bg-amber-400", blue: "bg-blue-400", emerald: "bg-emerald-400" } as const;

export function CeoNotificationsWidget({ notifications }: { notifications: readonly CeoNotification[] }) {
  return <article className="mether-surface rounded-[18px] p-3.5"><header className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/10 text-blue-300"><ShieldCheck size={14} /></span><div><h2 className="text-[12px] font-bold text-white">CEO bildirimleri</h2><p className="text-[7px] text-slate-600">Karar ve onay merkezi</p></div></div><span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[7px] font-bold text-amber-300">2 onay</span></header><div className="mt-2.5 divide-y divide-white/[0.045]">{notifications.map(item => <button key={item.id} className="flex w-full items-center gap-2 py-2 text-left"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tones[item.tone]}`} /><div className="min-w-0 flex-1"><div className="truncate text-[9px] font-semibold text-slate-300">{item.title}</div><div className="mt-0.5 truncate text-[7px] text-slate-600">{item.detail}</div></div><ArrowUpRight size={10} className="text-slate-700" /></button>)}</div></article>;
}
