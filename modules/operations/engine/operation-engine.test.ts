import assert from "node:assert/strict";
import test from "node:test";
import { OPERATION_PROJECTS, OPERATION_WORK_ORDERS } from "../operations.data.ts";
import { projectOperationsReadModel } from "../read-model/operations-projector.ts";
import { MemoryOperationsRepository } from "../repositories/memory-operations.repository.ts";
import type { OperationEvent, OperationEventType } from "../workflow/workflow.events.ts";
import { reduceWorkflowEvents } from "../workflow/workflow.reducer.ts";

const workOrder = OPERATION_WORK_ORDERS[0];
const occurredAt = "2026-07-14T12:00:00.000Z";

function event(type: OperationEventType, sequence: number, overrides: Partial<OperationEvent> = {}): OperationEvent {
  return {
    id: `event-${sequence}`,
    type,
    projectCode: workOrder.projectCode,
    workOrderId: workOrder.id,
    chiefId: workOrder.chiefId,
    deduplicationKey: `${workOrder.id}:${type}:${sequence}`,
    context: { module: "workflow", action: type.toLowerCase() },
    occurredAt,
    version: 1,
    ...overrides
  };
}

const dekaEvidence = {
  id: "evidence-deka-1",
  workOrderId: workOrder.id,
  stepId: "deka",
  type: "photo" as const,
  requirement: "required" as const,
  capturedAt: occurredAt,
  syncStatus: "local" as const,
  analysisStatus: "not_requested" as const
};

const finalEvidence = { ...dekaEvidence, id: "evidence-photo-1", stepId: "photo" };

const completedStream: readonly OperationEvent[] = [
  event("DEKA_STARTED", 1, { stepId: "project", context: { module: "deka", action: "deka_started" } }),
  event("CHECKPOINT_CONFIRMED", 2, { stepId: "deka", context: { module: "deka", action: "dk_correct" }, payload: { checkpointId: "dk_correct" } }),
  event("PHOTO_CAPTURED", 3, { stepId: "deka", context: { module: "deka", action: "first_photo" }, payload: { evidence: dekaEvidence } }),
  event("PERSONNEL_QR_START", 4, { stepId: "personnel", context: { module: "personnel", action: "personnel_qr_start" } }),
  event("PERSONNEL_QR_FINISH", 5, { stepId: "personnel", context: { module: "personnel", action: "personnel_qr_finish" }, payload: { activePersonnelCount: 5 } }),
  event("TARGET_SELECTED", 6, { stepId: "target", targetCode: "TGT-0001", payload: {} }),
  event("PHOTO_CAPTURED", 7, { stepId: "photo", payload: { evidence: finalEvidence } }),
  event("DELIVERY_CONFIRMED", 8, { stepId: "delivery", targetCode: "TGT-0001" }),
  event("WORKFLOW_COMPLETED", 9, { stepId: "completed", targetCode: "TGT-0001" })
];

test("canonical event stream completes one WorkOrder deterministically", () => {
  const firstReplay = reduceWorkflowEvents(completedStream);
  const secondReplay = reduceWorkflowEvents(completedStream);

  assert.deepEqual(secondReplay, firstReplay);
  assert.equal(firstReplay.currentStep, "completed");
  assert.equal(firstReplay.workOrderStatus, "completed");
  assert.equal(firstReplay.markerStatus, "completed");
  assert.equal(firstReplay.personnelStatus, "confirmed");
  assert.equal(firstReplay.completedTargetCount, 1);
  assert.equal(firstReplay.evidence.length, 2);
});

test("duplicate event id or deduplication key is idempotent", () => {
  const problem = event("PROBLEM_REPORTED", 10, { context: { module: "problem", action: "problem_reported" }, payload: { message: "Kablo uyarısı", severity: "warning" } });
  const duplicateWithNewId = { ...problem, id: "event-10-retry" };
  const state = reduceWorkflowEvents([problem, problem, duplicateWithNewId]);

  assert.equal(state.supportCount, 1);
  assert.equal(state.notifications.length, 1);
  assert.equal(state.processedEventIds.length, 1);
});

test("repository rejects events without a registered WorkOrder and deduplicates retries", () => {
  const repository = new MemoryOperationsRepository(OPERATION_WORK_ORDERS);
  const message = event("CHAT_MESSAGE", 11, { context: { module: "team", action: "chat_message" }, payload: { message: "Ekip hazır" } });
  repository.append(message);
  repository.append({ ...message, id: "event-11-retry" });
  assert.equal(repository.getEvents().length, 1);

  assert.throws(() => repository.append({ ...message, id: "event-unknown", deduplicationKey: "unknown", workOrderId: "work-order-unknown" }), /unknown WorkOrder/);
});

test("read model projects the same stream for every consumer", () => {
  const projection = projectOperationsReadModel(OPERATION_PROJECTS, OPERATION_WORK_ORDERS, completedStream);
  const replay = projectOperationsReadModel(OPERATION_PROJECTS, OPERATION_WORK_ORDERS, completedStream);

  assert.deepEqual(replay, projection);
  assert.equal(projection.workOrders[0].status, "completed");
  assert.equal(projection.projects[0].markerStatus, "completed");
  assert.equal(projection.mapMarkers[0].tone, "success");
  assert.equal(projection.personnel.active > 0, true);
});
