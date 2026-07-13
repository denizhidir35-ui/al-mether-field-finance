import type { AppUser } from "@/types/auth";
import { useFinanceFoundation } from "../hooks/useFinanceFoundation";
import { BankConnectionsCard } from "../components/BankConnectionsCard";
import { FinanceHero } from "../components/FinanceHero";
import { FinanceOverview } from "../components/FinanceOverview";
import { FinanceRoadmap } from "../components/FinanceRoadmap";
import { FinanceVisionCard } from "../components/FinanceVisionCard";

export function FinanceDashboard({ user: _user }: { user: AppUser }) {
  const foundation = useFinanceFoundation();
  return (
    <div className="finance-foundation grid gap-3.5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_minmax(0,1fr)_auto] xl:gap-2.5">
      <FinanceHero />
      <section className="grid gap-3.5 xl:min-h-0 xl:grid-cols-[.68fr_1.32fr] xl:gap-2.5">
        <div className="grid content-start gap-3.5 xl:min-h-0 xl:gap-2.5">
          <FinanceOverview />
          <FinanceVisionCard />
        </div>
        <div className="grid gap-3.5 lg:grid-cols-2 xl:min-h-0 xl:gap-2.5">
          <FinanceRoadmap />
          <BankConnectionsCard providers={foundation.providers} />
        </div>
      </section>
      <footer className="rounded-[18px] border border-white/[0.06] bg-white/[0.018] px-4 py-2 text-center text-[9px] leading-5 text-slate-600 sm:px-6">
        Finance modülü, AL METHER Company Platform&apos;un son aşama modüllerinden biridir. Banka entegrasyonları ve AI finans motoru tamamlandığında tam işlevsel hale gelecektir.
      </footer>
    </div>
  );
}
