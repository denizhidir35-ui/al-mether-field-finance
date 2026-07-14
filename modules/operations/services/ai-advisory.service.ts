import type { OperationEvidence } from "../domain/operation-evidence";

export interface AiAdvisoryService {
  analyzeEvidence(evidence: OperationEvidence): Promise<readonly string[]>;
}
