import type { WorkOrder } from "../domain/work-order";
import type { OperationEvent } from "../workflow/workflow.events";
import type { OperationsRepository, OperationsRepositoryListener } from "./operations.repository";

export class MemoryOperationsRepository implements OperationsRepository {
  private events: OperationEvent[] = [];
  private listeners = new Set<OperationsRepositoryListener>();

  constructor(private readonly workOrders: readonly WorkOrder[]) {}

  getWorkOrders() {
    return this.workOrders;
  }

  findWorkOrder(workOrderId: WorkOrder["id"]) {
    return this.workOrders.find(workOrder => workOrder.id === workOrderId);
  }

  getEvents() {
    return this.events;
  }

  append(event: OperationEvent) {
    this.assertWorkOrder(event);
    if (this.isDuplicate(event)) return;
    this.events = [...this.events, event];
    this.emit();
  }

  appendMany(events: readonly OperationEvent[]) {
    events.forEach(event => this.assertWorkOrder(event));
    const uniqueEvents = events.filter(event => !this.isDuplicate(event));
    if (uniqueEvents.length === 0) return;
    this.events = [...this.events, ...uniqueEvents];
    this.emit();
  }

  subscribe(listener: OperationsRepositoryListener) {
    this.listeners.add(listener);
    listener(this.events);
    return () => { this.listeners.delete(listener); };
  }

  private assertWorkOrder(event: OperationEvent) {
    if (!this.findWorkOrder(event.workOrderId)) throw new Error(`Operation event rejected: unknown WorkOrder ${event.workOrderId}`);
  }

  private isDuplicate(event: OperationEvent) {
    return this.events.some(existing => existing.id === event.id || existing.deduplicationKey === event.deduplicationKey);
  }

  private emit() {
    this.listeners.forEach(listener => listener(this.events));
  }
}
