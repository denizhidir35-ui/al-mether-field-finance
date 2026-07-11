import { Bell, CalendarDays, Search } from "lucide-react";

export function DashboardHeader({ firstName }: { firstName: string }) {
  const date = new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <header className="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-400/75"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />Yönetim merkezi</div>
        <h1 className="mt-1 text-[22px] font-black tracking-[-0.04em] text-white sm:text-[28px]">Günaydın, {firstName}</h1>
        <div className="mt-1 flex items-center gap-1.5 text-[9px] capitalize text-slate-500"><CalendarDays size={11} />{date}</div>
      </div>
      <div className="flex w-full items-center gap-2 sm:max-w-[460px]">
        <label className="relative min-w-0 flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" /><input className="mether-input h-9 rounded-xl pl-9 pr-3 text-[10px]" placeholder="Mail, görev, ekip veya belge ara" /></label>
        <button type="button" aria-label="Bildirimler" className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-slate-400 transition hover:text-white"><Bell size={15} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-400" /></button>
      </div>
    </header>
  );
}
