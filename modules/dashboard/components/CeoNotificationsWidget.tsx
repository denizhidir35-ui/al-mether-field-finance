import { ArrowUpRight, ShieldCheck } from "lucide-react";
import type { CeoNotification } from "../types";

const tones = { amber: "bg-amber-400", blue: "bg-blue-400", emerald: "bg-emerald-400" } as const;

export function CeoNotificationsWidget({ notifications }: { notifications: readonly CeoNotification[] }) {
  return <article className="mether-surface rounded-[18px] p-3.5"><header className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10 text-blue-300"><ShieldCheck size={15} /></span><div><h2 className="text-[14px] font-bold text-white">CEO bildirimleri</h2><p className="text-[9px] text-slate-500">Karar ve onay merkezi</p></div></div><span className="rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-300">2 onay</span></header><div className="mt-2 divide-y divide-white/[0.045]">{notifications.slice(0, 2).map(item => <button key={item.id} className="flex w-full items-center gap-2 py-2.5 text-left"><span className={`h-2 w-2 shrink-0 rounded-full ${tones[item.tone]}`} /><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-semibold text-slate-300">{item.title}</div><div className="mt-0.5 truncate text-[9px] text-slate-500">{item.detail}</div></div><ArrowUpRight size={11} className="text-slate-600" /></button>)}</div>{notifications.length > 2 ? <div className="mt-1 text-center text-[10px] font-semibold text-blue-400">+{notifications.length - 2} bildirim daha</div> : null}</article>;
}
