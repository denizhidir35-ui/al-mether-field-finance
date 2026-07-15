import type { WorkflowDefinitionStep, WorkflowStepId } from "./workflow.types";

export const CHIEF_WORKFLOW_DEFINITION: readonly WorkflowDefinitionStep[] = [
  { id: "personnel", phase: "Personel", label: "Personeli Doğrula", weight: 10 },
  { id: "deka_photos", phase: "DEKA", label: "DEKA Fotoğrafları", weight: 15 },
  { id: "parcel", phase: "Keşif", label: "Ada / Parsel", weight: 10 },
  { id: "street", phase: "Keşif", label: "Sokak Seçimi", weight: 10 },
  { id: "street_photos", phase: "Keşif", label: "Sokak Fotoğrafları", weight: 20 },
  { id: "buildings", phase: "Keşif", label: "Binalar", weight: 10 },
  { id: "building_photos", phase: "Keşif", label: "Bina Fotoğrafları", weight: 20 },
  { id: "delivery", phase: "Teslim", label: "Saha Kaydını Tamamla", weight: 5 },
  { id: "completed", phase: "Tamamlandı", label: "Operasyon Tamamlandı", weight: 0 }
] as const;

export function getNextWorkflowStep(stepId: WorkflowStepId): WorkflowStepId {
  const index = CHIEF_WORKFLOW_DEFINITION.findIndex(step => step.id === stepId);
  return CHIEF_WORKFLOW_DEFINITION[index + 1]?.id ?? "completed";
}

export function getWorkflowStep(stepId: WorkflowStepId) {
  return CHIEF_WORKFLOW_DEFINITION.find(step => step.id === stepId) ?? CHIEF_WORKFLOW_DEFINITION[0];
}
