import type { OperationEvent } from "../workflow/workflow.events";
import type { NewWorkOrder, WorkOrder } from "../domain/work-order";
import type { NewPersonnelRecord, PersonnelRecord, PersonnelRecordUpdate } from "../domain/personnel-record";

export type OperationsRepositoryListener = (events: readonly OperationEvent[]) => void;

export interface OperationsRepository {
  getWorkOrders(): readonly WorkOrder[];
  createWorkOrder(input: NewWorkOrder): WorkOrder;
  getPersonnel(): readonly PersonnelRecord[];
  createPersonnel(input: NewPersonnelRecord): PersonnelRecord;
  updatePersonnel(id: PersonnelRecord["id"], input: PersonnelRecordUpdate): PersonnelRecord;
  setPersonnelStatus(id: PersonnelRecord["id"], status: PersonnelRecord["status"]): PersonnelRecord;
  regeneratePersonnelQr(id: PersonnelRecord["id"]): PersonnelRecord;
  findWorkOrder(workOrderId: WorkOrder["id"]): WorkOrder | undefined;
  getEvents(): readonly OperationEvent[];
  append(event: OperationEvent): void;
  appendMany(events: readonly OperationEvent[]): void;
  subscribe(listener: OperationsRepositoryListener): () => void;
}
