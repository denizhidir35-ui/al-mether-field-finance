import type { NewWorkOrder, WorkOrder } from "../domain/work-order";
import type { NewPersonnelRecord, PersonnelRecord, PersonnelRecordUpdate } from "../domain/personnel-record";
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
    const unavailablePersonnel = workOrder.personnelIds.find(code =>
      !this.personnel.some(record => record.personnelCode === code && record.status === "active"),
    );
    if (unavailablePersonnel) throw new Error(`İş Emri aktif olmayan personel içeriyor: ${unavailablePersonnel}`);
    this.workOrders = [...this.workOrders, workOrder];
    this.emit();
    return workOrder;
  }

  getPersonnel() {
    return this.personnel;
  }

  createPersonnel(input: NewPersonnelRecord) {
    const serial = String(this.personnel.length + 1).padStart(6, "0");
    const personnelCode = `PMTHR${serial}` as const;
    const now = new Date().toISOString();
    const record: PersonnelRecord = {
      ...input,
      id: `personnel-${serial}`,
      personnelCode,
      status: "active",
      qrValue: `ALMETHER:PERSONNEL:${personnelCode}:V1`,
      qrVersion: 1,
      createdAt: now,
      updatedAt: now,
      documents: [],
      certificates: [],
      trainings: [],
      signatures: [],
      performanceRecords: [],
      authorizations: []
    };
    this.personnel = [...this.personnel, record];
    this.emit();
    return record;
  }

  updatePersonnel(id: PersonnelRecord["id"], input: PersonnelRecordUpdate) {
    return this.replacePersonnel(id, record => ({
      ...record,
      ...input,
      displayName: input.displayName?.trim() || record.displayName,
      title: input.title?.trim() || record.title,
      updatedAt: new Date().toISOString()
    }));
  }

  setPersonnelStatus(id: PersonnelRecord["id"], status: PersonnelRecord["status"]) {
    return this.replacePersonnel(id, record => ({ ...record, status, updatedAt: new Date().toISOString() }));
  }

  regeneratePersonnelQr(id: PersonnelRecord["id"]) {
    return this.replacePersonnel(id, record => {
      const qrVersion = record.qrVersion + 1;
      return { ...record, qrVersion, qrValue: `ALMETHER:PERSONNEL:${record.personnelCode}:V${qrVersion}`, updatedAt: new Date().toISOString() };
    });
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

  private replacePersonnel(id: PersonnelRecord["id"], update: (record: PersonnelRecord) => PersonnelRecord) {
    const current = this.personnel.find(record => record.id === id);
    if (!current) throw new Error(`Personel bulunamadı: ${id}`);
    const next = update(current);
    this.personnel = this.personnel.map(record => record.id === id ? next : record);
    this.emit();
    return next;
  }
}
