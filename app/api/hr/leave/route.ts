import { NextRequest, NextResponse } from "next/server";
import { requireWorkforceIdentity } from "@/core/workforce/server";
import { calendarDays, validateLeaveCreate, type HrLeaveCreateInput, type HrLeaveStatus } from "@/modules/workforce/domain/hr-leave";
import { allowedLeaveActions, executeLeaveCommand, leaveError } from "@/modules/workforce/services/hr-leave.server";

function responseError(error: unknown, status = 400) { return NextResponse.json({ error: leaveError(error).message }, { status }); }

export async function GET(request: NextRequest) {
  try {
    const context = await requireWorkforceIdentity(request);
    const query = request.nextUrl.searchParams;
    let builder = context.scoped.from("hr_leave_requests").select("*").eq("company_id", context.companyId).order("created_at", { ascending: false });
    const status = query.get("status"); const employeeCode = query.get("employeeCode"); const leaveType = query.get("leaveType");
    if (status && !["ALL","PENDING","APPROVED","REJECTED","CANCELLED"].includes(status)) throw new Error("Geçersiz izin durumu filtresi.");
    if (status && status !== "ALL") builder = builder.eq("status", status);
    if (employeeCode) builder = builder.eq("employee_code", employeeCode);
    if (leaveType) builder = builder.eq("leave_type", leaveType);
    if (query.get("from")) builder = builder.gte("ends_on", query.get("from")!);
    if (query.get("to")) builder = builder.lte("starts_on", query.get("to")!);
    const { data: rows, error } = await builder;
    if (error) throw error;
    const employeeCodes = [...new Set((rows ?? []).map(row => row.employee_code))];
    const { data: employees, error: employeeError } = employeeCodes.length
      ? await context.scoped.from("hr_employees").select("employee_code,display_name").eq("company_id", context.companyId).in("employee_code", employeeCodes)
      : { data: [], error: null };
    if (employeeError) throw employeeError;
    const names = new Map((employees ?? []).map(item => [String(item.employee_code), String(item.display_name)]));
    const requests = (rows ?? []).map(row => ({
      id: String(row.id), employeeCode: String(row.employee_code), employeeName: names.get(String(row.employee_code)) ?? String(row.employee_code), leaveType: String(row.leave_type),
      startsOn: String(row.starts_on), endsOn: String(row.ends_on), dayPart: row.day_part, calendarDays: calendarDays(String(row.starts_on), String(row.ends_on), row.day_part),
      description: row.description, source: row.source, interventionReason: row.intervention_reason, status: row.status, createdAt: String(row.created_at), history: [], allowedActions: allowedLeaveActions(context, row),
    }));
    const today = new Date().toISOString().slice(0, 10); const month = today.slice(0, 7);
    return NextResponse.json({ leave: { requests, todayBasis: "UTC", metrics: {
      pending: requests.filter(item => item.status === "PENDING").length,
      todayOnLeave: requests.filter(item => item.status === "APPROVED" && item.startsOn <= today && item.endsOn >= today).length,
      approvedThisMonth: requests.filter(item => item.status === "APPROVED" && item.startsOn.startsWith(month)).length,
    } } });
  } catch (error) { return responseError(error, 403); }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireWorkforceIdentity(request);
    const body = await request.json() as HrLeaveCreateInput;
    validateLeaveCreate(body);
    const isHr = ["CEO", "PARTNER", "HR", "PLATFORM_ADMIN"].includes(context.role);
    const isManager = context.role === "MANAGER";
    const source = isHr ? body.source : isManager ? "MANAGER_ENTRY" : "EMPLOYEE_REQUEST";
    if (body.source === "HR_MANUAL" && !isHr) throw new Error("Manuel HR kaydı yetkisi bulunmuyor.");
    const result = await executeLeaveCommand(context, {
      p_action: "CREATE", p_leave_request_id: null, p_employee_code: body.employeeCode, p_leave_type: body.leaveType,
      p_starts_on: body.startsOn, p_ends_on: body.endsOn, p_day_part: body.dayPart, p_description: body.description ?? null,
      p_source: source, p_reason: body.interventionReason ?? null, p_idempotency_key: body.idempotencyKey,
    });
    return NextResponse.json({ request: result }, { status: 201 });
  } catch (error) { return responseError(error); }
}
