import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../../../supabase/migrations/20260717_hr_foundation.sql", import.meta.url), "utf8");
const accessRoute = readFileSync(new URL("../../../app/api/hr/documents/[documentId]/versions/[versionId]/route.ts", import.meta.url), "utf8");

test("employee and storage identities are company scoped", () => {
  assert.match(migration, /unique \(company_id, employee_code\)/);
  assert.match(migration, /company_id \|\| '\/' \|\| employee_code \|\| '\/' \|\| category \|\| '\/%'/);
  assert.match(migration, /\(storage\.foldername\(name\)\)\[1\] = current_company_id\(\)/);
  assert.match(migration, /employee\.employee_code = \(storage\.foldername\(name\)\)\[2\]/);
});

test("sensitive files and archive lifecycle are enforced by the migration", () => {
  assert.match(migration, /'HEALTH_REPORT', 'MEDICAL', 'CRITICAL'/);
  assert.match(migration, /sensitivity = 'RESTRICTED'/);
  assert.match(migration, /can_view_hr_employee_file\(text,uuid,text\)/);
  assert.match(migration, /create trigger hr_employee_files_no_delete/);
  assert.match(migration, /create trigger hr_document_versions_no_delete/);
  assert.match(migration, /create trigger hr_payroll_records_no_delete/);
  assert.doesNotMatch(migration, /create policy[^;]+for delete[^;]+storage\.objects/is);
});

test("signed document access is bounded and audit backed", () => {
  assert.match(accessRoute, /createSignedUrl/);
  assert.match(accessRoute, /HR_SIGNED_URL_TTL_SECONDS/);
  assert.match(accessRoute, /hr_document_audit_events/);
  assert.match(accessRoute, /hr_security_audit_logs/);
  assert.match(accessRoute, /DOCUMENT_\$\{eventType\}/);
});
