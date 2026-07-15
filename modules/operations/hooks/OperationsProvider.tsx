"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { OPERATION_PERSONNEL, OPERATION_PROJECTS, OPERATION_WORK_ORDERS } from "../operations.data";
import type { NewPersonnelRecord, PersonnelRecord, PersonnelRecordUpdate } from "../domain/personnel-record";
import type { NewWorkOrder } from "../domain/work-order";
import { projectOperationsReadModel } from "../read-model/operations-projector";
import type { OperationsReadModel } from "../read-model/operations-read-model";
import { MemoryOperationsRepository } from "../repositories/memory-operations.repository";
import type { OperationsRepository } from "../repositories/operations.repository";
import type { NewOperationEvent, OperationEvent } from "../workflow/workflow.events";
import { createOperationEvent } from "../workflow/workflow.engine";

type OperationsContextValue = {
  events: readonly OperationEvent[];
  readModel: OperationsReadModel;
  repository: OperationsRepository;
  dispatch: (event: NewOperationEvent) => void;
  dispatchMany: (events: readonly NewOperationEvent[]) => void;
  createPersonnel: (input: NewPersonnelRecord) => void;
  updatePersonnel: (id: PersonnelRecord["id"], input: PersonnelRecordUpdate) => void;
  setPersonnelStatus: (id: PersonnelRecord["id"], status: PersonnelRecord["status"]) => void;
  regeneratePersonnelQr: (id: PersonnelRecord["id"]) => void;
  createWorkOrder: (input: NewWorkOrder) => void;
};

const OperationsContext = createContext<OperationsContextValue | null>(null);

export function OperationsProvider({ children }: { children: ReactNode }) {
  const repository: OperationsRepository = useMemo(() => new MemoryOperationsRepository(OPERATION_WORK_ORDERS, OPERATION_PERSONNEL), []);
  const [events, setEvents] = useState<readonly OperationEvent[]>(repository.getEvents());

  useEffect(() => repository.subscribe(setEvents), [repository]);

  const value = useMemo<OperationsContextValue>(() => ({
    events,
    readModel: projectOperationsReadModel(OPERATION_PROJECTS, repository.getWorkOrders(), events, repository.getPersonnel()),
    repository,
    dispatch: event => repository.append(createOperationEvent(event)),
    dispatchMany: nextEvents => repository.appendMany(nextEvents.map(event => createOperationEvent(event))),
    createPersonnel: input => { repository.createPersonnel(input); },
    updatePersonnel: (id, input) => { repository.updatePersonnel(id, input); },
    setPersonnelStatus: (id, status) => { repository.setPersonnelStatus(id, status); },
    regeneratePersonnelQr: id => { repository.regeneratePersonnelQr(id); },
    createWorkOrder: input => { repository.createWorkOrder(input); }
  }), [events, repository]);

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useOperationsContext() {
  const context = useContext(OperationsContext);
  if (!context) throw new Error("useOperationsContext must be used within OperationsProvider");
  return context;
}
