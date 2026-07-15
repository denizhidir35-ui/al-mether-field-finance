import type { WorkflowState } from "../workflow/workflow.types";

export function canConfirmDelivery(state: WorkflowState) {
  const hasBuilding = state.buildingReferences.length > 0;
  const hasBuildingPhoto = state.evidence.some(evidence => evidence.stepId === "building_photos" && evidence.type === "photo");
  return hasBuilding && hasBuildingPhoto;
}
