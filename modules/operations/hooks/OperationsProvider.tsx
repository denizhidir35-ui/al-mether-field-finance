"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { OPERATION_PROJECTS } from "../operations.data";
import { projectOperationsReadModel } from "../read-model/operations-projector";
import type { OperationsReadModel } from "../read-model/operations-read-model";
import { operationsMemoryRepository } from "../repositories/memory-operations.repository";
import type { OperationsRepository } from "../repositories/operations.repository";
import type { NewOperationEvent, OperationEvent } from "../workflow/workflow.events";
import { createOperationEvent } from "../workflow/workflow.engine";

type OperationsContextValue = {
  events: readonly OperationEvent[];
  readModel: OperationsReadModel;
  repository: OperationsRepository;
  dispatch: (event: NewOperationEvent) => void;
  dispatchMany: (events: readonly NewOperationEvent[]) => void;
};

const OperationsContext = createContext<OperationsContextValue | null>(null);

export function OperationsProvider({ children }: { children: ReactNode }) {
  const repository: OperationsRepository = operationsMemoryRepository;
  const [events, setEvents] = useState<readonly OperationEvent[]>(repository.getEvents());

  useEffect(() => repository.subscribe(setEvents), [repository]);

  const value = useMemo<OperationsContextValue>(() => ({
    events,
    readModel: projectOperationsReadModel(OPERATION_PROJECTS, events),
    repository,
    dispatch: event => repository.append(createOperationEvent(event)),
    dispatchMany: nextEvents => repository.appendMany(nextEvents.map(event => createOperationEvent(event)))
  }), [events, repository]);

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useOperationsContext() {
  const context = useContext(OperationsContext);
  if (!context) throw new Error("useOperationsContext must be used within OperationsProvider");
  return context;
}
