import { ShieldCheck, WalletCards } from "lucide-react";

export function FinanceHero() {
  return (
    <header className="mether-surface relative overflow-hidden rounded-[26px] p-5 sm:p-7">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400/80"><WalletCards size={14} /> Finance</div>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white sm:text-[38px]">Finans Merkezi</h1>
          <p className="mt-3 max-w-2xl text-xs leading-6 text-slate-400 sm:text-[13px]">
            AL METHER Finance; şirketinizin banka hesaplarını, nakit akışını, ödemelerini, tahsilatlarını, KDV süreçlerini ve yapay zekâ destekli finans analizlerini tek merkezden yönetmek üzere geliştirilmektedir.
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-xl border border-blue-400/15 bg-blue-500/[0.07] px-3 py-2 text-[10px] font-bold text-blue-300"><ShieldCheck size={14} /> Foundation Architecture</div>
      </div>
    </header>
  );
}
