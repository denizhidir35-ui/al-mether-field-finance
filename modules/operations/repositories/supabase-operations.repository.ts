import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { FieldPersonnelCode, ProjectCode, TargetCode, WorkOrderCode, WorkOrderId } from "../domain/identifiers";
import type { NewPersonnelRecord, PersonnelRecord, PersonnelRecordUpdate } from "../domain/personnel-record";
import type { NewWorkOrder, WorkOrder, WorkOrderPriority, WorkOrderStatus } from "../domain/work-order";
import type { OperationEvent, OperationEventModule, OperationEventType } from "../workflow/workflow.events";
import type { OperationsRepository, OperationsRepositoryListener } from "./operations.repository";

type ProjectRow = {
  id: string;
  company_id: string;
  project_number: string;
  customer: string;
  title: string;
  description: string;
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
};

type WorkOrderRow = {
  id: string;
  code: string;
  customer: string;
  project_code: string;
  assigned_chief_id: string;
  assigned_personnel_ids: string[];
  operation_type: string;
  workflow_id: string;
  target_codes: string[];
  planned_start_at: string;
  estimated_end_at: string;
  priority: string;
  attachment_ids: string[];
  status: string;
  created_at: string;
  started_at: string | null;
  closed_at: string | null;
};

type PersonnelRow = {
  id: string;
  personnel_code: string;
  display_name: string;
  title: string;
  assigned_chief_code: string | null;
  status: string;
  qr_value: string;
  qr_version: number;
  created_at: string;
  updated_at: string;
  documents: string[];
  certificates: string[];
  trainings: string[];
  signatures: string[];
  performance_records: string[];
  authorizations: string[];
};

type EventRow = {
  id: string;
  event_type: string;
  project_code: string;
  work_order_id: string;
  chief_id: string;
  deduplication_key: string;
  target_code: string | null;
  step_id: string | null;
  context: { module: string; action: string };
  payload: OperationEvent["payload"] | null;
  occurred_at: string;
  version: number;
  sequence: number;
};

function randomSerial() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(values[0] % 1_000_000).padStart(6, "0");
}

function mapWorkOrder(row: WorkOrderRow): WorkOrder {
  return {
    id: row.id as WorkOrderId,
    code: row.code as WorkOrderCode,
    customerName: row.customer,
    projectCode: row.project_code as ProjectCode,
    operationType: row.operation_type,
    chiefId: row.assigned_chief_id,
    personnelIds: row.assigned_personnel_ids as FieldPersonnelCode[],
    workflowId: row.workflow_id,
    targetCodes: row.target_codes as TargetCode[],
    plannedStartAt: row.planned_start_at,
    estimatedEndAt: row.estimated_end_at,
    priority: row.priority as WorkOrderPriority,
    attachmentIds: row.attachment_ids,
    status: row.status as WorkOrderStatus,
    assignedAt: row.created_at,
    startedAt: row.started_at ?? undefined,
    completedAt: row.closed_at ?? undefined,
  };
}

function mapPersonnel(row: PersonnelRow): PersonnelRecord {
  return {
    id: row.id as PersonnelRecord["id"],
    personnelCode: row.personnel_code as FieldPersonnelCode,
    displayName: row.display_name,
    title: row.title,
    assignedChiefCode: row.assigned_chief_code ?? undefined,
    status: row.status.toLowerCase() as PersonnelRecord["status"],
    qrValue: row.qr_value,
    qrVersion: row.qr_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    documents: row.documents,
    certificates: row.certificates,
    trainings: row.trainings,
    signatures: row.signatures,
    performanceRecords: row.performance_records,
    authorizations: row.authorizations,
  };
}

function mapEvent(row: EventRow): OperationEvent {
  return {
    id: row.id,
    type: row.event_type as OperationEventType,
    projectCode: row.project_code as ProjectCode,
    workOrderId: row.work_order_id as WorkOrderId,
    chiefId: row.chief_id,
    deduplicationKey: row.deduplication_key,
    targetCode: row.target_code as TargetCode | undefined,
    stepId: row.step_id as OperationEvent["stepId"],
    context: { module: row.context.module as OperationEventModule, action: row.context.action },
    payload: row.payload ?? undefined,
    occurredAt: row.occurred_at,
    version: 1,
  };
}

export class SupabaseOperationsRepository implements OperationsRepository {
  private workOrders: WorkOrder[] = [];
  private personnel: PersonnelRecord[] = [];
  private events: OperationEvent[] = [];
  private projects = new Map<ProjectCode, ProjectRow>();
  private listeners = new Set<OperationsRepositoryListener>();
  private channel: RealtimeChannel | null = null;
  private authSubscription: { unsubscribe: () => void } | null = null;
  private initialization: Promise<void> | null = null;
  private companyId = "";
  private userId = "";

  constructor(private readonly client: SupabaseClient) {}

  getWorkOrders() { return this.workOrders; }

  createWorkOrder(input: NewWorkOrder) {
    const project = this.projects.get(input.projectCode);
    if (!project) throw new Error(`Proje Supabase repository i\u00e7inde bulunamad\u0131: ${input.projectCode}`);
    if (!this.companyId || !this.userId) throw new Error("Operations repository hen\u00fcz hydrate edilmedi.");
    if (this.workOrders.some(candidate => candidate.projectCode === input.projectCode && candidate.status !== "cancelled")) {
      throw new Error("Bu proje i\u00e7in aktif bir \u0130\u015f Emri zaten var.");
    }
    const unavailablePersonnel = input.personnelIds.find(code => !this.personnel.some(record => record.personnelCode === code && record.status === "active"));
    if (unavailablePersonnel) throw new Error(`\u0130\u015f Emri aktif olmayan personel i\u00e7eriyor: ${unavailablePersonnel}`);

    const assignedAt = new Date().toISOString();
    const workOrder: WorkOrder = {
      ...input,
      id: `work-order-${crypto.randomUUID()}`,
      code: `ALM-${randomSerial()}`,
      operationType: "fiber_field_operation",
      workflowId: "chief-fiber-v1",
      attachmentIds: [],
      status: "assigned",
      assignedAt,
    };
    this.workOrders = [...this.workOrders, workOrder];
    this.emit();

    void this.client.from("work_orders").insert({
      id: workOrder.id,
      company_id: this.companyId,
      code: workOrder.code,
      project_id: project.id,
      project_code: input.projectCode,
      project_number: project.project_number,
      customer: input.customerName,
      title: project.title,
      description: project.description,
      address: project.address,
      city: project.city,
      district: project.district,
      latitude: project.latitude,
      longitude: project.longitude,
      assigned_chief_id: input.chiefId,
      assigned_personnel_ids: input.personnelIds,
      operation_type: workOrder.operationType,
      workflow_id: workOrder.workflowId,
      target_codes: input.targetCodes,
      priority: input.priority,
      status: workOrder.status,
      attachment_ids: [],
      planned_start_at: input.plannedStartAt,
      estimated_end_at: input.estimatedEndAt,
      created_by: this.userId,
      created_at: assignedAt,
    }).then(({ error }) => {
      if (!error) return;
      this.workOrders = this.workOrders.filter(candidate => candidate.id !== workOrder.id);
      this.emit();
      console.error("Supabase WorkOrder insert failed", error.message);
    });
    return workOrder;
  }

  getPersonnel() { return this.personnel; }

  createPersonnel(input: NewPersonnelRecord) {
    if (!this.companyId || !this.userId) throw new Error("Operations repository hen\u00fcz hydrate edilmedi.");
    const personnelCode = `PMTHR${randomSerial()}` as FieldPersonnelCode;
    const now = new Date().toISOString();
    const record: PersonnelRecord = {
      ...input,
      id: `personnel-${crypto.randomUUID()}`,
      personnelCode,
      status: "active",
      qrValue: `ALMETHER:PERSONNEL:${personnelCode}:V1`,
      qrVersion: 1,
      createdAt: now,
      updatedAt: now,
      documents: [], certificates: [], trainings: [], signatures: [], performanceRecords: [], authorizations: [],
    };
    this.personnel = [...this.personnel, record];
    this.emit();
    void this.persistPersonnel(record, true);
    return record;
  }

  updatePersonnel(id: PersonnelRecord["id"], input: PersonnelRecordUpdate) {
    return this.replacePersonnel(id, record => ({
      ...record,
      ...input,
      displayName: input.displayName?.trim() || record.displayName,
      title: input.title?.trim() || record.title,
      updatedAt: new Date().toISOString(),
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

  findWorkOrder(workOrderId: WorkOrder["id"]) { return this.workOrders.find(workOrder => workOrder.id === workOrderId); }
  getEvents() { return this.events; }

  append(event: OperationEvent) {
    if (!this.findWorkOrder(event.workOrderId)) throw new Error(`Operation event rejected: unknown WorkOrder ${event.workOrderId}`);
    if (this.events.some(existing => existing.id === event.id || existing.deduplicationKey === event.deduplicationKey)) return;
    this.events = [...this.events, event];
    this.emit();
    void this.persistEvents([event]);
  }

  appendMany(events: readonly OperationEvent[]) {
    events.forEach(event => {
      if (!this.findWorkOrder(event.workOrderId)) throw new Error(`Operation event rejected: unknown WorkOrder ${event.workOrderId}`);
    });
    const uniqueEvents = events.filter(event => !this.events.some(existing => existing.id === event.id || existing.deduplicationKey === event.deduplicationKey));
    if (uniqueEvents.length === 0) return;
    this.events = [...this.events, ...uniqueEvents];
    this.emit();
    void this.persistEvents(uniqueEvents);
  }

  subscribe(listener: OperationsRepositoryListener) {
    this.listeners.add(listener);
    void this.initialize();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stopRealtime();
        this.authSubscription?.unsubscribe();
        this.authSubscription = null;
        this.initialization = null;
      }
    };
  }

  private initialize() {
    if (this.initialization) return this.initialization;
    this.initialization = this.hydrate().then(() => {
      if (this.listeners.size > 0) this.startRealtime();
      this.emit();
    }).catch(error => {
      console.error("Supabase Operations hydration failed", error instanceof Error ? error.message : error);
      this.emit();
    });
    if (!this.authSubscription) {
      const { data } = this.client.auth.onAuthStateChange(event => {
        if (event === "SIGNED_OUT") {
          this.companyId = "";
          this.userId = "";
          this.workOrders = [];
          this.personnel = [];
          this.events = [];
          this.projects.clear();
          this.stopRealtime();
          this.emit();
        }
        if (event === "SIGNED_IN") {
          this.initialization = null;
          void this.initialize();
        }
      });
      this.authSubscription = data.subscription;
    }
    return this.initialization;
  }

  private async hydrate() {
    const { data: authData, error: authError } = await this.client.auth.getUser();
    if (authError) throw authError;
    if (!authData.user) return;
    const { data: profile, error: profileError } = await this.client.from("profiles").select("company_id").eq("id", authData.user.id).eq("status", "ACTIVE").maybeSingle();
    if (profileError) throw profileError;
    if (!profile) throw new Error("Aktif Operations profili bulunamad\u0131.");
    this.userId = authData.user.id;
    this.companyId = String(profile.company_id);

    const [projectsResult, workOrdersResult, personnelResult, eventsResult] = await Promise.all([
      this.client.from("projects").select("id,company_id,project_number,customer,title,description,address,city,district,latitude,longitude").order("project_number"),
      this.client.from("work_orders").select("id,code,customer,project_code,assigned_chief_id,assigned_personnel_ids,operation_type,workflow_id,target_codes,planned_start_at,estimated_end_at,priority,attachment_ids,status,created_at,started_at,closed_at").order("created_at"),
      this.client.from("operation_personnel").select("id,personnel_code,display_name,title,assigned_chief_code,status,qr_value,qr_version,created_at,updated_at,documents,certificates,trainings,signatures,performance_records,authorizations").order("personnel_code"),
      this.client.from("operation_events").select("id,event_type,project_code,work_order_id,chief_id,deduplication_key,target_code,step_id,context,payload,occurred_at,version,sequence").order("sequence"),
    ]);
    const failure = [projectsResult.error, workOrdersResult.error, personnelResult.error, eventsResult.error].find(Boolean);
    if (failure) throw failure;
    this.projects = new Map((projectsResult.data as ProjectRow[]).map(project => [project.project_number as ProjectCode, project]));
    this.workOrders = (workOrdersResult.data as WorkOrderRow[]).map(mapWorkOrder);
    this.personnel = (personnelResult.data as PersonnelRow[]).map(mapPersonnel);
    this.events = (eventsResult.data as EventRow[]).map(mapEvent);
  }

  private startRealtime() {
    if (!this.companyId || this.channel) return;
    this.channel = this.client.channel(`operations:${this.companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "work_orders", filter: `company_id=eq.${this.companyId}` }, () => { void this.refreshAndEmit(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "operation_personnel", filter: `company_id=eq.${this.companyId}` }, () => { void this.refreshAndEmit(); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "operation_events", filter: `company_id=eq.${this.companyId}` }, () => { void this.refreshAndEmit(); })
      .subscribe();
  }

  private stopRealtime() {
    if (!this.channel) return;
    void this.client.removeChannel(this.channel);
    this.channel = null;
  }

  private async refreshAndEmit() {
    try {
      await this.hydrate();
      this.emit();
    } catch (error) {
      console.error("Supabase Operations realtime hydration failed", error instanceof Error ? error.message : error);
    }
  }

  private emit() { this.listeners.forEach(listener => listener([...this.events])); }

  private replacePersonnel(id: PersonnelRecord["id"], update: (record: PersonnelRecord) => PersonnelRecord) {
    const current = this.personnel.find(record => record.id === id);
    if (!current) throw new Error(`Personel bulunamad\u0131: ${id}`);
    const next = update(current);
    this.personnel = this.personnel.map(record => record.id === id ? next : record);
    this.emit();
    void this.persistPersonnel(next, false);
    return next;
  }

  private async persistPersonnel(record: PersonnelRecord, insert: boolean) {
    const row = {
      id: record.id,
      company_id: this.companyId,
      personnel_code: record.personnelCode,
      display_name: record.displayName,
      title: record.title,
      status: record.status.toUpperCase(),
      qr_value: record.qrValue,
      qr_version: record.qrVersion,
      documents: record.documents,
      certificates: record.certificates,
      trainings: record.trainings,
      signatures: record.signatures,
      performance_records: record.performanceRecords,
      authorizations: record.authorizations,
      created_by: this.userId,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
    const result = insert ? await this.client.from("operation_personnel").insert(row) : await this.client.from("operation_personnel").update(row).eq("id", record.id);
    if (result.error) {
      console.error("Supabase personnel persistence failed", result.error.message);
      await this.refreshAndEmit();
    }
  }

  private async persistEvents(events: readonly OperationEvent[]) {
    const rows = events.map(event => ({
      id: event.id,
      company_id: this.companyId,
      work_order_id: event.workOrderId,
      project_code: event.projectCode,
      chief_id: event.chiefId,
      event_type: event.type,
      payload: event.payload ?? {},
      context: event.context,
      target_code: event.targetCode ?? null,
      step_id: event.stepId ?? null,
      deduplication_key: event.deduplicationKey,
      created_by: this.userId,
      occurred_at: event.occurredAt,
      version: event.version,
    }));
    const { error } = await this.client.from("operation_events").insert(rows);
    if (!error) return;
    if (error.code !== "23505") console.error("Supabase operation event append failed", error.message);
    await this.refreshAndEmit();
  }
}
