import "server-only";
import type { WorkforceContext } from "@/core/workforce/server";
import { calendarDays, type HrLeaveAction, type HrLeaveHistory, type HrLeaveRequest, type HrLeaveStatus } from "../domain/hr-leave";

const MANAGER_ROLES = new Set(["CEO", "PARTNER", "HR", "MANAGER", "PLATFORM_ADMIN"]);

export function leaveError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const messages: Record<string, string> = {
    LEAVE_DATE_OVERLAP: "Çalışanın aynı tarih aralığında açık bir izin kaydı bulunuyor.",
    LEAVE_INVALID_DATE_RANGE: "Bitiş tarihi başlangıçtan önce olamaz.",
    LEAVE_EMPLOYEE_INACTIVE: "Pasif veya arşivlenmiş çalışana izin girilemez.",
    LEAVE_SCOPE_DENIED: "Bu izin kaydı için yetkiniz bulunmuyor.",
    LEAVE_DECISION_DENIED: "Bu izin kaydını onaylama veya reddetme yetkiniz bulunmuyor.",
    LEAVE_MANUAL_REASON_REQUIRED: "Manuel HR kaydında müdahale gerekçesi zorunludur.",
    LEAVE_STARTED_CANNOT_CANCEL: "Başlamış veya geçmiş izin çalışan tarafından iptal edilemez.",
    LEAVE_EMPLOYEE_APPROVED_CANCEL_RULE_UNAVAILABLE: "Şirket iptal kuralı tanımlı olmadığı için onaylı izin çalışan tarafından iptal edilemez.",
    LEAVE_TRANSITION_INVALID: "İzin kaydının mevcut durumu bu işleme uygun değil.",
  };
  const key = Object.keys(messages).find(item => raw.includes(item));
  return new Error(key ? messages[key] : raw || "İzin işlemi tamamlanamadı.");
}

export function allowedLeaveActions(context: WorkforceContext, row: { employee_code: string; status: string; starts_on: string }): HrLeaveAction[] {
  const status = row.status as HrLeaveStatus;
  const self = context.employeeCode === row.employee_code;
  if (MANAGER_ROLES.has(context.role)) {
    if (status === "PENDING") return ["APPROVE", "REJECT", "CANCEL"];
    if (status === "APPROVED") return ["CANCEL"];
  }
  if (self && status === "PENDING" && row.starts_on > new Date().toISOString().slice(0, 10)) return ["CANCEL"];
  return [];
}

export async function loadLeaveRequest(context: WorkforceContext, id: string): Promise<HrLeaveRequest> {
  const { data: row, error } = await context.scoped.from("hr_leave_requests").select("*").eq("company_id", context.companyId).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!row) throw new Error("İzin kaydı bulunamadı veya bu kayda erişim yetkiniz yok.");
  const [{ data: employee }, { data: events, error: eventError }] = await Promise.all([
    context.scoped.from("hr_employees").select("display_name").eq("company_id", context.companyId).eq("employee_code", row.employee_code).maybeSingle(),
    context.scoped.from("hr_events").select("id,event_type,payload,occurred_at").eq("company_id", context.companyId).eq("aggregate_type", "LEAVE_REQUEST").eq("aggregate_id", id).order("sequence"),
  ]);
  if (eventError) throw eventError;
  const history: HrLeaveHistory[] = (events ?? []).map(event => {
    const payload = (event.payload ?? {}) as Record<string, unknown>;
    return { id: String(event.id), eventType: String(event.event_type), previousStatus: (payload.previousStatus as HrLeaveStatus | null) ?? null, newStatus: (payload.newStatus as HrLeaveStatus) ?? row.status, reason: typeof payload.reason === "string" ? payload.reason : null, occurredAt: String(event.occurred_at) };
  });
  return {
    id: String(row.id), employeeCode: String(row.employee_code), employeeName: String(employee?.display_name ?? row.employee_code),
    leaveType: String(row.leave_type), startsOn: String(row.starts_on), endsOn: String(row.ends_on), dayPart: row.day_part,
    calendarDays: calendarDays(String(row.starts_on), String(row.ends_on), row.day_part), description: row.description,
    source: row.source, interventionReason: row.intervention_reason, status: row.status, createdAt: String(row.created_at), history,
    allowedActions: allowedLeaveActions(context, row),
  };
}

export async function executeLeaveCommand(context: WorkforceContext, params: Record<string, unknown>) {
  const { data, error } = await context.scoped.rpc("execute_hr_leave_command", params);
  if (error) throw leaveError(error);
  return loadLeaveRequest(context, String(data));
}
