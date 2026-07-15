"use client";

import type { ChiefAccount } from "../domain/chief-account";
import type { OperationProject } from "../domain/operation-project";
import type { FieldPersonnelCode, TargetCode } from "../domain/identifiers";
import { canConfirmDelivery } from "../delivery/delivery.policy";
import { createPhotoEvidence } from "../photos/photo-evidence.factory";
import { systemOperationClock } from "../services/operation-clock.service";
import { captureBrowserLocation } from "../services/location.service";
import { getWorkflowStep } from "../workflow/workflow.definition";
import { useOperationsContext } from "./OperationsProvider";

export function useOperationWorkflow(project: OperationProject, chief: ChiefAccount) {
  const { readModel, dispatch, dispatchMany } = useOperationsContext();
  const workOrder = readModel.workOrders.find(candidate => candidate.projectCode === project.code && candidate.chiefId === chief.id && (candidate.status === "assigned" || candidate.status === "active"));
  if (!workOrder) throw new Error(`Chief operation blocked: no assigned WorkOrder for ${chief.id} / ${project.code}`);
  const assignedWorkOrder = workOrder;

  const state = readModel.workOrderStates[assignedWorkOrder.id];
  const step = getWorkflowStep(state.currentStep);
  const common = { projectCode: project.code, workOrderId: assignedWorkOrder.id, chiefId: chief.id } as const;
  const key = (fact: string) => `${assignedWorkOrder.id}:${fact}`;

  function advance() {
    if (state.currentStep === "project") {
      dispatch({ ...common, type: "DEKA_STARTED", deduplicationKey: key("deka-started"), stepId: "project", context: { module: "deka", action: "deka_started" } });
      return;
    }
    if (state.currentStep === "deka") {
      dispatch({ ...common, type: "CHECKPOINT_CONFIRMED", deduplicationKey: key("deka-dk-correct"), stepId: "deka", context: { module: "deka", action: "dk_correct" }, payload: { checkpointId: "dk_correct" } });
      return;
    }
    if (state.currentStep === "personnel") {
      return;
    }
    if (state.currentStep === "target") {
      const targetCode: TargetCode = assignedWorkOrder.targetCodes[0] ?? "TGT-0001";
      dispatch({ ...common, type: "TARGET_SELECTED", deduplicationKey: key(`target-selected-${targetCode}`), stepId: "target", targetCode, context: { module: "workflow", action: "target_selected" } });
      return;
    }
    if (state.currentStep === "photo") {
      const evidence = createPhotoEvidence(assignedWorkOrder.id, "photo", systemOperationClock);
      dispatch({ ...common, type: "PHOTO_CAPTURED", deduplicationKey: key("operation-final-photo"), stepId: "photo", context: { module: "workflow", action: "operation_photo" }, payload: { evidence } });
      return;
    }
    if (state.currentStep === "delivery") {
      if (!canConfirmDelivery(state)) return;
      const targetCode: TargetCode = assignedWorkOrder.targetCodes[0] ?? "TGT-0001";
      dispatchMany([
        { ...common, type: "DELIVERY_CONFIRMED", deduplicationKey: key(`delivery-confirmed-${targetCode}`), stepId: "delivery", targetCode, context: { module: "delivery", action: "delivery_confirmed" } },
        { ...common, type: "WORKFLOW_COMPLETED", deduplicationKey: key("workflow-completed"), stepId: "completed", targetCode, context: { module: "workflow", action: "workflow_completed" } }
      ]);
    }
  }

  function recordPersonnelAttendance(personnelCode: FieldPersonnelCode) {
    if (!assignedWorkOrder.personnelIds.includes(personnelCode)) throw new Error("Bu personel İş Emri ekibinde değil.");
    const attendanceAction = state.activePersonnelCodes.includes(personnelCode) ? "check_out" : "check_in";
    const scanId = systemOperationClock.now();
    dispatchMany([
      { ...common, type: "PERSONNEL_QR_START", deduplicationKey: key(`personnel-qr-start-${personnelCode}-${scanId}`), stepId: "personnel", context: { module: "personnel", action: "personnel_qr_scan" } },
      { ...common, type: "PERSONNEL_QR_FINISH", deduplicationKey: key(`personnel-qr-finish-${personnelCode}-${scanId}`), stepId: "personnel", context: { module: "personnel", action: `personnel_${attendanceAction}` }, payload: { personnelCode, attendanceAction } }
    ]);
  }

  function capturePhoto(file: File) {
    const stepId = state.currentStep === "deka" ? "deka" : "photo";
    const evidence = { ...createPhotoEvidence(assignedWorkOrder.id, stepId, systemOperationClock), localReference: file.name };
    dispatch({ ...common, type: "PHOTO_CAPTURED", deduplicationKey: key(`photo-${evidence.id}`), stepId, context: { module: "workflow", action: "photo_captured" }, payload: { evidence } });
  }

  async function captureLocation() {
    const coordinates = await captureBrowserLocation();
    const capturedAt = systemOperationClock.now();
    dispatch({
      ...common,
      type: "LOCATION_CAPTURED",
      deduplicationKey: key(`location-${capturedAt}`),
      stepId: state.currentStep,
      context: { module: "workflow", action: "location_captured" },
      payload: { evidence: { id: `evidence-location-${capturedAt}`, workOrderId: assignedWorkOrder.id, stepId: state.currentStep, type: "location", requirement: "required", coordinates, capturedAt, syncStatus: "local", analysisStatus: "not_requested" } }
    });
  }

  function confirmDelivery() {
    if (!canConfirmDelivery(state)) throw new Error("Teslim için Target ve son fotoğraf tamamlanmalıdır.");
    const targetCode: TargetCode = assignedWorkOrder.targetCodes[0] ?? "TGT-0001";
    dispatchMany([
      { ...common, type: "DELIVERY_CONFIRMED", deduplicationKey: key(`delivery-confirmed-${targetCode}`), stepId: "delivery", targetCode, context: { module: "delivery", action: "delivery_confirmed" } },
      { ...common, type: "WORKFLOW_COMPLETED", deduplicationKey: key("workflow-completed"), stepId: "completed", targetCode, context: { module: "workflow", action: "workflow_completed" } }
    ]);
  }

  function createChannelActivity(module: "chat" | "support") {
    if (module === "chat") {
      dispatch({
        ...common,
        type: "CHAT_MESSAGE",
        deduplicationKey: key(`chat-message-${state.unreadMessageCount + 1}`),
        context: { module: "team", action: "chat_message" },
        payload: { message: "Saha ekibi kanal aktivitesi" }
      });
      return;
    }
    dispatch({
      ...common,
      type: "PROBLEM_REPORTED",
      deduplicationKey: key(`problem-reported-${state.supportCount + 1}`),
      context: { module: "problem", action: "problem_reported" },
      payload: { message: "Yeni saha problemi bildirildi", severity: "warning" }
    });
  }

  return { workOrder: assignedWorkOrder, state, step, advance, recordPersonnelAttendance, capturePhoto, captureLocation, confirmDelivery, createChannelActivity };
}
