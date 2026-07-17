# HR Foundation migration review

Migration: `supabase/migrations/20260717_hr_foundation.sql`

## Compatibility

- Existing `profiles`, `operation_personnel`, WorkOrder, PMTHR QR and Operations Engine tables remain the source records for their current responsibilities.
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
- Private document objects live in the non-public `hr-private` bucket. Paths must begin with `company_id/employee_code/`; reads are RLS scoped. Delivery must use an authorized server-created signed URL.

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
