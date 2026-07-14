"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, LogOut, MessageCircle, RadioTower, UserRound, UsersRound } from "lucide-react";
import type { ChiefAccount } from "../domain/chief-account";
import type { OperationProject } from "../domain/operation-project";
import { useChiefAuth } from "../hooks/useChiefAuth";
import { useOperationWorkflow } from "../hooks/useOperationWorkflow";
import { useOperationsReadModel } from "../hooks/useOperationsReadModel";
import { findChiefProject } from "../project/project-assignment.service";
import { buildChiefExperienceViewModel, type ChiefModuleId } from "./chief-experience.view-model";
import { ChiefLogin } from "./ChiefLogin";
import { ChiefActionCard } from "./components/ChiefActionCard";
import { ChiefBottomActionBar } from "./components/ChiefBottomActionBar";
import { ChiefModuleCard } from "./components/ChiefModuleCard";
import { ChiefMotivationCard } from "./components/ChiefMotivationCard";
import { ChiefOperationSummary } from "./components/ChiefOperationSummary";

const MODULE_ICONS = { personnel: UsersRound, deka: RadioTower, team: MessageCircle, problem: AlertTriangle } as const;

function AuthenticatedChiefConsole({ chief, project, onLogout }: { chief: ChiefAccount; project: OperationProject; onLogout: () => void }) {
  const [activeModule, setActiveModule] = useState<ChiefModuleId | null>(null);
  const { state, step, advance, createChannelActivity } = useOperationWorkflow(project, chief);
  const viewModel = useMemo(() => buildChiefExperienceViewModel(chief, project, state), [chief, project, state]);

  const openModule = useCallback((module: ChiefModuleId) => {
    if (!activeModule) window.history.pushState({ chiefModule: module }, "");
    setActiveModule(module);
  }, [activeModule]);

  const closeModule = useCallback(() => {
    if (activeModule) window.history.back();
  }, [activeModule]);

  useEffect(() => {
    const handleBack = () => setActiveModule(null);
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, []);

  const actionContent = useMemo(() => {
    if (activeModule === "personnel") {
      const completed = state.completedSteps.includes("personnel");
      const available = state.currentStep === "personnel";
      return { title: "Personel Operasyonu", eyebrow: `${chief.personnelCode} · ${project.code}`, description: "Ekip durumunu doğrula. QR servisi gerçek entegrasyon için hazır.", actionLabel: available ? "Personeli Doğrula" : completed ? "Personel Doğrulandı" : "DEKA Adımı Bekleniyor", disabled: !available, action: advance };
    }
    if (activeModule === "deka") {
      const waitingForPersonnel = state.currentStep === "personnel";
      return { title: waitingForPersonnel ? "Personel Onayı" : step.label, eyebrow: `${project.code} · DEKA`, description: waitingForPersonnel ? "Devam etmek için önce ekip doğrulamasını tamamla." : "DK kontrolü, fotoğraf ve zaman bilgisi sistem tarafından kaydedilecek.", actionLabel: waitingForPersonnel ? "Personel Onayı Bekleniyor" : step.label, disabled: waitingForPersonnel, action: advance };
    }
    if (activeModule === "team") return { title: "Takım Kanalı", eyebrow: `${project.code} · Ekip İletişimi`, description: "Operasyona ait son mesajları kontrol et ve saha ekibiyle iletişimi sürdür.", actionLabel: "Takım Kanalını Aç", action: () => createChannelActivity("chat") };
    return { title: "Problem Bildir", eyebrow: `${project.code} · Saha Problemi`, description: "Operasyonu etkileyen problemi tek dokunuşla merkeze ilet.", actionLabel: "Yeni Problem Oluştur", action: () => createChannelActivity("support") };
  }, [activeModule, advance, chief.personnelCode, createChannelActivity, project.code, state.completedSteps, state.currentStep, step.label]);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[480px] flex-col px-2 pb-[78px] pt-1 sm:px-3">
      <header className="flex shrink-0 items-center justify-between rounded-[22px] border border-white/[0.06] bg-white/[0.025] px-3.5 py-2.5">
        <div><div className="text-[8px] font-black uppercase tracking-[0.17em] text-blue-400/75">{viewModel.identity.platformLabel}</div><div className="mt-1 text-[13px] font-black text-white">{viewModel.identity.displayName}</div><div className="mt-0.5 text-[8px] font-bold tracking-[0.08em] text-slate-500">{viewModel.identity.personnelCode}</div></div>
        <div className="flex items-center gap-1.5"><button type="button" aria-label="Profil" title="Profil" className="grid h-9 w-9 place-items-center rounded-xl border border-blue-400/10 bg-blue-500/[0.06] text-blue-300"><UserRound size={15} /></button><button type="button" onClick={onLogout} aria-label="Çıkış" title="Çıkış" className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] text-slate-500 transition hover:text-white"><LogOut size={14} /></button></div>
      </header>
      <div className="mt-2 shrink-0"><ChiefOperationSummary {...viewModel.operation} currentAction={viewModel.currentAction} /></div>
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {activeModule ? (
          <ChiefActionCard title={actionContent.title} eyebrow={actionContent.eyebrow} description={actionContent.description} actionLabel={actionContent.actionLabel} disabled={actionContent.disabled} complete={state.currentStep === "completed" && activeModule === "deka"} onAction={actionContent.action} onBack={closeModule} />
        ) : (
          <div className="flex h-full min-h-[302px] flex-col justify-end gap-2"><section className="grid grid-cols-2 gap-2">{viewModel.modules.map(module => <ChiefModuleCard key={module.id} title={module.title} metrics={module.metrics} icon={MODULE_ICONS[module.id]} tone={module.tone} onClick={() => openModule(module.id)} />)}</section><ChiefMotivationCard {...viewModel.motivation} /></div>
        )}
      </div>
      <ChiefBottomActionBar activeModule={activeModule} onSelect={openModule} />
    </div>
  );
}

export function ChiefConsole({ onExit: _onExit }: { onExit?: () => void }) {
  const auth = useChiefAuth();
  const readModel = useOperationsReadModel();
  useEffect(() => {
    document.body.dataset.chiefConsoleOpen = "true";
    return () => { delete document.body.dataset.chiefConsoleOpen; };
  }, []);
  if (!auth.chief) return <div className="fixed inset-0 z-[80] overflow-hidden bg-[#030816] py-3 sm:py-5"><ChiefLogin error={auth.error} onLogin={auth.login} /></div>;
  const project = findChiefProject(auth.chief, readModel.projects);
  return <div className="fixed inset-0 z-[80] overflow-hidden bg-[#030816] pb-[env(safe-area-inset-bottom)] pt-[max(.5rem,env(safe-area-inset-top))] sm:py-3"><AuthenticatedChiefConsole chief={auth.chief} project={project} onLogout={auth.logout} /></div>;
}
