import { NextRequest, NextResponse } from "next/server";
import { requireWorkforceIdentity } from "@/core/workforce/server";
import type { HrLeaveAction } from "@/modules/workforce/domain/hr-leave";
import { executeLeaveCommand, leaveError, loadLeaveRequest } from "@/modules/workforce/services/hr-leave.server";

type RouteContext = { params: Promise<{ leaveRequestId: string }> };
function responseError(error: unknown, status = 400) { return NextResponse.json({ error: leaveError(error).message }, { status }); }

export async function GET(request: NextRequest, route: RouteContext) {
  try { const context = await requireWorkforceIdentity(request); return NextResponse.json({ request: await loadLeaveRequest(context, (await route.params).leaveRequestId) }); }
  catch (error) { return responseError(error, 403); }
}

export async function POST(request: NextRequest, route: RouteContext) {
  try {
    const context = await requireWorkforceIdentity(request); const id = (await route.params).leaveRequestId;
    const body = await request.json() as { action?: HrLeaveAction; reason?: string; idempotencyKey?: string };
    if (!body.action || !["APPROVE","REJECT","CANCEL"].includes(body.action)) throw new Error("Geçersiz izin işlemi.");
    if (!body.idempotencyKey?.trim()) throw new Error("Idempotency anahtarı zorunludur.");
    const result = await executeLeaveCommand(context, {
      p_action: body.action, p_leave_request_id: id, p_employee_code: null, p_leave_type: null, p_starts_on: null, p_ends_on: null,
      p_day_part: null, p_description: null, p_source: null, p_reason: body.reason ?? null, p_idempotency_key: body.idempotencyKey,
    });
    return NextResponse.json({ request: result });
  } catch (error) { return responseError(error); }
}
