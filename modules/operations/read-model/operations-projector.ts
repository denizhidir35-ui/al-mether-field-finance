import type { MapMarker } from "@/core/map/types";
import type { WorkOrder } from "../domain/work-order";
import type { OperationProject } from "../domain/operation-project";
import type { WorkOrderId } from "../domain/identifiers";
import type { OperationEvent } from "../workflow/workflow.events";
import { calculateWorkflowProgress } from "../workflow/workflow.progress.ts";
import { INITIAL_WORKFLOW_STATE, reduceWorkflowEvents } from "../workflow/workflow.reducer.ts";
import type { OperationsReadModel } from "./operations-read-model";

function projectedEndDate(occurredAt: string, progress: number, completedAt?: string) {
  const date = new Date(completedAt ?? occurredAt);
  if (!completedAt) date.setDate(date.getDate() + Math.max(1, Math.ceil((100 - progress) / 4)));
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function markerTone(status: OperationProject["markerStatus"]): NonNullable<MapMarker["tone"]> {
  if (status === "completed") return "success";
  if (status === "attention") return "warning";
  if (status === "active") return "active";
  return "default";
}

export function projectOperationsReadModel(baseProjects: readonly OperationProject[], baseWorkOrders: readonly WorkOrder[], events: readonly OperationEvent[]): OperationsReadModel {
  const workOrderStates = Object.fromEntries(baseWorkOrders.map(workOrder => [
    workOrder.id,
    reduceWorkflowEvents(events.filter(event => event.workOrderId === workOrder.id))
  ])) as Record<WorkOrderId, ReturnType<typeof reduceWorkflowEvents>>;

  const workOrders = baseWorkOrders.map(workOrder => {
    const state = workOrderStates[workOrder.id] ?? INITIAL_WORKFLOW_STATE;
    return {
      ...workOrder,
      status: state.workOrderStatus,
      completedAt: state.completedAt ?? workOrder.completedAt
    };
  });

  const projects = baseProjects.map(project => {
    const workOrder = workOrders.find(candidate => candidate.projectCode === project.code);
    const workflow = workOrder ? workOrderStates[workOrder.id] : INITIAL_WORKFLOW_STATE;
    const projectEvents = workOrder ? events.filter(event => event.workOrderId === workOrder.id) : [];
    const latestEvent = projectEvents.at(-1);
    const workflowProgress = calculateWorkflowProgress(workflow);
    const progress = projectEvents.length > 0 ? Math.min(100, Math.round(project.progress + ((100 - project.progress) * workflowProgress / 100))) : project.progress;
    const markerStatus = workflow.markerStatus === "idle" ? project.markerStatus : workflow.markerStatus;
    return {
      ...project,
      progress,
      activePersonnelCount: workflow.activePersonnelCount || project.activePersonnelCount,
      completedTargetCount: project.completedTargetCount + workflow.completedTargetCount,
      workflowState: projectEvents.length > 0 ? workflow.currentPhase : project.workflowState,
      latestOperation: workflow.latestOperation === "İş emri bekleniyor" ? project.latestOperation : workflow.latestOperation,
      supportCount: project.supportCount + workflow.supportCount,
      photoCount: project.photoCount + workflow.evidence.filter(evidence => evidence.type === "photo").length,
      status: workflow.workOrderStatus === "completed" ? "Teslim" as const : project.status,
      estimatedEndDate: latestEvent ? projectedEndDate(latestEvent.occurredAt, progress, workflow.completedAt) : project.estimatedEndDate,
      markerStatus
    };
  });

  const activePersonnel = projects.reduce((total, project) => total + project.activePersonnelCount, 0);
  const assignedPersonnel = workOrders.reduce((total, workOrder) => total + workOrder.personnelIds.length, 0);
  const completedTargets = projects.reduce((total, project) => total + project.completedTargetCount, 0);
  const supportCount = projects.reduce((total, project) => total + project.supportCount, 0);
  const criticalProblemCount = Object.values(workOrderStates).reduce((total, state) => total + state.criticalProblemCount, 0);
  const photoCount = projects.reduce((total, project) => total + project.photoCount, 0);
  const activeChiefCount = new Set(workOrders.filter(workOrder => workOrder.status === "active").map(workOrder => workOrder.chiefId)).size;
  const notifications = Object.values(workOrderStates).flatMap(state => state.notifications).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const kpis = [
    { label: "Aktif Proje", mobileLabel: "Projeler", value: String(projects.filter(project => project.status !== "Teslim").length), detail: `${projects.length} toplam proje` },
    { label: "Aktif Şef", mobileLabel: "Şefler", value: String(activeChiefCount), detail: "WorkOrder projection" },
    { label: "Aktif Personel", mobileLabel: "Personel", value: String(activePersonnel), detail: "Read Model tarafından hesaplandı" },
    { label: "Tamamlanan Target", mobileLabel: "Target", value: String(completedTargets), detail: "Teslimi doğrulanan hedefler" },
    { label: "Problem Kayıtları", mobileLabel: "Problem", value: String(supportCount), detail: `${criticalProblemCount} kritik kayıt` },
    { label: "Operasyon Fotoğrafı", mobileLabel: "Fotoğraf", value: String(photoCount), detail: "Sistemle ilişkilendirilen kanıtlar" }
  ] as const;
  const mapMarkers: readonly MapMarker[] = projects.map(project => ({ id: project.id, position: project.coordinates, label: project.code, title: `${project.code} ${project.name}`, tone: markerTone(project.markerStatus) }));

  return {
    workOrders,
    projects,
    kpis,
    workOrderStates,
    mapMarkers,
    personnel: { active: activePersonnel, assigned: assignedPersonnel },
    problems: { open: supportCount, critical: criticalProblemCount },
    notifications,
    latestOperation: events.at(-1)?.context.action ?? "Operasyonlar hazır",
    supportCount,
    photoCount
  };
}
