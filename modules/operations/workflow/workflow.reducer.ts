import { getNextWorkflowStep, getWorkflowStep } from "./workflow.definition.ts";
import type { OperationEvent } from "./workflow.events";
import type { WorkflowState, WorkflowStepId } from "./workflow.types";

export const INITIAL_WORKFLOW_STATE: WorkflowState = {
  currentStep: "personnel",
  currentPhase: "Personel",
  completedSteps: [],
  buildingReferences: [],
  activePersonnelCount: 0,
  activePersonnelCodes: [],
  completedTargetCount: 0,
  evidence: [],
  checkpoints: [],
  supportCount: 0,
  criticalProblemCount: 0,
  unreadMessageCount: 0,
  personnelStatus: "pending",
  workOrderStatus: "assigned",
  markerStatus: "idle",
  notifications: [],
  processedEventIds: [],
  processedDeduplicationKeys: [],
  latestOperation: "İş emri bekleniyor"
};

function completeStep(state: WorkflowState, stepId: WorkflowStepId, occurredAt: string): WorkflowState {
  const completedSteps = state.completedSteps.includes(stepId) ? state.completedSteps : [...state.completedSteps, stepId];
  const currentStep = getNextWorkflowStep(stepId);
  return {
    ...state,
    completedSteps,
    currentStep,
    currentPhase: getWorkflowStep(currentStep).phase,
    latestOperation: `${getWorkflowStep(stepId).label} tamamlandı`,
    completedAt: currentStep === "completed" ? occurredAt : state.completedAt
  };
}

function addNotification(state: WorkflowState, event: OperationEvent, message: string): WorkflowState {
  return { ...state, notifications: [...state.notifications, { id: event.id, message, occurredAt: event.occurredAt }] };
}

function markProcessed(state: WorkflowState, event: OperationEvent): WorkflowState {
  return {
    ...state,
    processedEventIds: [...state.processedEventIds, event.id],
    processedDeduplicationKeys: [...state.processedDeduplicationKeys, event.deduplicationKey]
  };
}

function hasProcessed(state: WorkflowState, event: OperationEvent) {
  return state.processedEventIds.includes(event.id) || state.processedDeduplicationKeys.includes(event.deduplicationKey);
}

function reduceCanonicalEvent(state: WorkflowState, event: OperationEvent): WorkflowState {
  switch (event.type) {
    case "DEKA_STARTED": {
      const started = completeStep({ ...state, workOrderStatus: "active", markerStatus: "active" }, "project", event.occurredAt);
      return { ...started, latestOperation: "DEKA başlatıldı" };
    }
    case "PERSONNEL_QR_START":
      return { ...state, personnelStatus: "scanning", latestOperation: "Personel QR doğrulaması başladı" };
    case "PERSONNEL_QR_FINISH": {
      const personnelCode = event.payload?.personnelCode;
      const attendanceAction = event.payload?.attendanceAction;
      const activePersonnelCodes = personnelCode
        ? attendanceAction === "check_out"
          ? state.activePersonnelCodes.filter(code => code !== personnelCode)
          : state.activePersonnelCodes.includes(personnelCode) ? state.activePersonnelCodes : [...state.activePersonnelCodes, personnelCode]
        : state.activePersonnelCodes;
      const confirmed = state.currentStep === "personnel" && attendanceAction === "check_in"
        ? completeStep(state, "personnel", event.occurredAt)
        : state;
      return {
        ...confirmed,
        personnelStatus: "confirmed",
        activePersonnelCodes,
        activePersonnelCount: personnelCode ? activePersonnelCodes.length : event.payload?.activePersonnelCount ?? confirmed.activePersonnelCount,
        latestOperation: attendanceAction === "check_out" ? "Personel mesaisi kapatıldı" : "Personel QR doğrulaması tamamlandı"
      };
    }
    case "CHECKPOINT_CONFIRMED": {
      const fieldValue = event.payload?.fieldValue?.trim();
      if (event.stepId === "parcel" && fieldValue && state.currentStep === "parcel") {
        return completeStep({ ...state, parcelReference: fieldValue }, "parcel", event.occurredAt);
      }
      if (event.stepId === "street" && fieldValue && state.currentStep === "street") {
        return completeStep({ ...state, streetName: fieldValue }, "street", event.occurredAt);
      }
      if (event.stepId === "buildings" && fieldValue && state.currentStep === "buildings") {
        const buildingReferences = fieldValue.split(",").map(value => value.trim()).filter(Boolean);
        return completeStep({ ...state, buildingReferences }, "buildings", event.occurredAt);
      }
      if (!event.payload?.checkpointId) return state;
      const checkpoints = state.checkpoints.includes(event.payload.checkpointId) ? state.checkpoints : [...state.checkpoints, event.payload.checkpointId];
      return { ...state, checkpoints, latestOperation: "Kalite kontrolü doğrulandı" };
    }
    case "PHOTO_CAPTURED": {
      if (!event.payload?.evidence) return state;
      const startsFieldOperation = event.stepId === "deka_photos" && state.currentStep === "deka_photos";
      const withEvidence = { ...state, evidence: [...state.evidence, event.payload.evidence], workOrderStatus: startsFieldOperation ? "active" as const : state.workOrderStatus, markerStatus: startsFieldOperation ? "active" as const : state.markerStatus, latestOperation: "Fotoğraf kaydedildi" };
      if (event.stepId === "deka" && withEvidence.checkpoints.includes("dk_correct")) return completeStep(withEvidence, "deka", event.occurredAt);
      if (event.stepId === "photo" && state.currentStep === "photo") return completeStep(withEvidence, "photo", event.occurredAt);
      if (event.stepId === "deka_photos" && state.currentStep === "deka_photos") return completeStep(withEvidence, "deka_photos", event.occurredAt);
      if (event.stepId === "street_photos" && state.currentStep === "street_photos" && withEvidence.evidence.filter(evidence => evidence.stepId === "street_photos" && evidence.type === "photo").length >= 4) return completeStep(withEvidence, "street_photos", event.occurredAt);
      if (event.stepId === "building_photos" && state.currentStep === "building_photos") return completeStep(withEvidence, "building_photos", event.occurredAt);
      return withEvidence;
    }
    case "LOCATION_CAPTURED":
      return event.payload?.evidence ? { ...state, evidence: [...state.evidence, event.payload.evidence], latestOperation: "Konum kaydedildi" } : state;
    case "TARGET_SELECTED":
      return { ...completeStep({ ...state, selectedTargetId: event.targetCode }, "target", event.occurredAt), latestOperation: `${event.targetCode ?? "Target"} seçildi` };
    case "PROBLEM_REPORTED": {
      const message = event.payload?.message ?? "Saha problemi bildirildi";
      const notified = addNotification(state, event, message);
      return {
        ...notified,
        supportCount: state.supportCount + 1,
        criticalProblemCount: state.criticalProblemCount + (event.payload?.severity === "critical" ? 1 : 0),
        markerStatus: "attention",
        latestOperation: message
      };
    }
    case "CHAT_MESSAGE":
      return { ...state, unreadMessageCount: state.unreadMessageCount + 1, latestOperation: "Takım mesajı gönderildi" };
    case "DELIVERY_CONFIRMED": {
      const delivered = completeStep(state, "delivery", event.occurredAt);
      return { ...delivered, completedTargetCount: state.completedTargetCount + 1, latestOperation: "Teslim doğrulandı" };
    }
    case "WORKFLOW_COMPLETED": {
      const completed = addNotification(state, event, "İş emri tamamlandı");
      return { ...completed, currentStep: "completed", currentPhase: "Tamamlandı", workOrderStatus: "completed", markerStatus: "completed", completedAt: event.occurredAt, latestOperation: "İş emri tamamlandı" };
    }
  }
}

export function workflowReducer(state: WorkflowState, event: OperationEvent): WorkflowState {
  if (hasProcessed(state, event)) return state;
  return markProcessed(reduceCanonicalEvent(state, event), event);
}

export function reduceWorkflowEvents(events: readonly OperationEvent[]) {
  return events.reduce(workflowReducer, INITIAL_WORKFLOW_STATE);
}
