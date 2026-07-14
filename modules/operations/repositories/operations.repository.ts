import type { OperationEvent } from "../workflow/workflow.events";

export type OperationsRepositoryListener = (events: readonly OperationEvent[]) => void;

export interface OperationsRepository {
  getEvents(): readonly OperationEvent[];
  append(event: OperationEvent): void;
  appendMany(events: readonly OperationEvent[]): void;
  subscribe(listener: OperationsRepositoryListener): () => void;
}
