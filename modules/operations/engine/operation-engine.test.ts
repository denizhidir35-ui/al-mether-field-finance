import assert from "node:assert/strict";
import test from "node:test";
import { OPERATION_PROJECTS } from "../operations.data.ts";
import { projectOperationsReadModel } from "../read-model/operations-projector.ts";
import { MemoryOperationsRepository } from "../repositories/memory-operations.repository.ts";
import type { OperationEvent, OperationEventType } from "../workflow/workflow.events.ts";
import { reduceWorkflowEvents } from "../workflow/workflow.reducer.ts";

const occurredAt = "2026-07-15T09:00:00.000Z";
const setupRepository = () => {
  const repository = new MemoryOperationsRepository();
  const first = repository.createPersonnel({ displayName: "Saha Personeli 1", title: "Teknisyen" });
  const second = repository.createPersonnel({ displayName: "Saha Personeli 2", title: "Teknisyen" });
  const workOrder = repository.createWorkOrder({ customerName: "AL METHER Fiber", projectCode: "ALM-0001", chiefId: "SMTHR000001", personnelIds: [first.personnelCode, second.personnelCode], plannedStartAt: occurredAt, estimatedEndAt: "2026-08-15T15:00:00.000Z", priority: "high", targetCodes: ["TGT-0001"] });
  return { repository, first, second, workOrder };
};

const fixture = setupRepository();

function event(type: OperationEventType, sequence: number, overrides: Partial<OperationEvent> = {}): OperationEvent {
  return { id: `event-${sequence}`, type, projectCode: fixture.workOrder.projectCode, workOrderId: fixture.workOrder.id, chiefId: fixture.workOrder.chiefId, deduplicationKey: `${fixture.workOrder.id}:${type}:${sequence}`, context: { module: "workflow", action: type.toLowerCase() }, occurredAt, version: 1, ...overrides };
}

const dekaEvidence = { id: "evidence-deka-1", workOrderId: fixture.workOrder.id, stepId: "deka_photos", type: "photo" as const, requirement: "required" as const, capturedAt: occurredAt, syncStatus: "local" as const, analysisStatus: "not_requested" as const };
const streetEvidence = { ...dekaEvidence, id: "evidence-street-1", stepId: "street_photos" };
const buildingEvidence = { ...dekaEvidence, id: "evidence-building-1", stepId: "building_photos" };

const fieldStream: readonly OperationEvent[] = [
  event("PERSONNEL_QR_START", 1, { stepId: "personnel", context: { module: "personnel", action: "personnel_qr_scan" } }),
  event("PERSONNEL_QR_FINISH", 2, { stepId: "personnel", context: { module: "personnel", action: "personnel_check_in" }, payload: { personnelCode: fixture.first.personnelCode, attendanceAction: "check_in" } }),
  event("PERSONNEL_QR_START", 3, { stepId: "personnel", context: { module: "personnel", action: "personnel_qr_scan" } }),
  event("PERSONNEL_QR_FINISH", 4, { stepId: "personnel", context: { module: "personnel", action: "personnel_check_in" }, payload: { personnelCode: fixture.second.personnelCode, attendanceAction: "check_in" } }),
  event("PHOTO_CAPTURED", 5, { stepId: "deka_photos", context: { module: "workflow", action: "photo_captured" }, payload: { evidence: dekaEvidence } }),
  event("CHECKPOINT_CONFIRMED", 6, { stepId: "parcel", context: { module: "deka", action: "parcel_selected" }, payload: { fieldValue: "Ada 85 / Parsel 12" } }),
  event("CHECKPOINT_CONFIRMED", 7, { stepId: "street", context: { module: "deka", action: "street_selected" }, payload: { fieldValue: "1720 Sokak" } }),
  ...[1, 2, 3, 4].map(index => event("PHOTO_CAPTURED", 7 + index, { stepId: "street_photos", context: { module: "workflow", action: "photo_captured" }, payload: { evidence: { ...streetEvidence, id: `evidence-street-${index}` } } })),
  event("CHECKPOINT_CONFIRMED", 12, { stepId: "buildings", context: { module: "deka", action: "buildings_selected" }, payload: { fieldValue: "12, 14" } }),
  event("PHOTO_CAPTURED", 13, { stepId: "building_photos", context: { module: "workflow", action: "photo_captured" }, payload: { evidence: buildingEvidence } }),
  event("PROBLEM_REPORTED", 14, { context: { module: "problem", action: "problem_reported" }, payload: { message: "Saha problemi", severity: "warning" } }),
  event("CHAT_MESSAGE", 15, { context: { module: "team", action: "chat_message" }, payload: { message: "Ekip saha kaydını tamamladı" } }),
  event("DELIVERY_CONFIRMED", 16, { stepId: "delivery" }),
  event("WORKFLOW_COMPLETED", 17, { stepId: "completed" })
];

test("CEO creates the real WorkOrder root with permanent personnel identities", () => {
  assert.equal(fixture.workOrder.code, "ALM-000001");
  assert.deepEqual(fixture.workOrder.personnelIds, ["PMTHR000001", "PMTHR000002"]);
  assert.equal(fixture.first.qrValue, "ALMETHER:PERSONNEL:PMTHR000001:V1");
  assert.equal(fixture.repository.getWorkOrders().length, 1);
});

test("canonical QR compatibility projects check-in and check-out without new event names", () => {
  const checkedIn = reduceWorkflowEvents(fieldStream.slice(0, 4));
  assert.deepEqual(checkedIn.activePersonnelCodes, ["PMTHR000001", "PMTHR000002"]);
  assert.equal(checkedIn.activePersonnelCount, 2);
  const checkedOut = reduceWorkflowEvents([...fieldStream.slice(0, 4), event("PERSONNEL_QR_START", 20), event("PERSONNEL_QR_FINISH", 21, { payload: { personnelCode: fixture.first.personnelCode, attendanceAction: "check_out" }, context: { module: "personnel", action: "personnel_check_out" } })]);
  assert.deepEqual(checkedOut.activePersonnelCodes, ["PMTHR000002"]);
  assert.equal(checkedOut.activePersonnelCount, 1);
});

test("Chief reads the assigned WorkOrder and personnel QR reaches the repository projection", () => {
  const { repository, workOrder } = setupRepository();
  const assignedToChief = repository.getWorkOrders().find(candidate =>
    candidate.chiefId === "SMTHR000001" && (candidate.status === "assigned" || candidate.status === "active"),
  );
  assert.equal(assignedToChief?.id, workOrder.id);
  assert.deepEqual(assignedToChief?.personnelIds, ["PMTHR000001", "PMTHR000002"]);

  repository.appendMany(fieldStream.slice(0, 2));
  const readModel = projectOperationsReadModel(
    OPERATION_PROJECTS,
    repository.getWorkOrders(),
    repository.getEvents(),
    repository.getPersonnel(),
  );

  assert.equal(repository.getEvents().length, 2);
  assert.equal(readModel.workOrderStates[workOrder.id].activePersonnelCount, 1);
  assert.deepEqual(readModel.workOrderStates[workOrder.id].activePersonnelCodes, ["PMTHR000001"]);
  assert.equal(readModel.personnel.active, 1);
  assert.equal(readModel.workOrders[0].chiefId, "SMTHR000001");
});

test("full field scenario replays deterministically into the CEO read model", () => {
  const firstReplay = projectOperationsReadModel(OPERATION_PROJECTS, fixture.repository.getWorkOrders(), fieldStream, fixture.repository.getPersonnel());
  const secondReplay = projectOperationsReadModel(OPERATION_PROJECTS, fixture.repository.getWorkOrders(), fieldStream, fixture.repository.getPersonnel());
  assert.deepEqual(secondReplay, firstReplay);
  assert.equal(firstReplay.workOrders[0].status, "completed");
  assert.equal(firstReplay.personnel.active, 2);
  assert.equal(firstReplay.problems.open, 1);
  assert.equal(firstReplay.projects[0].photoCount, 6);
  assert.equal(firstReplay.projects[0].completedTargetCount, 1);
  assert.equal(firstReplay.mapMarkers[0].tone, "success");
  assert.equal(firstReplay.latestPhoto?.id, "evidence-building-1");
  assert.equal(firstReplay.workOrderStates[fixture.workOrder.id].parcelReference, "Ada 85 / Parsel 12");
  assert.equal(firstReplay.workOrderStates[fixture.workOrder.id].streetName, "1720 Sokak");
  assert.deepEqual(firstReplay.workOrderStates[fixture.workOrder.id].buildingReferences, ["12", "14"]);
  assert.deepEqual(firstReplay.workOrderStates[fixture.workOrder.id].completedSteps, ["personnel", "deka_photos", "parcel", "street", "street_photos", "buildings", "building_photos", "delivery"]);
  assert.equal(fieldStream.some(item => item.type === "TARGET_SELECTED"), false);
});

test("repository rejects unknown WorkOrders and deduplicates event retries", () => {
  const repository = setupRepository().repository;
  const message = event("CHAT_MESSAGE", 30, { context: { module: "team", action: "chat_message" } });
  repository.append(message);
  repository.append({ ...message, id: "event-30-retry" });
  assert.equal(repository.getEvents().length, 1);
  assert.throws(() => repository.append({ ...message, id: "event-unknown", deduplicationKey: "unknown", workOrderId: "work-order-unknown" }), /unknown WorkOrder/);
});

test("HR lifecycle preserves immutable platform identity and never deletes personnel", () => {
  const repository = new MemoryOperationsRepository();
  const personnel = repository.createPersonnel({ displayName: "İlk Ad", title: "Teknisyen" });
  const updated = repository.updatePersonnel(personnel.id, { displayName: "Yeni Ad" });
  const passive = repository.setPersonnelStatus(personnel.id, "passive");
  assert.throws(() => repository.createWorkOrder({
    customerName: "AL METHER Fiber",
    projectCode: "ALM-0001",
    chiefId: "SMTHR000001",
    personnelIds: [personnel.personnelCode],
    plannedStartAt: occurredAt,
    estimatedEndAt: "2026-08-15T15:00:00.000Z",
    priority: "normal",
    targetCodes: ["TGT-0001"]
  }), /aktif olmayan personel/);
  const renewed = repository.regeneratePersonnelQr(personnel.id);
  const archived = repository.setPersonnelStatus(personnel.id, "archived");
  assert.equal(updated.personnelCode, personnel.personnelCode);
  assert.equal(passive.personnelCode, personnel.personnelCode);
  assert.equal(renewed.personnelCode, personnel.personnelCode);
  assert.equal(renewed.qrVersion, 2);
  assert.equal(archived.status, "archived");
  assert.equal(repository.getPersonnel().length, 1);
});
