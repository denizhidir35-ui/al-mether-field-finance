import { CalendarDays, MapPinned, Route, ServerCog, UserRound } from "lucide-react";
import type { OperationProject } from "../types";
import type { WorkOrder } from "../domain/work-order";
import type { WorkflowState } from "../workflow/workflow.types";
import { OPERATION_CHIEFS } from "../operations.data";

function SummaryValue({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[0.05] bg-black/10 px-2.5 py-2"><div className="text-[7px] font-bold uppercase tracking-[0.1em] text-slate-600">{label}</div><div className="mt-1 truncate text-[9px] font-bold text-slate-300">{value}</div></div>;
}

export function ProjectSummary({ project, workOrder, workflow }: { project: OperationProject; workOrder?: WorkOrder; workflow?: WorkflowState }) {
  const assignedChief = workOrder ? OPERATION_CHIEFS.find(chief => chief.id === workOrder.chiefId) : undefined;
  return (
    <article className="mether-scroll mether-surface h-full min-h-0 overflow-y-auto rounded-[22px] p-2.5">
      <header><div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.17em] text-blue-400/70"><ServerCog size={12} /> Seçilen Proje · {project.code}</div><h2 className="mt-1.5 text-[14px] font-black leading-5 text-white">{project.name}</h2><div className="mt-1 flex items-center gap-1 text-[8px] text-slate-500"><MapPinned size={9} /> {project.city} · {project.district} · Ada {project.island}</div></header>
      <div className="mt-2 grid grid-cols-3 gap-1.5"><SummaryValue label="Sokak" value={String(project.streets)} /><SummaryValue label="DK" value={String(project.distributionBoxes)} /><SummaryValue label="Bina" value={String(project.buildings)} /></div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5"><SummaryValue label="Başlama" value={project.startDate} /><SummaryValue label="Tahmini Bitiş" value={project.estimatedEndDate} /></div>
      <div className="mt-2 rounded-xl border border-blue-400/10 bg-blue-500/[0.05] p-2.5"><div className="flex items-center justify-between text-[8px]"><span className="font-bold text-slate-400">İlerleme</span><span className="font-black text-blue-300">%{project.progress}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${project.progress}%` }} /></div></div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[8px]"><div className="flex items-center gap-1.5 rounded-xl border border-white/[0.05] bg-black/10 px-2.5 py-2 text-slate-400"><UserRound size={11} className="text-blue-400/70" /><span className="truncate">{project.supervisor}</span></div><div className="flex items-center gap-1.5 rounded-xl border border-white/[0.05] bg-black/10 px-2.5 py-2 text-slate-500"><CalendarDays size={11} /><span>{project.status}</span></div></div>
      {workOrder ? <div className="mt-1.5 grid grid-cols-2 gap-1.5"><SummaryValue label="İş Emri No" value={workOrder.code} /><SummaryValue label="Müşteri" value={workOrder.customerName} /><SummaryValue label="Şef" value={assignedChief ? `${assignedChief.personnelCode} · ${assignedChief.displayName}` : workOrder.chiefId} /><SummaryValue label="Personel" value={`${workOrder.personnelIds.length} atanmış · ${workflow?.activePersonnelCount ?? 0} aktif`} /><SummaryValue label="Workflow" value={`${workOrder.workflowId} · ${project.workflowState}`} /><SummaryValue label="DEKA" value={workOrder.targetCodes.join(", ")} /><SummaryValue label="Öncelik" value={workOrder.priority.toLocaleUpperCase("tr-TR")} /><SummaryValue label="Durum" value={workOrder.status.toLocaleUpperCase("tr-TR")} /></div> : <div className="mt-2 rounded-xl border border-dashed border-amber-300/15 bg-amber-400/[0.03] p-3 text-[9px] leading-4 text-amber-200/65">Bu proje için henüz CEO tarafından İş Emri oluşturulmadı.</div>}
      <div className="mt-1.5 grid grid-cols-2 gap-1.5"><SummaryValue label="Son İşlem" value={project.latestOperation} /><SummaryValue label="Son Fotoğraf" value={workflow?.evidence.filter(item => item.type === "photo").at(-1)?.capturedAt ? new Date(workflow.evidence.filter(item => item.type === "photo").at(-1)!.capturedAt).toLocaleString("tr-TR") : "Henüz yok"} /></div>
      <div className="mt-1 flex items-center gap-1.5 text-[8px] text-slate-600"><Route size={10} /> Personel QR → DEKA Fotoğrafları → Ada / Parsel → Sokak → Sokak Fotoğrafları → Binalar → Bina Fotoğrafları</div>
    </article>
  );
}
