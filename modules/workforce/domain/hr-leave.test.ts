import assert from "node:assert/strict";
import test from "node:test";
import { calendarDays, isAllowedTransition, validateLeaveCreate } from "./hr-leave.ts";

test("calendar day and half-day calculation", () => {
  assert.equal(calendarDays("2026-07-01", "2026-07-03", "FULL_DAY"), 3);
  assert.equal(calendarDays("2026-07-01", "2026-07-01", "HALF_DAY"), 0.5);
  assert.throws(() => calendarDays("2026-07-03", "2026-07-01", "FULL_DAY"));
  assert.throws(() => calendarDays("2026-07-01", "2026-07-02", "HALF_DAY"));
});

test("manual HR records require intervention reason", () => {
  assert.throws(() => validateLeaveCreate({ employeeCode: "PMTHR000001", leaveType: "ANNUAL", startsOn: "2026-07-01", endsOn: "2026-07-01", dayPart: "FULL_DAY", source: "HR_MANUAL", idempotencyKey: "one" }));
});

test("canonical leave transitions are narrow", () => {
  assert.equal(isAllowedTransition("PENDING", "APPROVE"), true);
  assert.equal(isAllowedTransition("APPROVED", "CANCEL"), true);
  assert.equal(isAllowedTransition("REJECTED", "CANCEL"), false);
});
