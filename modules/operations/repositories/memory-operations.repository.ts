import type { NewWorkOrder, WorkOrder } from "../domain/work-order";
import type { NewPersonnelRecord, PersonnelRecord } from "../domain/personnel-record";
import type { OperationEvent } from "../workflow/workflow.events";
import type { OperationsRepository, OperationsRepositoryListener } from "./operations.repository";

export class MemoryOperationsRepository implements OperationsRepository {
  private events: OperationEvent[] = [];
  private listeners = new Set<OperationsRepositoryListener>();

  private workOrders: WorkOrder[];
  private personnel: PersonnelRecord[];

  constructor(workOrders: readonly WorkOrder[] = [], personnel: readonly PersonnelRecord[] = []) {
    this.workOrders = [...workOrders];
    this.personnel = [...personnel];
  }

  getWorkOrders() {
    return this.workOrders;
  }

  createWorkOrder(input: NewWorkOrder) {
    const serial = String(this.workOrders.length + 1).padStart(6, "0");
    const workOrder: WorkOrder = {
      ...input,
      id: `work-order-alm-${serial}`,
      code: `ALM-${serial}`,
      operationType: "fiber_field_operation",
      workflowId: "chief-fiber-v1",
      attachmentIds: [],
      status: "assigned",
      assignedAt: new Date().toISOString()
    };
    if (this.workOrders.some(candidate => candidate.projectCode === workOrder.projectCode && candidate.status !== "cancelled")) throw new Error("Bu proje için aktif bir İş Emri zaten var.");
    const unknownPersonnel = workOrder.personnelIds.find(code => !this.personnel.some(record => record.personnelCode === code));
    if (unknownPersonnel) throw new Error(`İş Emri bilinmeyen personel içeriyor: ${unknownPersonnel}`);
    this.workOrders = [...this.workOrders, workOrder];
    this.emit();
    return workOrder;
  }

  getPersonnel() {
    return this.personnel;
  }

  createPersonnel(input: NewPersonnelRecord) {
    const serial = String(this.personnel.length + 1).padStart(6, "0");
    const personnelCode = `PRS${serial}` as const;
    const record: PersonnelRecord = {
      ...input,
      id: `personnel-${serial}`,
      personnelCode,
      status: "active",
      qrValue: `ALMETHER:PERSONNEL:${personnelCode}`,
      createdAt: new Date().toISOString()
    };
    this.personnel = [...this.personnel, record];
    this.emit();
    return record;
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
    this.listeners.forEach(listener => listener([...this.events]));
  }
}
