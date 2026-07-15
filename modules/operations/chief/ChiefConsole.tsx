"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Camera, LogOut, MapPin, MessageCircle, PackageCheck, RadioTower, UserRound, UsersRound } from "lucide-react";
import type { ChiefAccount } from "../domain/chief-account";
import type { OperationProject } from "../domain/operation-project";
import { useChiefAuth } from "../hooks/useChiefAuth";
import { useOperationWorkflow } from "../hooks/useOperationWorkflow";
import { useOperationsContext } from "../hooks/OperationsProvider";
import { findChiefProject } from "../project/project-assignment.service";
import { scanPersonnelQrImage } from "../services/qr.service";
import { buildChiefExperienceViewModel, type ChiefModuleId } from "./chief-experience.view-model";
import { ChiefLogin } from "./ChiefLogin";
import { ChiefActionCard } from "./components/ChiefActionCard";
import { ChiefBottomActionBar } from "./components/ChiefBottomActionBar";
import { ChiefModuleCard } from "./components/ChiefModuleCard";
import { ChiefMotivationCard } from "./components/ChiefMotivationCard";
import { ChiefOperationSummary } from "./components/ChiefOperationSummary";

const MODULE_ICONS = { personnel: UsersRound, deka: RadioTower, photo: Camera, location: MapPin, team: MessageCircle, problem: AlertTriangle, delivery: PackageCheck } as const;

function AuthenticatedChiefConsole({ chief, project, onLogout }: { chief: ChiefAccount; project: OperationProject; onLogout: () => void }) {
  const workflow = useOperationWorkflow(project, chief);
  const [activeModule, setActiveModule] = useState<ChiefModuleId | null>(workflow.state.currentStep === "personnel" ? "personnel" : null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { workOrder, state, step, advance, recordPersonnelAttendance, capturePhoto, captureLocation, confirmDelivery, createChannelActivity } = workflow;
  const viewModel = useMemo(() => buildChiefExperienceViewModel(chief, project, state, workOrder.personnelIds.length), [chief, project, state, workOrder.personnelIds.length]);

  const openModule = useCallback((module: ChiefModuleId) => {
    if (!activeModule) window.history.pushState({ chiefModule: module }, "");
    setActionError(null);
    setActiveModule(module);
  }, [activeModule]);

  const closeModule = useCallback(() => { if (activeModule) window.history.back(); }, [activeModule]);

  useEffect(() => {
    const handleBack = () => setActiveModule(null);
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, []);

  const actionContent = useMemo(() => {
    if (activeModule === "personnel") return { title: "Personel Mesaisi", eyebrow: `${workOrder.code} · Personel QR`, description: "Kalıcı personel QR kodunu kamerayla okut. Sistem aktif personele göre giriş veya çıkış kaydını canonical QR event'leriyle oluşturur.", actionLabel: "Personel QR Okut", disabled: workOrder.personnelIds.length === 0, fileCapture: { accept: "image/*", capture: "environment" as const, onFile: async (file: File) => { setActionError(null); try { recordPersonnelAttendance(await scanPersonnelQrImage(file)); } catch (cause) { setActionError(cause instanceof Error ? cause.message : "QR okunamadı."); } } } };
    if (activeModule === "deka") {
      const waitingForPersonnel = state.currentStep === "personnel";
      const available = state.currentStep === "project" || state.currentStep === "deka" || state.currentStep === "target";
      return { title: waitingForPersonnel ? "Personel Onayı" : step.label, eyebrow: `${workOrder.code} · DEKA`, description: waitingForPersonnel ? "Devam etmek için atanan ekipten en az bir personel QR okut." : state.currentStep === "deka" ? "DK doğrulamasını Engine'e kaydet; ardından Fotoğraf aksiyonuyla kanıtı tamamla." : "İş Emri, Target ve DEKA adımlarını mevcut workflow üzerinden ilerlet.", actionLabel: waitingForPersonnel ? "Personel QR Bekleniyor" : step.label, disabled: !available, action: advance };
    }
    if (activeModule === "photo") return { title: "Fotoğraf Kanıtı", eyebrow: `${workOrder.code} · Evidence`, description: "Kameradan alınan fotoğraf WorkOrder ile ilişkilendirilir ve PHOTO_CAPTURED event'i olarak Engine'e yazılır.", actionLabel: "Fotoğraf Çek", disabled: state.currentStep !== "deka" && state.currentStep !== "photo", fileCapture: { accept: "image/*", capture: "environment" as const, onFile: (file: File) => { setActionError(null); capturePhoto(file); } } };
    if (activeModule === "location") return { title: "GPS Konumu", eyebrow: `${workOrder.code} · Location`, description: "Cihazın gerçek konumu WorkOrder evidence kaydına eklenir.", actionLabel: "GPS Konumunu Al", action: async () => { setActionError(null); try { await captureLocation(); } catch (cause) { setActionError(cause instanceof Error ? cause.message : "GPS alınamadı."); } } };
    if (activeModule === "team") return { title: "Takım Kanalı", eyebrow: `${workOrder.code} · AL METHER Chat`, description: "Mevcut Chat aktivitesi CHAT_MESSAGE event'i üzerinden operasyona bağlanır.", actionLabel: "Takım Aktivitesi Oluştur", action: () => createChannelActivity("chat") };
    if (activeModule === "problem") return { title: "Problem Bildir", eyebrow: `${workOrder.code} · Saha Problemi`, description: "Problem PROBLEM_REPORTED event'i olarak merkeze iletilir.", actionLabel: "Yeni Problem Oluştur", action: () => createChannelActivity("support") };
    return { title: "Teslim", eyebrow: `${workOrder.code} · Target Teslimi`, description: "Target ve son fotoğraf tamamlandığında teslim Engine üzerinden doğrulanır.", actionLabel: state.currentStep === "delivery" ? "Teslimi Onayla" : "Teslim Adımı Bekleniyor", disabled: state.currentStep !== "delivery", action: confirmDelivery };
  }, [activeModule, advance, captureLocation, capturePhoto, confirmDelivery, createChannelActivity, recordPersonnelAttendance, state.currentStep, step.label, workOrder]);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[480px] flex-col px-2 pb-[78px] pt-1 sm:px-3">
      <header className="flex shrink-0 items-center justify-between rounded-[22px] border border-white/[0.06] bg-white/[0.025] px-3.5 py-2.5"><div><div className="text-[8px] font-black uppercase tracking-[0.17em] text-blue-400/75">{viewModel.identity.platformLabel}</div><div className="mt-1 text-[13px] font-black text-white">{viewModel.identity.displayName}</div><div className="mt-0.5 text-[8px] font-bold tracking-[0.08em] text-slate-500">{viewModel.identity.personnelCode} · {workOrder.code}</div></div><div className="flex items-center gap-1.5"><button type="button" aria-label="Profil" title="Profil" className="grid h-9 w-9 place-items-center rounded-xl border border-blue-400/10 bg-blue-500/[0.06] text-blue-300"><UserRound size={15} /></button><button type="button" onClick={onLogout} aria-label="Çıkış" title="Çıkış" className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] text-slate-500"><LogOut size={14} /></button></div></header>
      <div className="mt-2 shrink-0"><ChiefOperationSummary {...viewModel.operation} currentAction={viewModel.currentAction} /></div>
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {activeModule ? <ChiefActionCard title={actionContent.title} eyebrow={actionContent.eyebrow} description={actionContent.description} actionLabel={actionContent.actionLabel} disabled={actionContent.disabled} error={actionError} fileCapture={"fileCapture" in actionContent ? actionContent.fileCapture : undefined} complete={state.currentStep === "completed" && activeModule === "delivery"} onAction={"action" in actionContent ? actionContent.action : undefined} onBack={closeModule} /> : <div className="flex min-h-[302px] flex-col justify-end gap-2"><section className="grid grid-cols-2 gap-2">{viewModel.modules.map(module => <ChiefModuleCard key={module.id} title={module.title} metrics={module.metrics} icon={MODULE_ICONS[module.id]} tone={module.tone} onClick={() => openModule(module.id)} />)}</section><ChiefMotivationCard {...viewModel.motivation} /></div>}
      </div>
      <ChiefBottomActionBar activeModule={activeModule} onSelect={openModule} />
    </div>
  );
}

export function ChiefConsole({ onExit }: { onExit?: () => void }) {
  const auth = useChiefAuth();
  const { hydrated, readModel } = useOperationsContext();
  useEffect(() => { document.body.dataset.chiefConsoleOpen = "true"; return () => { delete document.body.dataset.chiefConsoleOpen; }; }, []);
  if (!auth.chief) return <div className="fixed inset-0 z-[80] overflow-hidden bg-[#030816] py-3 sm:py-5"><ChiefLogin error={auth.error} onLogin={auth.login} onDevelopmentLogin={auth.loginDevelopment} onExit={onExit} /></div>;
  const workOrder = readModel.workOrders.find(candidate => candidate.chiefId === auth.chief!.id && (candidate.status === "assigned" || candidate.status === "active"));
  if (!hydrated || (!workOrder && auth.chief.assignedProjectCodes.length > 0)) return <div className="fixed inset-0 z-[80] grid place-items-center bg-[#030816] p-5"><div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">Operasyon y\u00fckleniyor</div></div>;
  if (!workOrder) return <div className="fixed inset-0 z-[80] grid place-items-center bg-[#030816] p-5"><div className="max-w-sm rounded-[28px] border border-blue-300/15 bg-blue-400/[0.04] p-6 text-center"><h2 className="text-lg font-black text-white">Bugün İçin Atanmış İş Emri Yok</h2><p className="mt-2 text-[11px] leading-5 text-slate-500">Yeni bir görev atandığında operasyon burada otomatik görünecek. Şimdilik dinlenebilirsin.</p><button type="button" onClick={auth.logout} className="mt-5 h-11 rounded-xl bg-blue-600 px-5 text-[10px] font-black text-white">Girişe Dön</button></div></div>;
  const project = findChiefProject(auth.chief, readModel.projects.filter(candidate => candidate.code === workOrder.projectCode));
  return <div className="fixed inset-0 z-[80] overflow-hidden bg-[#030816] pb-[env(safe-area-inset-bottom)] pt-[max(.5rem,env(safe-area-inset-top))] sm:py-3"><AuthenticatedChiefConsole chief={auth.chief} project={project} onLogout={auth.logout} /></div>;
}
