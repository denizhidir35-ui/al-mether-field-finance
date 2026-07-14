import type { OperationEvidence } from "../domain/operation-evidence";
import type { ProjectCode, TargetCode } from "../domain/identifiers";
import type { QualityCheckpointId, WorkflowStepId } from "./workflow.types";

export type OperationEventType = "STEP_STARTED" | "STEP_COMPLETED" | "PHOTO_CAPTURED" | "LOCATION_CAPTURED" | "CHECKPOINT_CONFIRMED" | "TARGET_SELECTED" | "DELIVERY_CONFIRMED";
export type OperationEventModule = "personnel" | "deka" | "chat" | "support" | "workflow";

export type OperationEvent = {
  id: string;
  type: OperationEventType;
  projectCode: ProjectCode;
  workOrderId: string;
  chiefId: string;
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
  };
  occurredAt: string;
  version: 1;
};

export type NewOperationEvent = Omit<OperationEvent, "id" | "occurredAt" | "version">;
