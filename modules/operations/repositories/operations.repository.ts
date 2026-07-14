import type { OperationEvent } from "../workflow/workflow.events";
import type { WorkOrder } from "../domain/work-order";

export type OperationsRepositoryListener = (events: readonly OperationEvent[]) => void;

export interface OperationsRepository {
  getWorkOrders(): readonly WorkOrder[];
  findWorkOrder(workOrderId: WorkOrder["id"]): WorkOrder | undefined;
  getEvents(): readonly OperationEvent[];
  append(event: OperationEvent): void;
  appendMany(events: readonly OperationEvent[]): void;
  subscribe(listener: OperationsRepositoryListener): () => void;
}
