import type { MapLegendItem } from "@/core/map/types";

const DOTS: Record<MapLegendItem["tone"], string> = {
  default: "bg-slate-500",
  active: "bg-blue-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400"
};

export function MapLegend({ items }: { items: readonly MapLegendItem[] }) {
  return <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 rounded-lg border border-white/[0.07] bg-[#07101f]/85 px-2.5 py-1.5 text-[7px] text-slate-500 backdrop-blur-xl">{items.map(item => <span key={item.id} className="flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${DOTS[item.tone]}`} />{item.label}</span>)}</div>;
}
