import { Search, Send } from "lucide-react";

type DashboardHeaderProps = { firstName: string };

export function DashboardHeader({ firstName }: DashboardHeaderProps) {
  return (
    <section className="mether-surface rounded-[20px] px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-[9px] font-bold uppercase tracking-[0.17em] text-blue-400/70">Dashboard</div>
          <h1 className="mt-1 truncate text-xl font-black tracking-[-0.035em] text-white sm:text-[24px]">Günaydın, {firstName}.</h1>
        </div>
        <div className="flex w-full max-w-[680px] items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input className="mether-input h-9 rounded-xl pl-9 pr-3 text-[11px]" placeholder="Mail, görev, ekip veya iş ara..." />
          </div>
          <button type="button" aria-label="Ara" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500"><Send size={15} /></button>
        </div>
      </div>
    </section>
  );
}
