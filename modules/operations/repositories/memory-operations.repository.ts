import type { OperationEvent } from "../workflow/workflow.events";
import type { OperationsRepository, OperationsRepositoryListener } from "./operations.repository";

export class MemoryOperationsRepository implements OperationsRepository {
  private events: OperationEvent[] = [];
  private listeners = new Set<OperationsRepositoryListener>();

  getEvents() {
    return this.events;
  }

  append(event: OperationEvent) {
    this.events = [...this.events, event];
    this.emit();
  }

  appendMany(events: readonly OperationEvent[]) {
    this.events = [...this.events, ...events];
    this.emit();
  }

  subscribe(listener: OperationsRepositoryListener) {
    this.listeners.add(listener);
    listener(this.events);
    return () => { this.listeners.delete(listener); };
  }

  private emit() {
    this.listeners.forEach(listener => listener(this.events));
  }
}

export const operationsMemoryRepository = new MemoryOperationsRepository();
