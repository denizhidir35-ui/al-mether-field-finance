import { UsersRound } from "lucide-react";
import type { ModuleId } from "@/core/navigation/navigation.types";
import type { FieldTeam } from "../types";

type FieldTeamsWidgetProps = { teams: readonly FieldTeam[]; onNavigate: (module: ModuleId) => void };

export function FieldTeamsWidget({ teams, onNavigate }: FieldTeamsWidgetProps) {
  return (
    <article className="mether-surface rounded-[20px] p-3 sm:p-4">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><UsersRound size={15} className="text-blue-400" /><h2 className="text-sm font-bold text-white">Saha Ekipleri</h2></div><button type="button" onClick={() => onNavigate("operations")} className="text-[9px] font-bold text-blue-400">Ekip yönetimi</button></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {teams.map(team => <div key={team.name} className="rounded-xl border border-white/[0.06] bg-white/[0.018] p-3"><div className="flex items-start justify-between gap-2"><div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/10 text-[9px] font-black text-blue-300">{team.name.split(" ").map(part => part.charAt(0)).join("")}</div><span className="rounded-full bg-emerald-500/[0.08] px-2 py-0.5 text-[7px] font-bold text-emerald-400">{team.status}</span></div><div className="mt-3 text-[11px] font-bold text-slate-200">{team.name}</div><div className="mt-0.5 text-[8px] text-slate-600">Şef: {team.lead}</div><div className="mt-3 flex items-center justify-between text-[8px] text-slate-500"><span>{team.people} personel</span><span>{team.activeJobs} aktif iş</span></div></div>)}
      </div>
    </article>
  );
}
