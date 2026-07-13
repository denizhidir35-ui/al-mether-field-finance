import type { LucideIcon } from "lucide-react";

export function FinanceEmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return <div className="rounded-[18px] border border-dashed border-white/[0.08] bg-black/10 p-4"><Icon size={16} className="text-blue-300/70" /><div className="mt-3 text-[11px] font-bold text-slate-300">{title}</div><p className="mt-1 text-[9px] leading-5 text-slate-600">{description}</p></div>;
}
