import { getNextWorkflowStep, getWorkflowStep } from "./workflow.definition";
import type { OperationEvent } from "./workflow.events";
import type { WorkflowState, WorkflowStepId } from "./workflow.types";

export const INITIAL_WORKFLOW_STATE: WorkflowState = {
  currentStep: "project",
  currentPhase: "DEKA",
  completedSteps: [],
  activePersonnelCount: 0,
  completedTargetCount: 0,
  evidence: [],
  checkpoints: [],
  supportCount: 0,
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

export function workflowReducer(state: WorkflowState, event: OperationEvent): WorkflowState {
  if (event.context.module === "support" && event.type === "STEP_STARTED") {
    return { ...state, supportCount: state.supportCount + 1, latestOperation: "Destek kaydı oluşturuldu" };
  }
  if (event.context.module === "chat" && event.type === "STEP_STARTED") {
    return { ...state, latestOperation: "Operasyon sohbeti güncellendi" };
  }
  if (event.type === "STEP_STARTED" && event.stepId) {
    return { ...state, currentStep: event.stepId, currentPhase: getWorkflowStep(event.stepId).phase, latestOperation: `${getWorkflowStep(event.stepId).label} başladı` };
  }
  if (event.type === "STEP_COMPLETED" && event.stepId) {
    const next = completeStep(state, event.stepId, event.occurredAt);
    return { ...next, activePersonnelCount: event.payload?.activePersonnelCount ?? next.activePersonnelCount };
  }
  if (event.type === "CHECKPOINT_CONFIRMED" && event.payload?.checkpointId) {
    const checkpoints = state.checkpoints.includes(event.payload.checkpointId) ? state.checkpoints : [...state.checkpoints, event.payload.checkpointId];
    return { ...state, checkpoints, latestOperation: "Kalite kontrolü doğrulandı" };
  }
  if ((event.type === "PHOTO_CAPTURED" || event.type === "LOCATION_CAPTURED") && event.payload?.evidence) {
    return { ...state, evidence: [...state.evidence, event.payload.evidence], latestOperation: event.type === "PHOTO_CAPTURED" ? "Fotoğraf kaydedildi" : "Konum kaydedildi" };
  }
  if (event.type === "TARGET_SELECTED") {
    return { ...state, selectedTargetId: event.targetCode, latestOperation: `${event.targetCode ?? "Target"} seçildi` };
  }
  if (event.type === "DELIVERY_CONFIRMED") {
    return { ...completeStep(state, "delivery", event.occurredAt), completedTargetCount: state.completedTargetCount + 1, latestOperation: "Teslim doğrulandı" };
  }
  return state;
}

export function reduceWorkflowEvents(events: readonly OperationEvent[]) {
  return events.reduce(workflowReducer, INITIAL_WORKFLOW_STATE);
}
