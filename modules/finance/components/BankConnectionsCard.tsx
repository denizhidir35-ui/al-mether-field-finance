import { Landmark, Network } from "lucide-react";
import type { BankProviderDefinition } from "../banks/bank-engine";
import { FinanceComingSoonCard } from "./FinanceComingSoonCard";

export function BankConnectionsCard({ providers }: { providers: readonly BankProviderDefinition[] }) {
  return (
    <FinanceComingSoonCard eyebrow="Secure Banking Architecture" title="Bank Integration Layer" icon={Network} footer={<p className="rounded-xl border border-white/[0.055] bg-black/10 px-3 py-3 text-[10px] leading-5 text-slate-500 xl:py-2">Banka bağlantıları ilerleyen sürümlerde güvenli API katmanı üzerinden aktif edilecektir.</p>}>
      <div className="grid gap-2 sm:grid-cols-2">
        {providers.map(bank => <div key={bank.code} className="flex min-h-[52px] items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 xl:min-h-10"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-500/[0.08] text-blue-300 xl:h-7 xl:w-7"><Landmark size={15} /></div><span className="text-[11px] font-bold text-slate-300">{bank.name}</span></div>)}
      </div>
    </FinanceComingSoonCard>
  );
}
