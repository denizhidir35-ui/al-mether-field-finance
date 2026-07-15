"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ClipboardList, LogOut, ScanLine, UsersRound } from "lucide-react";
import type { ChiefAccount } from "../domain/chief-account";
import type { OperationProject } from "../domain/operation-project";
import type { PersonnelRecord } from "../domain/personnel-record";
import type { WorkOrder } from "../domain/work-order";
import { useChiefAuth } from "../hooks/useChiefAuth";
import { useOperationWorkflow } from "../hooks/useOperationWorkflow";
import { useOperationsContext } from "../hooks/OperationsProvider";
import { scanPersonnelQrImage } from "../services/qr.service";
import { ChiefLogin } from "./ChiefLogin";

function PersonnelQrScanner({ chief, project, personnel }: { chief: ChiefAccount; project: OperationProject; personnel: readonly PersonnelRecord[] }) {
  const { recordPersonnelAttendance } = useOperationWorkflow(project, chief);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function scan(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage(null);
    setError(null);
    try {
      const personnelCode = await scanPersonnelQrImage(file);
      recordPersonnelAttendance(personnelCode);
      const person = personnel.find(candidate => candidate.personnelCode === personnelCode);
      setMessage(`${person?.displayName ?? personnelCode} doğrulandı.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Personel QR doğrulanamadı.");
    }
  }

  return (
    <section className="rounded-[24px] border border-blue-400/15 bg-blue-500/[0.055] p-4">
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-blue-300"><ScanLine size={16} /> Personel QR Tarayıcı</div>
      <p className="mt-2 text-[10px] leading-5 text-slate-500">Yalnızca bu Şefe ve seçili İş Emrine atanmış personel QR kodları kabul edilir.</p>
      <label className="mt-4 flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 text-[11px] font-black text-white active:scale-[.99]">
        <ScanLine size={18} /> Personel QR Okut
        <input aria-label="Personel QR Okut" type="file" accept="image/*" capture="environment" onChange={scan} className="sr-only" />
      </label>
      {message ? <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-500/10 p-3 text-[10px] text-emerald-200">{message}</div> : null}
      {error ? <div role="alert" className="mt-3 rounded-xl border border-rose-400/15 bg-rose-500/10 p-3 text-[10px] text-rose-200">{error}</div> : null}
    </section>
  );
}

function AuthenticatedChiefConsole({ chief, workOrders, projects, personnelRecords, onLogout }: { chief: ChiefAccount; workOrders: readonly WorkOrder[]; projects: readonly OperationProject[]; personnelRecords: readonly PersonnelRecord[]; onLogout: () => void }) {
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(workOrders[0].id);
  const selectedWorkOrder = workOrders.find(workOrder => workOrder.id === selectedWorkOrderId) ?? workOrders[0];
  const project = projects.find(candidate => candidate.code === selectedWorkOrder.projectCode);
  const assignedPersonnel = useMemo(() => personnelRecords.filter(person =>
    selectedWorkOrder.personnelIds.includes(person.personnelCode) && person.assignedChiefCode === chief.id,
  ), [chief.id, personnelRecords, selectedWorkOrder.personnelIds]);

  useEffect(() => {
    if (!workOrders.some(workOrder => workOrder.id === selectedWorkOrderId)) setSelectedWorkOrderId(workOrders[0].id);
  }, [selectedWorkOrderId, workOrders]);

  if (!project) return <div className="grid h-full place-items-center text-[10px] font-black uppercase tracking-[0.15em] text-rose-300">İş Emri projesi yüklenemedi</div>;

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[560px] flex-col px-3 pb-4 pt-2">
      <header className="flex shrink-0 items-center justify-between rounded-[22px] border border-white/[0.06] bg-white/[0.025] px-4 py-3">
        <div><div className="text-[8px] font-black uppercase tracking-[0.18em] text-blue-400">AL METHER Chief</div><div className="mt-1 text-[14px] font-black text-white">{chief.displayName}</div><div className="mt-0.5 text-[9px] font-bold text-slate-500">{chief.personnelCode}</div></div>
        <button type="button" onClick={onLogout} aria-label="Çıkış" className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] text-slate-500"><LogOut size={16} /></button>
      </header>

      <main className="mether-scroll mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pb-2">
        <section className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-blue-300"><ClipboardList size={16} /> Atanmış İş Emirleri · {workOrders.length}</div>
          <div className="mt-3 space-y-2">{workOrders.map(workOrder => <button key={workOrder.id} type="button" onClick={() => setSelectedWorkOrderId(workOrder.id)} className={`w-full rounded-2xl border p-3 text-left ${selectedWorkOrder.id === workOrder.id ? "border-blue-400/25 bg-blue-500/[0.09]" : "border-white/[0.055] bg-black/10"}`}><div className="flex items-center justify-between gap-3"><div><div className="text-[11px] font-black text-white">{workOrder.code}</div><div className="mt-1 text-[9px] text-slate-500">{workOrder.projectCode} · DEKA {workOrder.targetCodes.join(", ")}</div></div><span className="rounded-lg bg-blue-500/10 px-2 py-1 text-[8px] font-black uppercase text-blue-300">{workOrder.status}</span></div></button>)}</div>
        </section>

        <section className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-blue-300"><UsersRound size={16} /> Atanmış Personel · {assignedPersonnel.length}</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">{assignedPersonnel.map(person => <div key={person.id} className="rounded-2xl border border-white/[0.055] bg-black/10 p-3"><div className="text-[10px] font-black text-white">{person.displayName}</div><div className="mt-1 text-[9px] font-bold text-blue-300">{person.personnelCode}</div></div>)}</div>
        </section>

        <PersonnelQrScanner chief={chief} project={project} personnel={assignedPersonnel} />
      </main>
    </div>
  );
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
