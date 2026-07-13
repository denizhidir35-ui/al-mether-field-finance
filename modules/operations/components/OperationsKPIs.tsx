import { Building2, CheckCircle2, FolderKanban, Route, UserRoundCheck, UsersRound } from "lucide-react";
import type { OperationsKPI } from "../types";

const ICONS = [FolderKanban, UserRoundCheck, UsersRound, CheckCircle2, Building2, Route] as const;

export function OperationsKPIs({ items }: { items: readonly OperationsKPI[] }) {
  return (
    <section className="grid grid-cols-3 gap-1.5 xl:grid-cols-6 xl:gap-2.5">
      {items.map((item, index) => {
        const Icon = ICONS[index];
        return (
          <article key={item.label} className="rounded-[14px] border border-white/[0.065] bg-white/[0.022] px-2 py-1.5 xl:rounded-[18px] xl:px-3.5 xl:py-3">
            <div className="flex items-center justify-between gap-1"><span className="line-clamp-1 text-[7px] font-bold uppercase tracking-[0.08em] text-slate-500 xl:text-[8px] xl:tracking-[0.12em]">{item.label}</span><Icon size={12} className="shrink-0 text-blue-400/65 xl:h-[14px] xl:w-[14px]" /></div>
            <div className="mt-1 text-base font-black leading-none tracking-[-0.04em] text-slate-100 xl:mt-2 xl:text-xl">{item.value}</div>
            <div className="mt-0.5 hidden truncate text-[8px] text-slate-600 sm:block">{item.detail}</div>
          </article>
        );
      })}
    </section>
  );
}
