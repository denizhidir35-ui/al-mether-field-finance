import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../../../supabase/migrations/20260719_hr_personnel_excel_import.sql", import.meta.url), "utf8");
const route = readFileSync(new URL("../../../app/api/hr/import/route.ts", import.meta.url), "utf8");

test("import row ledger is company scoped, stateful and idempotent", () => {
  assert.match(migration, /^begin;/m);
  assert.match(migration, /^commit;/m);
  assert.match(migration, /unique \(company_id, idempotency_key\)/);
  assert.match(migration, /'PENDING', 'VALIDATED', 'AUTH_CREATED', 'COMPLETED', 'FAILED', 'COMPENSATED', 'MANUAL_REVIEW'/);
  assert.match(migration, /auth_user_id uuid references auth\.users\(id\) on delete set null/);
  assert.match(migration, /can_manage_hr\(\)/);
  assert.match(migration, /revoke insert, update, delete on hr_personnel_import_rows from anon, authenticated/);
});

test("preview performs no persistence and commit revalidates the entire file", () => {
  const previewBranch = route.slice(route.indexOf("export async function POST"));
  assert.match(previewBranch, /previewFile\(file, context\)/);
  assert.match(previewBranch, /mode === "preview"/);
  assert.match(previewBranch, /preview\.summary\.error > 0/);
  assert.ok(previewBranch.indexOf("previewFile(file, context)") < previewBranch.indexOf("importValidatedRows(context"));
});

test("company scope comes from verified context and auth compensation is ownership guarded", () => {
  assert.match(route, /requireWorkforceManager\(request\)/);
  assert.doesNotMatch(route, /form\.get\(["']company/i);
  assert.match(route, /hasExternalAuthOwnership/);
  assert.match(route, /company_memberships/);
  assert.match(route, /hr_employees/);
  assert.match(route, /hr_personnel_import_rows/);
  assert.match(route, /MANUAL_REVIEW/);
  assert.match(route, /deleteUser\(authUserId\)/);
  assert.match(route, /processing_model: "SAGA_COMPENSATION"/);
});

test("activation is not sent as part of the import", () => {
  assert.match(route, /email_confirm: false/);
  assert.match(route, /phone_confirm: false/);
  assert.doesNotMatch(route, /inviteUserByEmail|signInWithOtp|send.*sms/i);
});
