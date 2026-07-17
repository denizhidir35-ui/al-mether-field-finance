# HR Foundation migration review

Migration: `supabase/migrations/20260717_hr_foundation.sql`

The migration is explicitly atomic: `BEGIN`, short lock/statement timeouts, and `COMMIT` are part of the file. Any failed statement aborts the transaction; no partial HR schema is committed.

## Compatibility

- Existing `profiles`, `operation_personnel`, WorkOrder, PMTHR QR and Operations Engine tables remain the source records for their current responsibilities.
- An operation personnel row whose assigned Chief is absent/inactive in `profiles` is still migrated safely. Its HR `manager_employee_code` remains `NULL`; the original Operations assignment is not changed.
- `hr_employees.employee_code` links the HR record to the existing workforce identity. `operation_personnel_id` and `profile_id` are unique optional references, preventing a second HR identity for the same person.
- Portal authentication (`profile_id`) and operation identity (`employee_code`) remain separate.

## Idempotency review

- New tables use `create table if not exists`.
- Functions use `create or replace`; triggers and policies are dropped by name before recreation.
- Backfills use `on conflict` and can be replayed.
- Seeds use `on conflict do nothing`.
- Buckets and indexes are idempotent.
- The migration is additive except for widening the existing `profiles_role_check` constraint. Existing valid roles are preserved.

## Security review

- RLS is enabled on every HR table.
- Access is evaluated by tenant plus `hr_access_grants` scope, not by menu visibility.
- The API uses an authenticated user-scoped Supabase client; the service-role client is not used for HR Foundation reads/writes.
- No HR policy grants `DELETE`. Archive/passive status is the lifecycle mechanism.
- `hr_events` and `hr_document_audit_events` are append-only and reject update/delete.
- Private document objects live in the non-public `hr-private` bucket. Paths must use `company_id/employee_code/document_class/file`; reads are tenant, employee and sensitivity scoped. Delivery uses an authorized server-created signed URL with a 30â€“300 second bounded lifetime.
- `PAYROLL`, `HEALTH_REPORT`, `MEDICAL` and `CRITICAL` records are always `RESTRICTED`. Organization/department managers cannot read those files; only company HR or the employee can.
- Document view/download issuance appends both a document audit event and a security audit record. The API never returns a URL when either audit write fails.
- File metadata is archived. HR file/version/payroll rows reject physical deletion and the bucket has no HR delete policy.

## Event flow

`UI command → HrRepository → /api/hr → hr_events append → projection table → hr_read_models → UI query`

Projection writes never update another screen's local state. A projection can be rebuilt by replaying `hr_events` in sequence.

## Rollback note

Before production rollout, take a schema-only backup and record the latest `hr_events.sequence`. If deployment must be rolled back:

1. Stop HR writes.
2. Revert application code to the previous release.
3. Keep HR tables and the private bucket intact to avoid data loss.
4. Disable new HR policies or revoke API access if isolation is required.
5. Do not drop `hr_events`, audit events, employee links, or stored files. A destructive down migration is intentionally not supplied.

## Staging gates

1. Apply the migration to an isolated staging project.
2. Apply the same migration a second time; the second application must complete without error.
3. Run `supabase/tests/20260717_hr_foundation_postflight.sql`.
4. Run `supabase/tests/20260717_hr_foundation_scope_rehearsal.sql`; it is transaction-bound and rolls back all fixtures.
5. Revert the application to the prior release while retaining the additive schema and verify the old release can still sign in and use Operations.
6. Re-deploy the HR release and rerun postflight. This is the non-destructive rollback rehearsal; HR history and private objects are never dropped.

Production migration remains blocked until both repeated-apply idempotency and the rollback rehearsal are executed on staging and their outputs are retained.
