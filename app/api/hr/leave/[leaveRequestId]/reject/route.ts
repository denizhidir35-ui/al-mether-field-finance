import { NextRequest } from "next/server";
import { handleLeaveTransition } from "../transition";

type RouteContext = { params: Promise<{ leaveRequestId: string }> };
export function POST(request: NextRequest, route: RouteContext) { return handleLeaveTransition(request, route, "REJECT"); }
