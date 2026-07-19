import { NextRequest, NextResponse } from "next/server";
import { requireWorkforceIdentity } from "@/core/workforce/server";
import type { HrLeaveAction } from "@/modules/workforce/domain/hr-leave";
import { executeLeaveCommand, leaveError } from "@/modules/workforce/services/hr-leave.server";

type RouteContext = { params: Promise<{ leaveRequestId: string }> };

export async function handleLeaveTransition(request: NextRequest, route: RouteContext, action: HrLeaveAction) {
  try {
    const context = await requireWorkforceIdentity(request);
    const id = (await route.params).leaveRequestId;
    const body = await request.json() as { reason?: string; idempotencyKey?: string };
    if (!body.idempotencyKey?.trim()) throw new Error("Idempotency anahtarı zorunludur.");
    const result = await executeLeaveCommand(context, {
      p_action: action, p_leave_request_id: id, p_employee_code: null, p_leave_type: null,
      p_starts_on: null, p_ends_on: null, p_day_part: null, p_description: null,
      p_source: null, p_reason: body.reason ?? null, p_idempotency_key: body.idempotencyKey,
    });
    return NextResponse.json({ request: result });
  } catch (error) {
    return NextResponse.json({ error: leaveError(error).message }, { status: 400 });
  }
}
