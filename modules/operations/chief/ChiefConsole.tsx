"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, LogOut, UsersRound } from "lucide-react";
import type { ChiefAccount } from "../domain/chief-account";
import type { OperationProject } from "../domain/operation-project";
import type { PersonnelRecord } from "../domain/personnel-record";
import type { WorkOrder } from "../domain/work-order";
import { useChiefAuth } from "../hooks/useChiefAuth";
import { useOperationWorkflow } from "../hooks/useOperationWorkflow";
import { useOperationsContext } from "../hooks/OperationsProvider";
import { scanPersonnelQrImage } from "../services/qr.service";
import { ChiefLogin } from "./ChiefLogin";
import type { ChiefModuleId } from "./chief-experience.view-model";
import { ChiefActionCard } from "./components/ChiefActionCard";
import { ChiefBottomActionBar } from "./components/ChiefBottomActionBar";

function SelectedOperation({ chief, workOrder, project, workOrders, personnelRecords, onSelectWorkOrder, onLogout }: {
  chief: ChiefAccount;
  workOrder: WorkOrder;
  project: OperationProject;
  workOrders: readonly WorkOrder[];
  personnelRecords: readonly PersonnelRecord[];
  onSelectWorkOrder: (id: WorkOrder["id"]) => void;
  onLogout: () => void;
}) {
  const workflow = useOperationWorkflow(project, chief);
  const [activeModule, setActiveModule] = useState<ChiefModuleId | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState("");
  const { state, step, advance, recordPersonnelAttendance, capturePhoto, captureLocation, confirmDelivery, createChannelActivity } = workflow;
  const assignedPersonnel = useMemo(() => personnelRecords.filter(person =>
    workOrder.personnelIds.includes(person.personnelCode) && person.assignedChiefCode === chief.id,
  ), [chief.id, personnelRecords, workOrder.personnelIds]);

  useEffect(() => {
    setActiveModule(null);
    setActionError(null);
    setFieldValue("");
  }, [workOrder.id]);

  useEffect(() => { setFieldValue(""); }, [state.currentStep]);

  const actionContent = useMemo(() => {
    if (activeModule === "personnel") return { title: "Personel Mesaisi", eyebrow: `${workOrder.code} · Personel QR`, description: "Yalnızca bu Şefe ve seçili İş Emrine atanmış personel QR kodları kabul edilir.", actionLabel: "Personel QR Okut", disabled: workOrder.personnelIds.length === 0, fileCapture: { accept: "image/*", capture: "environment" as const, onFile: async (file: File) => { setActionError(null); try { recordPersonnelAttendance(await scanPersonnelQrImage(file)); } catch (cause) { setActionError(cause instanceof Error ? cause.message : "QR okunamadı."); } } } };
    const photoSteps = ["deka_photos", "street_photos", "building_photos"] as const;
    const isPhotoStep = photoSteps.some(candidate => candidate === state.currentStep);
    const photoCount = state.evidence.filter(evidence => evidence.stepId === state.currentStep && evidence.type === "photo").length;
    const requiredPhotos = state.currentStep === "street_photos" ? 4 : 1;
    const photoAction = { title: step.label, eyebrow: `${workOrder.code} · Fotoğraf Akışı`, description: `${photoCount} / ${requiredPhotos} fotoğraf kaydedildi. Fotoğraf doğrudan seçili İş Emrine bağlanır.`, actionLabel: photoCount + 1 >= requiredPhotos ? "Son Fotoğrafı Çek" : `Fotoğraf Çek · ${photoCount + 1}/${requiredPhotos}`, fileCapture: { accept: "image/*", capture: "environment" as const, onFile: (file: File) => { setActionError(null); capturePhoto(file); } } };
    if (activeModule === "deka") {
      if (state.currentStep === "personnel") return { title: "Personel Onayı", eyebrow: `${workOrder.code} · DEKA`, description: "DEKA fotoğraflarına başlamadan önce atanan ekipten bir personel QR okut.", actionLabel: "Personel QR Bekleniyor", disabled: true, action: () => undefined };
      if (isPhotoStep) return photoAction;
      if (state.currentStep === "parcel") return { title: "Ada / Parsel", eyebrow: `${workOrder.code} · Saha Konumu`, description: "Sahada doğrulanan Ada ve Parsel bilgisini kaydet.", actionLabel: "Ada / Parseli Kaydet", disabled: !fieldValue.trim(), textEntry: { label: "Ada / Parsel", placeholder: "Örn. Ada 85 / Parsel 12", value: fieldValue, onChange: setFieldValue }, action: () => advance(fieldValue) };
      if (state.currentStep === "street") return { title: "Sokak Seçimi", eyebrow: `${workOrder.code} · Saha Konumu`, description: "Fotoğraflanacak sokağın adını kaydet.", actionLabel: "Sokağı Kaydet", disabled: !fieldValue.trim(), textEntry: { label: "Sokak", placeholder: "Örn. 1720 Sokak", value: fieldValue, onChange: setFieldValue }, action: () => advance(fieldValue) };
      if (state.currentStep === "buildings") return { title: "Binalar", eyebrow: `${workOrder.code} · Saha Yapıları`, description: "Sahada tespit edilen bina numaralarını virgülle ayırarak kaydet.", actionLabel: "Binaları Kaydet", disabled: !fieldValue.trim(), textEntry: { label: "Bina Numaraları", placeholder: "Örn. 12, 14, 16", value: fieldValue, onChange: setFieldValue }, action: () => advance(fieldValue) };
      return { title: step.label, eyebrow: `${workOrder.code} · DEKA`, description: "Fotoğraf tabanlı saha akışının sıradaki adımı.", actionLabel: step.label, disabled: true, action: () => undefined };
    }
    if (activeModule === "photo") return isPhotoStep ? photoAction : { title: "Fotoğraf", eyebrow: `${workOrder.code} · Evidence`, description: `Sıradaki fotoğraf aşaması: ${step.label}.`, actionLabel: "Fotoğraf Aşaması Bekleniyor", disabled: true, action: () => undefined };
    if (activeModule === "location") return { title: "GPS Konumu", eyebrow: `${workOrder.code} · Location`, description: "Cihazın gerçek konumu seçili İş Emrine eklenir.", actionLabel: "GPS Konumunu Al", action: async () => { setActionError(null); try { await captureLocation(); } catch (cause) { setActionError(cause instanceof Error ? cause.message : "GPS alınamadı."); } } };
    if (activeModule === "team") return { title: "Takım Kanalı", eyebrow: `${workOrder.code} · AL METHER Chat`, description: "Takım aktivitesi mevcut Operation Engine akışına kaydedilir.", actionLabel: "Takım Aktivitesi Oluştur", action: () => createChannelActivity("chat") };
    if (activeModule === "problem") return { title: "Problem Bildir", eyebrow: `${workOrder.code} · Saha Problemi`, description: "Problem seçili İş Emrine bağlanarak merkeze iletilir.", actionLabel: "Yeni Problem Oluştur", action: () => createChannelActivity("support") };
    return { title: "Teslim", eyebrow: `${workOrder.code} · Saha Kaydı`, description: "Bina kayıtları ve bina fotoğrafları tamamlandığında saha kaydını onayla.", actionLabel: state.currentStep === "delivery" ? "Saha Kaydını Tamamla" : "Teslim Adımı Bekleniyor", disabled: state.currentStep !== "delivery", action: confirmDelivery };
  }, [activeModule, advance, captureLocation, capturePhoto, confirmDelivery, createChannelActivity, fieldValue, recordPersonnelAttendance, state.currentStep, state.evidence, step.label, workOrder]);

  return <div className="mx-auto flex h-full min-h-0 w-full max-w-[560px] flex-col px-3 pb-[84px] pt-2">
    <header className="flex shrink-0 items-center justify-between rounded-[22px] border border-white/[0.06] bg-white/[0.025] px-4 py-3">
      <div><div className="text-[8px] font-black uppercase tracking-[0.18em] text-blue-400">AL METHER Chief</div><div className="mt-1 text-[14px] font-black text-white">{chief.displayName}</div><div className="mt-0.5 text-[9px] font-bold text-slate-500">{chief.personnelCode} · {workOrder.code}</div></div>
      <button type="button" onClick={onLogout} aria-label="Çıkış" className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] text-slate-500"><LogOut size={16} /></button>
    </header>

    <main className="mether-scroll mt-3 min-h-0 flex-1 overflow-y-auto pb-2">
      {activeModule ? <ChiefActionCard title={actionContent.title} eyebrow={actionContent.eyebrow} description={actionContent.description} actionLabel={actionContent.actionLabel} disabled={"disabled" in actionContent ? actionContent.disabled : false} error={actionError} fileCapture={"fileCapture" in actionContent ? actionContent.fileCapture : undefined} textEntry={"textEntry" in actionContent ? actionContent.textEntry : undefined} complete={state.currentStep === "completed" && activeModule === "delivery"} onAction={"action" in actionContent ? actionContent.action : undefined} onBack={() => setActiveModule(null)} /> : <div className="space-y-3">
        <section className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-blue-300"><ClipboardList size={16} /> Atanmış İş Emirleri · {workOrders.length}</div>
          <div className="mt-3 space-y-2">{workOrders.map(candidate => <button key={candidate.id} type="button" onClick={() => onSelectWorkOrder(candidate.id)} className={`w-full rounded-2xl border p-3 text-left ${workOrder.id === candidate.id ? "border-blue-400/25 bg-blue-500/[0.09]" : "border-white/[0.055] bg-black/10"}`}><div className="flex items-center justify-between gap-3"><div><div className="text-[11px] font-black text-white">{candidate.code}</div><div className="mt-1 text-[9px] text-slate-500">{candidate.projectCode} · DEKA {candidate.targetCodes.join(", ")}</div></div><span className="rounded-lg bg-blue-500/10 px-2 py-1 text-[8px] font-black uppercase text-blue-300">{candidate.status}</span></div></button>)}</div>
        </section>
        <section className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-blue-300"><UsersRound size={16} /> Atanmış Personel · {assignedPersonnel.length}</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">{assignedPersonnel.map(person => <div key={person.id} className="rounded-2xl border border-white/[0.055] bg-black/10 p-3"><div className="text-[10px] font-black text-white">{person.displayName}</div><div className="mt-1 text-[9px] font-bold text-blue-300">{person.personnelCode}</div></div>)}</div>
        </section>
      </div>}
    </main>
    <ChiefBottomActionBar activeModule={activeModule} onSelect={module => { setActionError(null); setActiveModule(module); }} />
  </div>;
}

function AuthenticatedChiefConsole({ chief, workOrders, projects, personnelRecords, onLogout }: { chief: ChiefAccount; workOrders: readonly WorkOrder[]; projects: readonly OperationProject[]; personnelRecords: readonly PersonnelRecord[]; onLogout: () => void }) {
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(workOrders[0].id);
  const selectedWorkOrder = workOrders.find(workOrder => workOrder.id === selectedWorkOrderId) ?? workOrders[0];
  const project = projects.find(candidate => candidate.code === selectedWorkOrder.projectCode);
  useEffect(() => { if (!workOrders.some(workOrder => workOrder.id === selectedWorkOrderId)) setSelectedWorkOrderId(workOrders[0].id); }, [selectedWorkOrderId, workOrders]);
  if (!project) return <div className="grid h-full place-items-center text-[10px] font-black uppercase tracking-[0.15em] text-rose-300">İş Emri projesi yüklenemedi</div>;
  return <SelectedOperation chief={chief} workOrder={selectedWorkOrder} project={project} workOrders={workOrders} personnelRecords={personnelRecords} onSelectWorkOrder={setSelectedWorkOrderId} onLogout={onLogout} />;
}

export function ChiefConsole({ onExit }: { onExit?: () => void }) {
  const auth = useChiefAuth();
  const { hydrated, readModel } = useOperationsContext();
  useEffect(() => { document.body.dataset.chiefConsoleOpen = "true"; return () => { delete document.body.dataset.chiefConsoleOpen; }; }, []);
  if (!auth.chief) return <div className="fixed inset-0 z-[80] overflow-hidden bg-[#030816] py-3 sm:py-5"><ChiefLogin error={auth.error} onLogin={auth.login} onDevelopmentLogin={auth.loginDevelopment} onExit={onExit ? () => { void auth.logout().finally(onExit); } : undefined} /></div>;
  if (!hydrated) return <div className="fixed inset-0 z-[80] grid place-items-center bg-[#030816] p-5"><div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">Operasyon yükleniyor</div></div>;
  const assignedWorkOrders = readModel.workOrders.filter(candidate => candidate.chiefId === auth.chief!.id && (candidate.status === "assigned" || candidate.status === "active"));
  if (assignedWorkOrders.length === 0) return <div className="fixed inset-0 z-[80] grid place-items-center bg-[#030816] p-5"><div className="max-w-sm rounded-[28px] border border-blue-300/15 bg-blue-400/[0.04] p-6 text-center"><h2 className="text-lg font-black text-white">Atanmış İş Emri Yok</h2><p className="mt-2 text-[11px] leading-5 text-slate-500">CEO tarafından atanan İş Emirleri burada görünecek.</p><button type="button" onClick={auth.logout} className="mt-5 h-11 rounded-xl bg-blue-600 px-5 text-[10px] font-black text-white">Girişe Dön</button></div></div>;
  return <div className="fixed inset-0 z-[80] overflow-hidden bg-[#030816] pb-[env(safe-area-inset-bottom)] pt-[max(.5rem,env(safe-area-inset-top))] sm:py-3"><AuthenticatedChiefConsole chief={auth.chief} workOrders={assignedWorkOrders} projects={readModel.projects} personnelRecords={readModel.personnelRecords} onLogout={auth.logout} /></div>;
}
