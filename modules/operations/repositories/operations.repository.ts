import type { OperationEvent } from "../workflow/workflow.events";
import type { NewWorkOrder, WorkOrder } from "../domain/work-order";
import type { NewPersonnelRecord, PersonnelRecord } from "../domain/personnel-record";

export type OperationsRepositoryListener = (events: readonly OperationEvent[]) => void;

export interface OperationsRepository {
  getWorkOrders(): readonly WorkOrder[];
  createWorkOrder(input: NewWorkOrder): WorkOrder;
  getPersonnel(): readonly PersonnelRecord[];
  createPersonnel(input: NewPersonnelRecord): PersonnelRecord;
  findWorkOrder(workOrderId: WorkOrder["id"]): WorkOrder | undefined;
  getEvents(): readonly OperationEvent[];
  append(event: OperationEvent): void;
  appendMany(events: readonly OperationEvent[]): void;
  subscribe(listener: OperationsRepositoryListener): () => void;
}
