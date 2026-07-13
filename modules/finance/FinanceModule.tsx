import { BrainCircuit, CheckCircle2, Clock3, Landmark, Network, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import type { AppUser } from "@/types/auth";

type FinanceModuleProps = { user: AppUser };

const ROADMAP = [
  { label: "Finans Dashboard", ready: true },
  { label: "Banka Hesapları", ready: false },
  { label: "Banka Hareketleri", ready: false },
  { label: "Tahsilatlar", ready: false },
  { label: "Ödemeler", ready: false },
  { label: "KDV Yönetimi", ready: false },
  { label: "Nakit Akışı", ready: false },
  { label: "AI Finans Analizi", ready: false },
] as const;

const BANKS = ["İş Bankası", "Garanti BBVA", "Ziraat Bankası", "QNB", "VakıfBank"] as const;

const VISION_FEATURES = [
  "Banka API entegrasyonları",
  "AI destekli finans analizi",
  "Otomatik hareket sınıflandırma",
  "KDV önerileri",
  "Nakit akışı tahmini",
  "Finansal raporlama",
] as const;

export function FinanceModule({ user: _user }: FinanceModuleProps) {
  return (
    <div className="space-y-3.5">
      <header className="mether-surface relative overflow-hidden rounded-[26px] p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400/80">
              <WalletCards size={14} /> Finance
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white sm:text-[38px]">Finans Merkezi</h1>
            <p className="mt-3 max-w-2xl text-xs leading-6 text-slate-400 sm:text-[13px]">
              AL METHER Finance; şirketinizin banka hesaplarını, tahsilatlarını, ödemelerini ve nakit akışını tek merkezden yönetmek için geliştirilmektedir.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-xl border border-blue-400/15 bg-blue-500/[0.07] px-3 py-2 text-[10px] font-bold text-blue-300">
            <ShieldCheck size={14} /> Platform vizyon aşaması
          </div>
        </div>
      </header>

      <section className="grid gap-3.5 lg:grid-cols-[1fr_1fr] xl:grid-cols-[.9fr_1.1fr]">
        <article className="mether-surface rounded-[24px] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-400/70">Roadmap</div>
              <h2 className="mt-2 text-xl font-black tracking-[-0.025em] text-white">Yakında</h2>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.035] text-blue-300"><Sparkles size={17} /></div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {ROADMAP.map(item => (
              <div key={item.label} className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 ${item.ready ? "border-blue-400/20 bg-blue-500/[0.07]" : "border-white/[0.055] bg-white/[0.018]"}`}>
                {item.ready ? <CheckCircle2 size={15} className="shrink-0 text-blue-300" /> : <Clock3 size={14} className="shrink-0 text-slate-600" />}
                <span className={`text-[11px] font-bold ${item.ready ? "text-slate-200" : "text-slate-500"}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="mether-surface rounded-[24px] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-400/70">Banking Network</div>
              <h2 className="mt-2 text-xl font-black tracking-[-0.025em] text-white">İlk Entegrasyonlar</h2>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.035] text-blue-300"><Network size={17} /></div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {BANKS.map(bank => (
              <div key={bank} className="flex min-h-[54px] items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 transition hover:border-blue-400/15 hover:bg-blue-500/[0.035]">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-500/[0.08] text-blue-300"><Landmark size={15} /></div>
                <span className="text-[11px] font-bold text-slate-300">{bank}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-xl border border-white/[0.055] bg-black/10 px-3 py-3 text-[10px] leading-5 text-slate-500">
            İlk sürümde banka entegrasyonları canlı olarak desteklenecektir.
          </p>
        </article>
      </section>

      <article className="mether-surface overflow-hidden rounded-[24px]">
        <div className="grid lg:grid-cols-[.85fr_1.15fr]">
          <div className="border-b border-white/[0.06] p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-400/70"><BrainCircuit size={14} /> Platform Vision</div>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-white">AL METHER Finance</h2>
            <p className="mt-4 text-xs leading-6 text-slate-400">
              Finance; manuel veri girilen bir muhasebe ekranı değildir.
            </p>
            <p className="mt-3 text-xs leading-6 text-slate-500">
              Şirketinizin tüm banka hareketlerini, tahsilatlarını, ödemelerini ve finansal süreçlerini tek merkezden yönetmek üzere tasarlanmıştır.
            </p>
          </div>
          <div className="p-5 sm:p-7">
            <div className="text-[10px] font-bold text-slate-400">İlerleyen sürümlerde</div>
            <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {VISION_FEATURES.map(feature => (
                <div key={feature} className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-500">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400/60" />{feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>

      <footer className="rounded-[18px] border border-white/[0.06] bg-white/[0.018] px-4 py-3 text-center text-[9px] leading-5 text-slate-600 sm:px-6">
        Finance modülü, AL METHER Company Platform&apos;un son aşama modüllerinden biridir. Mevcut ekran platform vizyonunu temsil eder; banka entegrasyonları ve AI finans motoru tamamlandığında tam işlevsel hale gelecektir.
      </footer>
    </div>
  );
}
