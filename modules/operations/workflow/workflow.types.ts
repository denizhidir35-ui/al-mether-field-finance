import type { OperationEvidence } from "../domain/operation-evidence";

export type WorkflowStepId = "project" | "deka" | "personnel" | "target" | "photo" | "delivery" | "completed";
export type WorkflowPhase = "DEKA" | "Keşif" | "Personel" | "Kablo" | "Target" | "Box" | "Teslim" | "Tamamlandı";

export type QualityCheckpointId = "dk_correct" | "cable_not_sagging" | "label_left" | "measurement_correct" | "clips_correct" | "box_intact" | "box_location_correct";

export type WorkflowState = {
  currentStep: WorkflowStepId;
  currentPhase: WorkflowPhase;
  completedSteps: readonly WorkflowStepId[];
  selectedTargetId?: string;
  activePersonnelCount: number;
  completedTargetCount: number;
  evidence: readonly OperationEvidence[];
  checkpoints: readonly QualityCheckpointId[];
  supportCount: number;
  latestOperation: string;
  completedAt?: string;
};

export type WorkflowDefinitionStep = {
  id: WorkflowStepId;
  phase: WorkflowPhase;
  label: string;
  weight: number;
};
