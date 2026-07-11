import type { ReactNode } from "react";

type MetricProps = {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  tone?: "default" | "positive" | "negative" | "warning";
  emphasis?: boolean;
};

const TONES = {
  default: "text-slate-100",
  positive: "text-emerald-400",
  negative: "text-rose-400",
  warning: "text-amber-300"
};

export function Metric({
  label,
  value,
  detail,
  icon,
  tone = "default",
  emphasis = false
}: MetricProps) {
  return (
    <article
      className={`mether-surface flex min-h-[92px] flex-col justify-between rounded-2xl p-4 ${
        emphasis ? "sm:col-span-2 xl:col-span-1" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </span>
        <span className="text-slate-500">{icon}</span>
      </div>

      <div className="mt-4">
        <div
          className={`font-black tracking-[-0.04em] ${
            emphasis ? "text-[28px]" : "text-[23px]"
          } ${TONES[tone]}`}
        >
          {value}
        </div>

        {detail ? (
          <div className="mt-1 text-[10px] text-slate-600">{detail}</div>
        ) : null}
      </div>
    </article>
  );
}