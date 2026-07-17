import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../../../supabase/migrations/20260717_hr_foundation.sql", import.meta.url), "utf8");
const accessRoute = readFileSync(new URL("../../../app/api/hr/documents/[documentId]/versions/[versionId]/route.ts", import.meta.url), "utf8");
const postflight = readFileSync(new URL("../../../supabase/tests/20260717_hr_foundation_postflight.sql", import.meta.url), "utf8");

test("employee and storage identities are company scoped", () => {
  assert.match(migration, /^begin;/m);
  assert.match(migration, /^commit;/m);
  assert.match(migration, /set local lock_timeout = '5s'/);
  assert.match(migration, /set local statement_timeout = '120s'/);
  assert.match(migration, /unique \(company_id, employee_code\)/);
  assert.match(migration, /company_id \|\| '\/' \|\| employee_code \|\| '\/' \|\| category \|\| '\/%'/);
  assert.match(migration, /\(storage\.foldername\(name\)\)\[1\] = current_company_id\(\)/);
  assert.match(migration, /employee\.employee_code = \(storage\.foldername\(name\)\)\[2\]/);
  assert.match(migration, /case when chief\.employee_code is not null then personnel\.assigned_chief_code else null end/);
  assert.match(migration, /left join profiles chief/);
  assert.match(postflight, /orphan_chief_reference_count/);
  assert.match(postflight, /valid_chief_reference_count/);
  assert.match(postflight, /An orphan Chief reference was not safely nulled in HR backfill/);
});

test("migration completes all DDL before backfill and flushes deferred constraints before commit", () => {
  assert.equal((migration.match(/^begin;$/gm) ?? []).length, 1);
  assert.equal((migration.match(/^commit;$/gm) ?? []).length, 1);

  const orderedMarkers = [
    "set local lock_timeout = '5s'",
    "create extension if not exists pgcrypto",
    "create type hr_event_type as enum",
    "create table if not exists hr_organizations",
    "create index if not exists hr_audit_document_idx",
    "create or replace function reject_hr_audit_mutation()",
    "alter table %I enable row level security",
    'create policy "hr scoped organizations"',
    "insert into storage.buckets",
    "insert into hr_employees",
    "insert into hr_employee_placements",
    "HR migration integrity check failed",
    "set constraints all immediate",
    "commit;",
  ];

  const markerPositions = orderedMarkers.map((marker) => migration.indexOf(marker));
  assert.ok(markerPositions.every((position) => position >= 0), "all migration phases must be present");
  assert.deepEqual([...markerPositions].sort((left, right) => left - right), markerPositions);
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
