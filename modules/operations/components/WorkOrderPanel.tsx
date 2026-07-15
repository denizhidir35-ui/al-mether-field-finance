"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ClipboardCheck, X } from "lucide-react";
import { FocusLayer } from "@/components/workspace/FocusLayer";
import type { FieldPersonnelCode, ProjectCode, TargetCode } from "../domain/identifiers";
import type { WorkOrderPriority } from "../domain/work-order";
import { useOperationsContext } from "../hooks/OperationsProvider";

const inputClass = "h-10 w-full rounded-xl border border-white/[0.07] bg-black/20 px-3 text-[10px] font-semibold text-slate-200 outline-none focus:border-blue-400/30";

export function WorkOrderPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { readModel, createWorkOrder } = useOperationsContext();
  const availableProjects = useMemo(() => readModel.projects.filter(project => !readModel.workOrders.some(order => order.projectCode === project.code && order.status !== "cancelled")), [readModel.projects, readModel.workOrders]);
  const [projectCode, setProjectCode] = useState<ProjectCode | "">("");
  const [customerName, setCustomerName] = useState("AL METHER Fiber");
  const [personnelIds, setPersonnelIds] = useState<FieldPersonnelCode[]>([]);
  const [plannedStartAt, setPlannedStartAt] = useState("2026-07-15");
  const [estimatedEndAt, setEstimatedEndAt] = useState("2026-08-15");
  const [priority, setPriority] = useState<WorkOrderPriority>("normal");
  const [error, setError] = useState<string | null>(null);

  function togglePersonnel(code: FieldPersonnelCode) {
    setPersonnelIds(current => current.includes(code) ? current.filter(item => item !== code) : [...current, code]);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!projectCode || personnelIds.length === 0) { setError("Proje ve en az bir personel seçilmelidir."); return; }
    const targetCode = projectCode.replace("ALM-", "TGT-") as TargetCode;
    try {
      createWorkOrder({ customerName: customerName.trim(), projectCode, chiefId: "chief-mthr001", personnelIds, plannedStartAt: new Date(`${plannedStartAt}T06:00:00+03:00`).toISOString(), estimatedEndAt: new Date(`${estimatedEndAt}T18:00:00+03:00`).toISOString(), priority, targetCodes: [targetCode] });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "İş Emri oluşturulamadı.");
    }
  }

  return (
    <FocusLayer open={open} onClose={onClose} label="Yeni İş Emri">
      <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><div className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-400/75">CEO · Operation Engine</div><h2 className="mt-1 text-xl font-black text-white">Yeni İş Emri</h2></div><button type="button" aria-label="İş Emrini kapat" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.07] text-slate-500"><X size={16} /></button></header>
      <form onSubmit={submit} className="mether-scroll grid min-h-0 flex-1 content-start gap-3 overflow-y-auto p-5 md:grid-cols-2">
        <label className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">Proje<select aria-label="İş Emri Projesi" value={projectCode} onChange={event => setProjectCode(event.target.value as ProjectCode)} className={`mt-1.5 ${inputClass}`}><option value="">Proje seç</option>{availableProjects.map(project => <option key={project.id} value={project.code}>{project.code} · {project.name}</option>)}</select></label>
        <label className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">Müşteri<input aria-label="İş Emri Müşterisi" value={customerName} onChange={event => setCustomerName(event.target.value)} className={`mt-1.5 ${inputClass}`} /></label>
        <label className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">Şef<input aria-label="Atanan Şef" readOnly value="MTHR001 · Ahmet Yılmaz" className={`mt-1.5 ${inputClass}`} /></label>
        <label className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">Öncelik<select aria-label="İş Emri Önceliği" value={priority} onChange={event => setPriority(event.target.value as WorkOrderPriority)} className={`mt-1.5 ${inputClass}`}><option value="low">Düşük</option><option value="normal">Normal</option><option value="high">Yüksek</option><option value="critical">Kritik</option></select></label>
        <label className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">Başlangıç<input aria-label="İş Emri Başlangıcı" type="date" value={plannedStartAt} onChange={event => setPlannedStartAt(event.target.value)} className={`mt-1.5 ${inputClass}`} /></label>
        <label className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">Tahmini Bitiş<input aria-label="İş Emri Tahmini Bitişi" type="date" value={estimatedEndAt} onChange={event => setEstimatedEndAt(event.target.value)} className={`mt-1.5 ${inputClass}`} /></label>
        <fieldset className="rounded-2xl border border-white/[0.06] bg-black/10 p-3 md:col-span-2"><legend className="px-1 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">Personel</legend>{readModel.personnelRecords.length === 0 ? <p className="text-[10px] text-amber-300/75">Önce HR ekranından personel oluşturun.</p> : <div className="grid gap-2 sm:grid-cols-2">{readModel.personnelRecords.map(person => <label key={person.id} className="flex items-center gap-2 rounded-xl border border-white/[0.05] p-2 text-[10px] text-slate-300"><input type="checkbox" checked={personnelIds.includes(person.personnelCode)} onChange={() => togglePersonnel(person.personnelCode)} /><span className="font-bold">{person.personnelCode}</span><span className="truncate text-slate-500">{person.displayName}</span></label>)}</div>}</fieldset>
        {error ? <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-[10px] text-rose-200 md:col-span-2">{error}</div> : null}
        <button type="submit" disabled={availableProjects.length === 0 || readModel.personnelRecords.length === 0} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-[11px] font-black text-white disabled:bg-white/[0.05] disabled:text-slate-600 md:col-span-2"><ClipboardCheck size={17} /> İş Emrini Oluştur</button>
      </form>
    </FocusLayer>
  );
}
