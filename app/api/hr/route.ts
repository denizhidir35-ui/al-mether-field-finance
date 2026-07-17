import { NextRequest, NextResponse } from "next/server";
import { requireWorkforceManager } from "@/core/workforce/server";
import type { HrFoundationSnapshot } from "@/modules/workforce/domain/hr-foundation";
import { reduceHrProjection, type HrProjectionEnvelope, type HrProjectionEvent } from "@/modules/workforce/services/hr-reducer";

type Context = Awaited<ReturnType<typeof requireWorkforceManager>>;

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "HR işlemi tamamlanamadı.";
  return NextResponse.json({ error: message }, { status });
}

function required(value: unknown, label: string) {
  const result = typeof value === "string" ? value.trim() : "";
  if (!result) throw new Error(`${label} zorunludur.`);
  return result;
}

function codeFrom(value: string, prefix: string) {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 18);
  return `${prefix}-${normalized || crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

async function snapshot({ scoped, companyId }: Context): Promise<HrFoundationSnapshot> {
  const [organizations, departments, teams, employees, documents, leave, payroll, assets, notifications] = await Promise.all([
    scoped.from("hr_organizations").select("id,code,name,status").eq("company_id", companyId).order("name"),
    scoped.from("hr_departments").select("id,organization_id,code,name,manager_employee_code,status").eq("company_id", companyId).order("name"),
    scoped.from("hr_teams").select("id,department_id,code,name,manager_employee_code,status").eq("company_id", companyId).order("name"),
    scoped.from("hr_employees").select("id,employee_code,display_name,phone,job_title,hr_role,organization_id,department_id,team_id,manager_employee_code,activation_status,status").eq("company_id", companyId).order("display_name"),
    scoped.from("hr_documents").select("id,document_code,title,status,hr_document_versions(version),hr_document_recipients(count)").eq("company_id", companyId).order("created_at", { ascending: false }),
    scoped.from("hr_leave_requests").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    scoped.from("hr_payroll_records").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    scoped.from("hr_asset_assignments").select("id", { count: "exact", head: true }).eq("company_id", companyId).is("returned_at", null),
    scoped.from("hr_notifications").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_read", false),
  ]);
  const failed = [organizations, departments, teams, employees, documents, leave, payroll, assets, notifications].find(result => result.error);
  if (failed?.error) {
    if (failed.error.code === "42P01" || failed.error.code === "PGRST205") throw new Error("HR Foundation migration henüz Supabase üzerinde çalıştırılmamış.");
    throw failed.error;
  }

  return {
    organizations: (organizations.data ?? []).map(row => ({ id: String(row.id), code: String(row.code), name: String(row.name), status: String(row.status) })),
    departments: (departments.data ?? []).map(row => ({ id: String(row.id), organizationId: String(row.organization_id), code: String(row.code), name: String(row.name), managerEmployeeCode: row.manager_employee_code ? String(row.manager_employee_code) : null, status: String(row.status) })),
    teams: (teams.data ?? []).map(row => ({ id: String(row.id), departmentId: String(row.department_id), code: String(row.code), name: String(row.name), managerEmployeeCode: row.manager_employee_code ? String(row.manager_employee_code) : null, status: String(row.status) })),
    employees: (employees.data ?? []).map(row => ({ id: String(row.id), employeeCode: String(row.employee_code), displayName: String(row.display_name), phone: row.phone ? String(row.phone) : null, jobTitle: row.job_title ? String(row.job_title) : null, hrRole: String(row.hr_role) as "HR" | "MANAGER" | "EMPLOYEE" | "PLATFORM_ADMIN" | "CHIEF", organizationId: row.organization_id ? String(row.organization_id) : null, departmentId: row.department_id ? String(row.department_id) : null, teamId: row.team_id ? String(row.team_id) : null, managerEmployeeCode: row.manager_employee_code ? String(row.manager_employee_code) : null, activationStatus: String(row.activation_status), status: String(row.status) })),
    documents: (documents.data ?? []).map(row => {
      const versions = Array.isArray(row.hr_document_versions) ? row.hr_document_versions : [];
      const recipients = Array.isArray(row.hr_document_recipients) ? row.hr_document_recipients : [];
      return { id: String(row.id), documentCode: String(row.document_code), title: String(row.title), status: String(row.status), version: Math.max(0, ...versions.map(item => Number(item.version) || 0)), recipientCount: Number(recipients[0]?.count ?? 0) };
    }),
    counts: { leave: leave.count ?? 0, payroll: payroll.count ?? 0, assets: assets.count ?? 0, notifications: notifications.count ?? 0, pendingActivation: (employees.data ?? []).filter(row => row.activation_status !== "ACTIVE").length },
  };
}

export async function GET(request: NextRequest) {
  try {
    const context = await requireWorkforceManager(request);
    return NextResponse.json({ snapshot: await snapshot(context) });
  } catch (error) { return errorResponse(error, 403); }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireWorkforceManager(request);
    const { scoped, companyId, userId } = context;
    const body = await request.json() as Record<string, unknown>;
    const action = required(body.action, "İşlem");
    let appliedEvent: HrProjectionEvent | null = null;

    if (action === "CREATE_ORGANIZATION") {
      const name = required(body.name, "Organizasyon adı");
      const code = typeof body.code === "string" && body.code.trim() ? body.code.trim().toUpperCase() : codeFrom(name, "ORG");
      const id = crypto.randomUUID();
      const { data: event, error: eventError } = await scoped.from("hr_events").insert({ company_id: companyId, aggregate_type: "ORGANIZATION", aggregate_id: id, event_type: "ORGANIZATION_CREATED", payload: { id, code, name }, actor_user_id: userId, deduplication_key: crypto.randomUUID() }).select("sequence,event_type,aggregate_type,aggregate_id").single();
      if (eventError || !event) throw eventError ?? new Error("HR event oluşturulamadı.");
      appliedEvent = { sequence: Number(event.sequence), eventType: String(event.event_type), aggregateType: String(event.aggregate_type), aggregateId: String(event.aggregate_id) };
      const { error } = await scoped.from("hr_organizations").insert({ id, company_id: companyId, code, name, created_by: userId });
      if (error) throw error;
    } else if (action === "CREATE_DEPARTMENT") {
      const name = required(body.name, "Departman adı");
      const organizationId = required(body.organizationId, "Organizasyon");
      const code = typeof body.code === "string" && body.code.trim() ? body.code.trim().toUpperCase() : codeFrom(name, "DEP");
      const id = crypto.randomUUID();
      const { data: event, error: eventError } = await scoped.from("hr_events").insert({ company_id: companyId, aggregate_type: "DEPARTMENT", aggregate_id: id, event_type: "DEPARTMENT_CREATED", payload: { id, organizationId, code, name }, actor_user_id: userId, deduplication_key: crypto.randomUUID() }).select("sequence,event_type,aggregate_type,aggregate_id").single();
      if (eventError || !event) throw eventError ?? new Error("HR event oluşturulamadı.");
      appliedEvent = { sequence: Number(event.sequence), eventType: String(event.event_type), aggregateType: String(event.aggregate_type), aggregateId: String(event.aggregate_id) };
      const { error } = await scoped.from("hr_departments").insert({ id, company_id: companyId, organization_id: organizationId, code, name, created_by: userId });
      if (error) throw error;
    } else if (action === "CREATE_TEAM") {
      const name = required(body.name, "Takım adı");
      const departmentId = required(body.departmentId, "Departman");
      const code = typeof body.code === "string" && body.code.trim() ? body.code.trim().toUpperCase() : codeFrom(name, "TEAM");
      const id = crypto.randomUUID();
      const { data: event, error: eventError } = await scoped.from("hr_events").insert({ company_id: companyId, aggregate_type: "TEAM", aggregate_id: id, event_type: "TEAM_CREATED", payload: { id, departmentId, code, name }, actor_user_id: userId, deduplication_key: crypto.randomUUID() }).select("sequence,event_type,aggregate_type,aggregate_id").single();
      if (eventError || !event) throw eventError ?? new Error("HR event oluşturulamadı.");
      appliedEvent = { sequence: Number(event.sequence), eventType: String(event.event_type), aggregateType: String(event.aggregate_type), aggregateId: String(event.aggregate_id) };
      const { error } = await scoped.from("hr_teams").insert({ id, company_id: companyId, department_id: departmentId, code, name, created_by: userId });
      if (error) throw error;
    } else if (action === "CREATE_DOCUMENT") {
      const title = required(body.title, "Belge başlığı");
      const content = required(body.content, "Belge içeriği");
      const documentCode = `HRD-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      const documentId = crypto.randomUUID();
      const { data: event, error: eventError } = await scoped.from("hr_events").insert({ company_id: companyId, aggregate_type: "DOCUMENT", aggregate_id: documentId, event_type: "DOCUMENT_CREATED", payload: { id: documentId, documentCode, title, content, version: 1 }, actor_user_id: userId, deduplication_key: crypto.randomUUID() }).select("sequence,event_type,aggregate_type,aggregate_id").single();
      if (eventError || !event) throw eventError ?? new Error("HR event oluşturulamadı.");
      appliedEvent = { sequence: Number(event.sequence), eventType: String(event.event_type), aggregateType: String(event.aggregate_type), aggregateId: String(event.aggregate_id) };
      const { data: document, error: documentError } = await scoped.from("hr_documents").insert({ id: documentId, company_id: companyId, document_code: documentCode, title, created_by: userId }).select("id").single();
      if (documentError || !document) throw documentError ?? new Error("Belge oluşturulamadı.");
      const { error: versionError } = await scoped.from("hr_document_versions").insert({ company_id: companyId, document_id: document.id, version: 1, content, created_by: userId });
      if (versionError) throw versionError;
      const { error: auditError } = await scoped.from("hr_document_audit_events").insert({ company_id: companyId, document_id: document.id, event_type: "CREATED", actor_user_id: userId });
      if (auditError) throw auditError;
    } else {
      throw new Error("Desteklenmeyen HR işlemi.");
    }

    const nextSnapshot = await snapshot(context);
    if (!appliedEvent) throw new Error("HR event projection bilgisi eksik.");
    const { data: currentProjection } = await scoped.from("hr_read_models").select("snapshot").eq("company_id", companyId).maybeSingle();
    const reduced = reduceHrProjection((currentProjection?.snapshot as HrProjectionEnvelope | null) ?? null, appliedEvent, nextSnapshot);
    const { error: projectionError } = await scoped.from("hr_read_models").upsert({ company_id: companyId, snapshot: reduced, event_sequence: appliedEvent.sequence, updated_at: new Date().toISOString() }, { onConflict: "company_id" });
    if (projectionError) throw projectionError;
    await scoped.from("hr_security_audit_logs").insert({ company_id: companyId, actor_user_id: userId, action, resource_type: appliedEvent.aggregateType, resource_id: appliedEvent.aggregateId, result: "ALLOWED", request_metadata: { eventSequence: appliedEvent.sequence } });
    return NextResponse.json({ snapshot: nextSnapshot }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
