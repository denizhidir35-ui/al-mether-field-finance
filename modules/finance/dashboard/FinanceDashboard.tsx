import type { AppUser } from "@/types/auth";
import { useFinanceFoundation } from "../hooks/useFinanceFoundation";
import { BankConnectionsCard } from "../components/BankConnectionsCard";
import { FinanceHero } from "../components/FinanceHero";
import { FinanceOverview } from "../components/FinanceOverview";
import { FinanceRoadmap } from "../components/FinanceRoadmap";
import { FinanceVisionCard } from "../components/FinanceVisionCard";

export function FinanceDashboard({ user: _user }: { user: AppUser }) {
  const foundation = useFinanceFoundation();
  return <div className="space-y-3.5"><FinanceHero /><FinanceOverview /><section className="grid gap-3.5 lg:grid-cols-[1fr_1fr] xl:grid-cols-[.9fr_1.1fr]"><FinanceRoadmap /><BankConnectionsCard providers={foundation.providers} /></section><FinanceVisionCard /><footer className="rounded-[18px] border border-white/[0.06] bg-white/[0.018] px-4 py-3 text-center text-[9px] leading-5 text-slate-600 sm:px-6">Finance modülü, AL METHER Company Platform&apos;un son aşama modüllerinden biridir. Banka entegrasyonları ve AI finans motoru tamamlandığında tam işlevsel hale gelecektir.</footer></div>;
}
