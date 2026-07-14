import type { OperationProject } from "../domain/operation-project";
import type { OperationEvent } from "../workflow/workflow.events";
import { calculateWorkflowProgress } from "../workflow/workflow.progress";
import { reduceWorkflowEvents } from "../workflow/workflow.reducer";
import type { OperationsReadModel } from "./operations-read-model";

function projectedEndDate(occurredAt: string, progress: number, completedAt?: string) {
  const date = new Date(completedAt ?? occurredAt);
  if (!completedAt) date.setDate(date.getDate() + Math.max(1, Math.ceil((100 - progress) / 4)));
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function projectOperationsReadModel(baseProjects: readonly OperationProject[], events: readonly OperationEvent[]): OperationsReadModel {
  const workflows = Object.fromEntries(baseProjects.map(project => {
    const projectEvents = events.filter(event => event.projectCode === project.code);
    return [project.code, reduceWorkflowEvents(projectEvents)];
  }));

  const projects = baseProjects.map(project => {
    const projectEvents = events.filter(event => event.projectCode === project.code);
    const latestEvent = projectEvents.at(-1);
    const workflow = workflows[project.code];
    const workflowProgress = calculateWorkflowProgress(workflow);
    const progress = events.some(event => event.projectCode === project.code)
      ? Math.min(100, Math.round(project.progress + ((100 - project.progress) * workflowProgress / 100)))
      : project.progress;
    return {
      ...project,
      progress,
      activePersonnelCount: workflow.activePersonnelCount || project.activePersonnelCount,
      completedTargetCount: project.completedTargetCount + workflow.completedTargetCount,
      workflowState: projectEvents.length > 0 ? workflow.currentPhase : project.workflowState,
      latestOperation: workflow.latestOperation === "İş emri bekleniyor" ? project.latestOperation : workflow.latestOperation,
      supportCount: project.supportCount + workflow.supportCount,
      photoCount: project.photoCount + workflow.evidence.filter(evidence => evidence.type === "photo").length,
      status: workflow.currentStep === "completed" ? "Teslim" as const : project.status,
      estimatedEndDate: latestEvent ? projectedEndDate(latestEvent.occurredAt, progress, workflow.completedAt) : project.estimatedEndDate,
      markerStatus: workflow.currentStep === "completed" ? "completed" as const : workflow.supportCount > 0 ? "attention" as const : projectEvents.length > 0 ? "active" as const : project.markerStatus
    };
  });

  const activePersonnel = projects.reduce((total, project) => total + project.activePersonnelCount, 0);
  const completedTargets = projects.reduce((total, project) => total + project.completedTargetCount, 0);
  const supportCount = projects.reduce((total, project) => total + project.supportCount, 0);
  const photoCount = projects.reduce((total, project) => total + project.photoCount, 0);
  const kpis = [
    { label: "Aktif Proje", mobileLabel: "Projeler", value: String(projects.filter(project => project.status !== "Teslim").length), detail: `${projects.length} toplam proje` },
    { label: "Aktif Şef", mobileLabel: "Şefler", value: "3", detail: "Tümü çevrimiçi" },
    { label: "Aktif Personel", mobileLabel: "Personel", value: String(activePersonnel), detail: "Read Model tarafından hesaplandı" },
    { label: "Tamamlanan Target", mobileLabel: "Target", value: String(completedTargets), detail: "Teslimi doğrulanan hedefler" },
    { label: "Destek Kayıtları", mobileLabel: "Destek", value: String(supportCount), detail: "Aktif saha destekleri" },
    { label: "Operasyon Fotoğrafı", mobileLabel: "Fotoğraf", value: String(photoCount), detail: "Sistemle ilişkilendirilen kanıtlar" }
  ] as const;

  return {
    projects,
    kpis,
    workflows,
    latestOperation: events.at(-1)?.context.action ?? "Operasyonlar hazır",
    supportCount,
    photoCount
  };
}
