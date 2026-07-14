"use client";

import type { ChiefAccount } from "../domain/chief-account";
import type { OperationProject } from "../domain/operation-project";
import type { TargetCode } from "../domain/identifiers";
import { canConfirmDelivery } from "../delivery/delivery.policy";
import { createPhotoEvidence } from "../photos/photo-evidence.factory";
import { systemOperationClock } from "../services/operation-clock.service";
import { useOperationsContext } from "./OperationsProvider";
import { getWorkflowStep } from "../workflow/workflow.definition";

export function useOperationWorkflow(project: OperationProject, chief: ChiefAccount) {
  const { readModel, dispatch, dispatchMany } = useOperationsContext();
  const state = readModel.workflows[project.code];
  const step = getWorkflowStep(state.currentStep);
  const common = { projectCode: project.code, workOrderId: `work-order-${project.code.toLowerCase()}`, chiefId: chief.id } as const;

  function advance() {
    if (state.currentStep === "deka") {
      const evidence = createPhotoEvidence(common.workOrderId, "deka", systemOperationClock);
      dispatchMany([
        { ...common, type: "CHECKPOINT_CONFIRMED", stepId: "deka", context: { module: "deka", action: "dk_correct" }, payload: { checkpointId: "dk_correct" } },
        { ...common, type: "PHOTO_CAPTURED", stepId: "deka", context: { module: "deka", action: "first_photo" }, payload: { evidence } },
        { ...common, type: "STEP_COMPLETED", stepId: "deka", context: { module: "deka", action: "deka_completed" } }
      ]);
      return;
    }
    if (state.currentStep === "personnel") {
      dispatch({ ...common, type: "STEP_COMPLETED", stepId: "personnel", context: { module: "personnel", action: "personnel_confirmed" }, payload: { activePersonnelCount: 8 } });
      return;
    }
    if (state.currentStep === "target") {
      const targetCode: TargetCode = "TGT-0001";
      dispatchMany([
        { ...common, type: "TARGET_SELECTED", stepId: "target", targetCode, context: { module: "workflow", action: "target_selected" } },
        { ...common, type: "STEP_COMPLETED", stepId: "target", targetCode, context: { module: "workflow", action: "target_completed" } }
      ]);
      return;
    }
    if (state.currentStep === "photo") {
      const evidence = createPhotoEvidence(common.workOrderId, "photo", systemOperationClock);
      dispatchMany([
        { ...common, type: "PHOTO_CAPTURED", stepId: "photo", context: { module: "workflow", action: "operation_photo" }, payload: { evidence } },
        { ...common, type: "STEP_COMPLETED", stepId: "photo", context: { module: "workflow", action: "photo_completed" } }
      ]);
      return;
    }
    if (state.currentStep === "delivery") {
      if (!canConfirmDelivery(state)) return;
      dispatch({ ...common, type: "DELIVERY_CONFIRMED", stepId: "delivery", targetCode: "TGT-0001", context: { module: "workflow", action: "delivery_confirmed" } });
      return;
    }
    if (state.currentStep !== "completed") {
      dispatch({ ...common, type: "STEP_COMPLETED", stepId: state.currentStep, context: { module: "workflow", action: `${state.currentStep}_completed` } });
    }
  }

  function createChannelActivity(module: "chat" | "support") {
    dispatch({ ...common, type: "STEP_STARTED", context: { module, action: module === "chat" ? "channel_opened" : "support_requested" } });
  }

  return { state, step, advance, createChannelActivity };
}
