import { CHIEF_WORKFLOW_DEFINITION } from "./workflow.definition.ts";
import type { WorkflowState } from "./workflow.types";

export function calculateWorkflowProgress(state: WorkflowState) {
  return CHIEF_WORKFLOW_DEFINITION.reduce((total, step) => state.completedSteps.includes(step.id) ? total + step.weight : total, 0);
}
