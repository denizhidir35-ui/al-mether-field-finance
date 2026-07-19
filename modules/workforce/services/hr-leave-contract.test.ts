import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("supabase/migrations/20260720_hr_leave_management.sql", "utf8");
const createFixMigration = readFileSync("supabase/migrations/20260720_hr_leave_management_create_fix.sql", "utf8");
const preflight = readFileSync("supabase/tests/20260720_hr_leave_management_preflight.sql", "utf8");
const approveRoute = readFileSync("app/api/hr/leave/[leaveRequestId]/approve/route.ts", "utf8");
const rejectRoute = readFileSync("app/api/hr/leave/[leaveRequestId]/reject/route.ts", "utf8");
const cancelRoute = readFileSync("app/api/hr/leave/[leaveRequestId]/cancel/route.ts", "utf8");

test("leave migration is transactional and reuses canonical stores", () => {
  assert.match(migration, /^begin;/m);
  assert.match(migration, /commit;\s*$/);
  assert.doesNotMatch(migration, /create table[^;]+events/i);
  assert.match(migration, /insert into public\.hr_events/);
  assert.match(migration, /insert into public\.hr_security_audit_logs/);
});

test("commands are idempotent, tenant scoped and atomic in one RPC", () => {
  assert.match(migration, /current_company_id\(\)/);
  assert.match(migration, /deduplication_key = p_idempotency_key/);
  assert.match(migration, /execute_hr_leave_command/);
  assert.match(migration, /LEAVE_DATE_OVERLAP/);
  assert.match(migration, /LEAVE_MANUAL_REASON_REQUIRED/);
});

test("create command keeps new and existing idempotent UUIDs independent", () => {
  assert.match(createFixMigration, /v_new_leave_id uuid;/);
  assert.match(createFixMigration, /v_existing_leave_id uuid;/);
  assert.match(createFixMigration, /select aggregate_id::uuid into v_existing_leave_id/);
  assert.match(createFixMigration, /if found then return v_existing_leave_id; end if;/);
  assert.match(createFixMigration, /v_new_leave_id := coalesce\(p_leave_request_id, gen_random_uuid\(\)\);/);
  assert.match(createFixMigration, /v_id := v_new_leave_id;/);
  assert.doesNotMatch(createFixMigration, /select aggregate_id::uuid into v_id/);
  assert.match(createFixMigration, /using v_company_id, v_id::text, v_event/);
  assert.match(createFixMigration, /values\(v_id,v_company_id,p_employee_code/);
  assert.match(createFixMigration, /'leave_request_id',v_id/);
});

test("preflight covers every production blocker without persistent writes", () => {
  for (const marker of ["ACTIVE_DATE_OVERLAP", "INVALID_DATE_RANGE", "BROKEN_EMPLOYEE_REFERENCE", "EMPLOYEE_COMPANY_MISMATCH", "INVALID_MANAGER_SCOPE_GRANT", "SOURCE_BACKFILL_ROWS"]) assert.match(preflight, new RegExp(marker));
  assert.match(preflight, /begin transaction read only;/);
  assert.match(preflight, /rollback;/);
});

test("projection cannot be deleted and active ranges cannot overlap", () => {
  assert.match(migration, /hr_leave_requests_no_delete/);
  assert.match(migration, /exclude using gist/);
  assert.match(migration, /status in \('PENDING','APPROVED'\)/);
});

test("self, manager and HR scopes are enforced independently of the UI", () => {
  assert.match(migration, /p_source = 'EMPLOYEE_REQUEST' and p_employee_code <> coalesce\(v_actor_employee/);
  assert.match(migration, /p_source = 'MANAGER_ENTRY' and not v_is_manager/);
  assert.match(migration, /p_source = 'HR_MANUAL'.+not v_is_hr/s);
  assert.match(migration, /company_id = public\.current_company_id\(\)/);
  assert.match(migration, /LEAVE_DECISION_DENIED/);
});

test("inactive, invalid, overlap and manual-reason failures are database guarded", () => {
  for (const marker of ["LEAVE_EMPLOYEE_INACTIVE", "LEAVE_INVALID_DATE_RANGE", "LEAVE_DATE_OVERLAP", "LEAVE_MANUAL_REASON_REQUIRED", "LEAVE_REJECT_REASON_REQUIRED", "LEAVE_CANCEL_REASON_REQUIRED"]) assert.match(migration, new RegExp(marker));
});

test("approved cancellation is authority gated and employee cancellation uses UTC safe date", () => {
  assert.match(migration, /v_previous = 'APPROVED' and p_action = 'CANCEL'/);
  assert.match(migration, /LEAVE_EMPLOYEE_APPROVED_CANCEL_RULE_UNAVAILABLE/);
  assert.match(migration, /timezone\('UTC', now\(\)\)::date/);
});

test("audit captures command metadata and event history remains append-only", () => {
  for (const field of ["employee_code", "leave_request_id", "source", "previous_status", "new_status", "reason", "idempotency_key"]) assert.match(migration, new RegExp(`'${field}'`));
  assert.doesNotMatch(migration, /update public\.hr_events|delete from public\.hr_events/i);
});

test("approve, reject and cancel are explicit command endpoints", () => {
  assert.match(approveRoute, /handleLeaveTransition\(request, route, "APPROVE"\)/);
  assert.match(rejectRoute, /handleLeaveTransition\(request, route, "REJECT"\)/);
  assert.match(cancelRoute, /handleLeaveTransition\(request, route, "CANCEL"\)/);
});
