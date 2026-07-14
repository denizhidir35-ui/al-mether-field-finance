import type { OperationClockService } from "../services/operation-clock.service";
import { systemOperationClock } from "../services/operation-clock.service";
import type { NewOperationEvent, OperationEvent } from "./workflow.events";

let eventSequence = 0;

export function createOperationEvent(input: NewOperationEvent, clock: OperationClockService = systemOperationClock): OperationEvent {
  eventSequence += 1;
  const occurredAt = clock.now();
  return {
    ...input,
    id: `operation-event-${occurredAt}-${eventSequence}`,
    occurredAt,
    version: 1
  };
}
