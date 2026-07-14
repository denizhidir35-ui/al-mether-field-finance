import type { OperationEvidence } from "../domain/operation-evidence";

export interface EvidenceCaptureService {
  capturePhoto(workOrderId: string, stepId: string): Promise<OperationEvidence>;
}
