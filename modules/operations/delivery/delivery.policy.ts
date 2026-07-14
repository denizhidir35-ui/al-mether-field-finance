import type { WorkflowState } from "../workflow/workflow.types";

export function canConfirmDelivery(state: WorkflowState) {
  const hasTarget = Boolean(state.selectedTargetId);
  const hasFinalPhoto = state.evidence.some(evidence => evidence.stepId === "photo" && evidence.type === "photo");
  return hasTarget && hasFinalPhoto;
}
