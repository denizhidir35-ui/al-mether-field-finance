import type { OperationEvidence } from "../domain/operation-evidence";
import type { ProjectCode, TargetCode, WorkOrderId } from "../domain/identifiers";
import type { QualityCheckpointId, WorkflowStepId } from "./workflow.types";

export type OperationEventType =
  | "PERSONNEL_QR_START"
  | "PERSONNEL_QR_FINISH"
  | "DEKA_STARTED"
  | "PHOTO_CAPTURED"
  | "LOCATION_CAPTURED"
  | "TARGET_SELECTED"
  | "CHECKPOINT_CONFIRMED"
  | "PROBLEM_REPORTED"
  | "CHAT_MESSAGE"
  | "DELIVERY_CONFIRMED"
  | "WORKFLOW_COMPLETED";

export type OperationEventModule = "personnel" | "deka" | "team" | "problem" | "workflow" | "delivery";
export type OperationProblemSeverity = "warning" | "critical";

export type OperationEvent = {
  id: string;
  type: OperationEventType;
  projectCode: ProjectCode;
  workOrderId: WorkOrderId;
  chiefId: string;
  deduplicationKey: string;
  targetCode?: TargetCode;
  stepId?: WorkflowStepId;
  context: {
    module: OperationEventModule;
    action: string;
  };
  payload?: {
    activePersonnelCount?: number;
    checkpointId?: QualityCheckpointId;
    evidence?: OperationEvidence;
    message?: string;
    severity?: OperationProblemSeverity;
  };
  occurredAt: string;
  version: 1;
};

export type NewOperationEvent = Omit<OperationEvent, "id" | "occurredAt" | "version">;
