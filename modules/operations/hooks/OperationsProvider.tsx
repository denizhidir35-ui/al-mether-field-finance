"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "@/core/supabase/client";
import { OPERATION_PERSONNEL, OPERATION_PROJECTS, OPERATION_WORK_ORDERS } from "../operations.data";
import type { NewPersonnelRecord, PersonnelRecord, PersonnelRecordUpdate } from "../domain/personnel-record";
import type { NewWorkOrder } from "../domain/work-order";
import { projectOperationsReadModel } from "../read-model/operations-projector";
import type { OperationsReadModel } from "../read-model/operations-read-model";
import { MemoryOperationsRepository } from "../repositories/memory-operations.repository";
import type { OperationsRepository } from "../repositories/operations.repository";
import { SupabaseOperationsRepository } from "../repositories/supabase-operations.repository";
import type { NewOperationEvent, OperationEvent } from "../workflow/workflow.events";
import { createOperationEvent } from "../workflow/workflow.engine";

type OperationsContextValue = {
  events: readonly OperationEvent[];
  hydrated: boolean;
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
  const repository: OperationsRepository = useMemo(() => {
    if (process.env.NODE_ENV === "development") return new MemoryOperationsRepository(OPERATION_WORK_ORDERS, OPERATION_PERSONNEL);
    if (!isSupabaseConfigured || !supabase) throw new Error("Production Operations repository Supabase yap\u0131land\u0131rmas\u0131 gerektirir.");
    return new SupabaseOperationsRepository(supabase);
  }, []);
  const [events, setEvents] = useState<readonly OperationEvent[]>(repository.getEvents());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => repository.subscribe(nextEvents => {
    setEvents(nextEvents);
    setHydrated(true);
  }), [repository]);

  const value = useMemo<OperationsContextValue>(() => ({
    events,
    hydrated,
    readModel: projectOperationsReadModel(OPERATION_PROJECTS, repository.getWorkOrders(), events, repository.getPersonnel()),
    repository,
    dispatch: event => repository.append(createOperationEvent(event)),
    dispatchMany: nextEvents => repository.appendMany(nextEvents.map(event => createOperationEvent(event))),
    createPersonnel: input => { repository.createPersonnel(input); },
    updatePersonnel: (id, input) => { repository.updatePersonnel(id, input); },
    setPersonnelStatus: (id, status) => { repository.setPersonnelStatus(id, status); },
    regeneratePersonnelQr: id => { repository.regeneratePersonnelQr(id); },
    createWorkOrder: input => { repository.createWorkOrder(input); }
  }), [events, hydrated, repository]);

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useOperationsContext() {
  const context = useContext(OperationsContext);
  if (!context) throw new Error("useOperationsContext must be used within OperationsProvider");
  return context;
}
