import { Bell, CalendarDays, Search } from "lucide-react";

export function DashboardHeader({ firstName }: { firstName: string }) {
  const date = new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <header className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.17em] text-blue-400/80"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />Yönetim merkezi</div>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-1"><h1 className="mether-page-title font-black">Günaydın, {firstName}</h1><span className="flex items-center gap-1.5 text-[10px] capitalize text-slate-500"><CalendarDays size={12} />{date}</span></div>
      </div>
      <div className="flex w-full items-center gap-2 sm:max-w-[460px]">
        <label className="relative min-w-0 flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" /><input className="mether-input h-10 rounded-xl pl-9 pr-3 text-[12px]" placeholder="Mail, görev, ekip veya belge ara" /></label>
        <button type="button" aria-label="Bildirimler" className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-slate-400 transition hover:text-white"><Bell size={16} /><span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-amber-400" /></button>
      </div>
    </header>
  );
}
