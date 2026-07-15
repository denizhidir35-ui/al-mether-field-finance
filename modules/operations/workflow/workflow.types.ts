import type { OperationEvidence } from "../domain/operation-evidence";
import type { FieldPersonnelCode } from "../domain/identifiers";

export type WorkflowStepId = "project" | "deka" | "personnel" | "target" | "photo" | "deka_photos" | "parcel" | "street" | "street_photos" | "buildings" | "building_photos" | "delivery" | "completed";
export type WorkflowPhase = "DEKA" | "Keşif" | "Personel" | "Kablo" | "Target" | "Box" | "Teslim" | "Tamamlandı";

export type QualityCheckpointId = "dk_correct" | "cable_not_sagging" | "label_left" | "measurement_correct" | "clips_correct" | "box_intact" | "box_location_correct";

export type WorkflowState = {
  currentStep: WorkflowStepId;
  currentPhase: WorkflowPhase;
  completedSteps: readonly WorkflowStepId[];
  selectedTargetId?: string;
  parcelReference?: string;
  streetName?: string;
  buildingReferences: readonly string[];
  activePersonnelCount: number;
  activePersonnelCodes: readonly FieldPersonnelCode[];
  completedTargetCount: number;
  evidence: readonly OperationEvidence[];
  checkpoints: readonly QualityCheckpointId[];
  supportCount: number;
  criticalProblemCount: number;
  unreadMessageCount: number;
  personnelStatus: "pending" | "scanning" | "confirmed";
  workOrderStatus: "assigned" | "active" | "completed";
  markerStatus: "idle" | "active" | "attention" | "completed";
  notifications: readonly { id: string; message: string; occurredAt: string }[];
  processedEventIds: readonly string[];
  processedDeduplicationKeys: readonly string[];
  latestOperation: string;
  completedAt?: string;
};

export type WorkflowDefinitionStep = {
  id: WorkflowStepId;
  phase: WorkflowPhase;
  label: string;
  weight: number;
};
