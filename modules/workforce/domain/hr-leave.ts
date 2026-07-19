export type HrLeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type HrLeaveSource = "EMPLOYEE_REQUEST" | "MANAGER_ENTRY" | "HR_MANUAL" | "SYSTEM";
export type HrLeaveDayPart = "FULL_DAY" | "HALF_DAY";
export type HrLeaveAction = "APPROVE" | "REJECT" | "CANCEL";

export type HrLeaveHistory = {
  id: string;
  eventType: string;
  previousStatus: HrLeaveStatus | null;
  newStatus: HrLeaveStatus;
  reason: string | null;
  occurredAt: string;
};

export type HrLeaveRequest = {
  id: string;
  employeeCode: string;
  employeeName: string;
  leaveType: string;
  startsOn: string;
  endsOn: string;
  dayPart: HrLeaveDayPart;
  calendarDays: number;
  description: string | null;
  source: HrLeaveSource;
  interventionReason: string | null;
  status: HrLeaveStatus;
  createdAt: string;
  history: HrLeaveHistory[];
  allowedActions: HrLeaveAction[];
};

export type HrLeaveMetrics = { pending: number; todayOnLeave: number; approvedThisMonth: number };
export type HrLeaveFilters = { status?: HrLeaveStatus | "ALL"; employeeCode?: string; leaveType?: string; from?: string; to?: string };
export type HrLeaveList = { requests: HrLeaveRequest[]; metrics: HrLeaveMetrics; todayBasis: "UTC" };
export type HrLeaveCreateInput = {
  employeeCode: string;
  leaveType: string;
  startsOn: string;
  endsOn: string;
  dayPart: HrLeaveDayPart;
  description?: string;
  source: Exclude<HrLeaveSource, "SYSTEM">;
  interventionReason?: string;
  idempotencyKey: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function calendarDays(startsOn: string, endsOn: string, dayPart: HrLeaveDayPart) {
  if (!DATE_PATTERN.test(startsOn) || !DATE_PATTERN.test(endsOn)) throw new Error("Tarih biçimi geçersiz.");
  const start = Date.parse(`${startsOn}T00:00:00Z`);
  const end = Date.parse(`${endsOn}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) throw new Error("Bitiş tarihi başlangıçtan önce olamaz.");
  if (dayPart === "HALF_DAY" && startsOn !== endsOn) throw new Error("Yarım gün izin tek bir gün için girilebilir.");
  return dayPart === "HALF_DAY" ? 0.5 : Math.floor((end - start) / 86_400_000) + 1;
}

export function validateLeaveCreate(input: HrLeaveCreateInput) {
  if (!input.employeeCode.trim() || !input.leaveType.trim()) throw new Error("Çalışan ve izin türü zorunludur.");
  calendarDays(input.startsOn, input.endsOn, input.dayPart);
  if (input.source === "HR_MANUAL" && !input.interventionReason?.trim()) throw new Error("Manuel HR kaydında müdahale gerekçesi zorunludur.");
  if (!input.idempotencyKey.trim()) throw new Error("Idempotency anahtarı zorunludur.");
}

export function isAllowedTransition(previous: HrLeaveStatus, action: HrLeaveAction) {
  if (previous === "PENDING") return true;
  return previous === "APPROVED" && action === "CANCEL";
}
