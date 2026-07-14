import type { WorkflowDefinitionStep, WorkflowStepId } from "./workflow.types";

export const CHIEF_WORKFLOW_DEFINITION: readonly WorkflowDefinitionStep[] = [
  { id: "project", phase: "DEKA", label: "İş Emrini Başlat", weight: 5 },
  { id: "deka", phase: "DEKA", label: "DK Doğrula", weight: 20 },
  { id: "personnel", phase: "Personel", label: "Personeli Doğrula", weight: 15 },
  { id: "target", phase: "Target", label: "Target Seç", weight: 20 },
  { id: "photo", phase: "Kablo", label: "Operasyon Fotoğrafı", weight: 20 },
  { id: "delivery", phase: "Teslim", label: "Teslimi Tamamla", weight: 20 },
  { id: "completed", phase: "Tamamlandı", label: "Operasyon Tamamlandı", weight: 0 }
] as const;

export function getNextWorkflowStep(stepId: WorkflowStepId): WorkflowStepId {
  const index = CHIEF_WORKFLOW_DEFINITION.findIndex(step => step.id === stepId);
  return CHIEF_WORKFLOW_DEFINITION[index + 1]?.id ?? "completed";
}

export function getWorkflowStep(stepId: WorkflowStepId) {
  return CHIEF_WORKFLOW_DEFINITION.find(step => step.id === stepId) ?? CHIEF_WORKFLOW_DEFINITION[0];
}
