import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type FinanceComingSoonCardProps = {
  eyebrow: string;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
};

export function FinanceComingSoonCard({ eyebrow, title, icon: Icon, children, footer }: FinanceComingSoonCardProps) {
  return (
    <article className="mether-surface h-full rounded-[24px] p-5 sm:p-6 xl:p-4">
      <div className="flex items-start justify-between gap-4">
        <div><div className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-400/70">{eyebrow}</div><h2 className="mt-2 text-xl font-black tracking-[-0.025em] text-white">{title}</h2></div>
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.035] text-blue-300"><Icon size={17} /></div>
      </div>
      <div className="mt-5 xl:mt-3 2xl:mt-4">{children}</div>
      {footer ? <div className="mt-4 xl:mt-3">{footer}</div> : null}
    </article>
  );
}
