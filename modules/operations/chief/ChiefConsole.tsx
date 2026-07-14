"use client";

import { useEffect, useMemo, useState } from "react";
import { Headphones, LogOut, MessageCircle, RadioTower, UsersRound } from "lucide-react";
import type { ChiefAccount } from "../domain/chief-account";
import type { OperationProject } from "../domain/operation-project";
import { useChiefAuth } from "../hooks/useChiefAuth";
import { useOperationWorkflow } from "../hooks/useOperationWorkflow";
import { useOperationsReadModel } from "../hooks/useOperationsReadModel";
import { findChiefProject } from "../project/project-assignment.service";
import { ChiefLogin } from "./ChiefLogin";
import { ChiefActionCard } from "./components/ChiefActionCard";
import { ChiefModuleCard } from "./components/ChiefModuleCard";

type ChiefModuleId = "personnel" | "deka" | "chat" | "support";

function AuthenticatedChiefConsole({ chief, project, onLogout, onExit }: { chief: ChiefAccount; project: OperationProject; onLogout: () => void; onExit?: () => void }) {
  const [activeModule, setActiveModule] = useState<ChiefModuleId | null>(null);
  const { state, step, advance, createChannelActivity } = useOperationWorkflow(project, chief);
  const projectProgress = project.progress;

  const actionContent = useMemo(() => {
    if (activeModule === "personnel") {
      const completed = state.completedSteps.includes("personnel");
      const available = state.currentStep === "personnel";
      return { title: "Personel Operasyonu", eyebrow: `${chief.personnelCode} · ${project.code}`, description: "QR altyapısı hazır. Bu sprintte ekip durumu event üzerinden doğrulanır; gerçek QR daha sonra aynı servis kontratına bağlanır.", actionLabel: available ? "Personeli Doğrula" : completed ? "Personel Doğrulandı" : "DEKA Adımı Bekleniyor", disabled: !available, action: advance };
    }
    if (activeModule === "deka") {
      const waitingForPersonnel = state.currentStep === "personnel";
      return { title: waitingForPersonnel ? "Personel Onayı" : step.label, eyebrow: `${project.code} · DEKA`, description: waitingForPersonnel ? "Saha akışının devam etmesi için Personel kartından ekip doğrulaması yapılmalı." : "Şef veri girmez. DK kontrolü, ilk fotoğraf ve zaman bilgisi sistem tarafından OperationEvent ile ilişkilendirilir.", actionLabel: waitingForPersonnel ? "Personel Onayı Bekleniyor" : step.label, disabled: waitingForPersonnel, action: advance };
    }
    if (activeModule === "chat") return { title: "Operasyon Sohbeti", eyebrow: `${project.code} · Ekip Kanalı`, description: "Metin, fotoğraf, konum, ses ve dosya için repository kontratı hazır. Bu sprintte kanal aktivitesi event akışına kaydedilir.", actionLabel: "Kanal Aktivitesi Oluştur", action: () => createChannelActivity("chat") };
    return { title: "Destek Merkezi", eyebrow: `${project.code} · Saha Desteği`, description: "Malzeme, araç, personel, müşteri ve iş akışı destekleri tek merkezde toplanır.", actionLabel: "Destek Kaydı Oluştur", action: () => createChannelActivity("support") };
  }, [activeModule, advance, chief.personnelCode, createChannelActivity, project.code, state.completedSteps, state.currentStep, step.label]);

  return (
    <div className="mx-auto flex h-full w-full max-w-[480px] min-h-0 flex-col px-2 py-1 sm:px-3">
      <header className="flex items-center justify-between rounded-[22px] border border-white/[0.06] bg-white/[0.025] px-3.5 py-3">
        <div><div className="text-[8px] font-black uppercase tracking-[0.16em] text-blue-400/70">{chief.personnelCode} · Chief</div><div className="mt-1 text-[13px] font-black text-white">{chief.displayName}</div></div>
        <div className="flex items-center gap-1"><button type="button" onClick={onLogout} aria-label="Chief oturumunu kapat" className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] text-slate-500"><LogOut size={14} /></button>{onExit ? <button type="button" onClick={onExit} className="h-9 rounded-xl border border-blue-400/10 bg-blue-500/[0.06] px-3 text-[8px] font-bold text-blue-300">CEO</button> : null}</div>
      </header>
      <section className="mt-2 rounded-[22px] border border-blue-400/10 bg-blue-500/[0.05] px-3.5 py-3"><div className="flex items-center justify-between"><div><div className="text-[9px] font-black text-white">{project.code}</div><div className="mt-0.5 text-[8px] text-slate-500">{project.name} · Ada {project.island}</div></div><div className="text-lg font-black text-blue-300">%{projectProgress}</div></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all" style={{ width: `${projectProgress}%` }} /></div></section>
      <div className="mt-2 min-h-0 flex-1">
        {activeModule ? <ChiefActionCard title={actionContent.title} eyebrow={actionContent.eyebrow} description={actionContent.description} actionLabel={actionContent.actionLabel} disabled={actionContent.disabled} complete={state.currentStep === "completed" && activeModule === "deka"} onAction={actionContent.action} onBack={() => setActiveModule(null)} /> : <section className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-2"><ChiefModuleCard title="Personel" detail={`${project.activePersonnelCount} aktif · Ekip durumu`} icon={UsersRound} onClick={() => setActiveModule("personnel")} /><ChiefModuleCard title="Deka" detail={state.currentStep === "personnel" ? "Personel onayı bekleniyor" : step.label} icon={RadioTower} active onClick={() => setActiveModule("deka")} /><ChiefModuleCard title="Chat" detail="Operasyona özel kanal" icon={MessageCircle} onClick={() => setActiveModule("chat")} /><ChiefModuleCard title="Destek" detail={`${project.supportCount} aktif kayıt`} icon={Headphones} onClick={() => setActiveModule("support")} /></section>}
      </div>
    </div>
  );
}

export function ChiefConsole({ onExit }: { onExit?: () => void }) {
  const auth = useChiefAuth();
  const readModel = useOperationsReadModel();
  useEffect(() => {
    document.body.dataset.chiefConsoleOpen = "true";
    return () => { delete document.body.dataset.chiefConsoleOpen; };
  }, []);
  if (!auth.chief) return <div className="fixed inset-0 z-[80] overflow-hidden bg-[#030816] py-3 sm:py-5"><ChiefLogin error={auth.error} onLogin={auth.login} onExit={onExit} /></div>;
  const project = findChiefProject(auth.chief, readModel.projects);
  return <div className="fixed inset-0 z-[80] overflow-hidden bg-[#030816] py-2 sm:py-4"><AuthenticatedChiefConsole chief={auth.chief} project={project} onLogout={auth.logout} onExit={onExit} /></div>;
}
