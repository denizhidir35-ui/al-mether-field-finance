import { CheckCircle2, Clock3, Sparkles } from "lucide-react";
import { FinanceComingSoonCard } from "./FinanceComingSoonCard";

const ITEMS = ["Dashboard", "Banka Bağlantıları", "Hesaplar", "Hareketler", "Tahsilatlar", "Ödemeler", "KDV", "Cash Flow", "AI Finance Engine", "Finansal Raporlar"] as const;

export function FinanceRoadmap() {
  return (
    <FinanceComingSoonCard eyebrow="Foundation Roadmap" title="Roadmap" icon={Sparkles}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {ITEMS.map((label, index) => <div key={label} className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 ${index === 0 ? "border-blue-400/20 bg-blue-500/[0.07]" : "border-white/[0.055] bg-white/[0.018]"}`}>{index === 0 ? <CheckCircle2 size={15} className="shrink-0 text-blue-300" /> : <Clock3 size={14} className="shrink-0 text-slate-600" />}<span className={`text-[11px] font-bold ${index === 0 ? "text-slate-200" : "text-slate-500"}`}>{label}</span></div>)}
      </div>
    </FinanceComingSoonCard>
  );
}
