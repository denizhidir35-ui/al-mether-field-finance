import type { OperationEvidence } from "../domain/operation-evidence";
import type { OperationClockService } from "../services/operation-clock.service";

export function createPhotoEvidence(workOrderId: string, stepId: string, clock: OperationClockService): OperationEvidence {
  const capturedAt = clock.now();
  return {
    id: `evidence-${stepId}-${capturedAt}`,
    workOrderId,
    stepId,
    type: "photo",
    requirement: "required",
    capturedAt,
    syncStatus: "local",
    analysisStatus: "not_requested"
  };
}
