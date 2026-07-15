import { AlertTriangle, Camera, MapPin, MessageCircle, PackageCheck, RadioTower, UsersRound, type LucideIcon } from "lucide-react";
import type { ChiefModuleId } from "../chief-experience.view-model";

const ACTIONS: readonly { id: ChiefModuleId; label: string; icon: LucideIcon }[] = [
  { id: "personnel", label: "Personel", icon: UsersRound },
  { id: "deka", label: "DEKA", icon: RadioTower },
  { id: "photo", label: "Foto", icon: Camera },
  { id: "location", label: "GPS", icon: MapPin },
  { id: "team", label: "Takım", icon: MessageCircle },
  { id: "problem", label: "Problem", icon: AlertTriangle },
  { id: "delivery", label: "Teslim", icon: PackageCheck }
];

export function ChiefBottomActionBar({ activeModule, onSelect }: { activeModule: ChiefModuleId | null; onSelect: (module: ChiefModuleId) => void }) {
  return (
    <nav aria-label="Şef hızlı aksiyonları" className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-20 mx-auto grid h-[66px] max-w-[456px] grid-cols-7 rounded-[22px] border border-white/[0.08] bg-[#091224]/95 px-1 shadow-[0_20px_55px_rgba(0,0,0,.48)] backdrop-blur-xl">
      {ACTIONS.map(({ id, label, icon: Icon }) => { const active = activeModule === id; return <button key={id} type="button" onClick={() => onSelect(id)} aria-pressed={active} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[17px] text-[8px] font-bold transition active:scale-95 ${active ? "bg-blue-500/15 text-blue-300" : "text-slate-500"}`}><Icon size={18} /><span>{label}</span></button>; })}
    </nav>
  );
}
