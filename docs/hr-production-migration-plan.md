# HR Foundation Production Migration Plan

Status: **PREPARED / NOT APPROVED / NOT EXECUTED**

Target: the existing AL METHER production Supabase project. HR remains a module of the same platform and database.

## Final read-only preflight (2026-07-18)

| Check | Result |
|---|---:|
| Companies | 1 |
| Profiles | 3 |
| Operation personnel | 1 |
| Work orders | 2 |
| Duplicate profile employee codes | 0 |
| Duplicate personnel codes | 0 |
| Orphan operation Chief assignments | 0 |
| Orphan WorkOrder Chief assignments | 0 |
| HR Foundation tables | Absent |
| `hr-private` bucket | Absent |

The final preflight currently reports no orphan assignment. The migration still handles a future mismatch safely: during HR backfill its `manager_employee_code` is left `NULL`, while `operation_personnel.assigned_chief_code` remains untouched. Postflight reports both orphan and valid Chief reference counts.

Run `supabase/tests/20260717_hr_foundation_preflight.sql` in the SQL editor immediately before the approval window. Any hard assertion aborts the release.

## Transaction and lock behavior

`20260717_hr_foundation.sql` contains an explicit transaction with:

- `lock_timeout = 5s`
- `statement_timeout = 120s`
- one final `COMMIT`

PostgreSQL DDL, RLS policies, triggers, seed inserts and the bucket metadata update execute atomically. A statement or lock failure aborts the complete transaction. No `CONCURRENTLY`, external HTTP call or non-transactional application operation exists in the migration.

## Backup gate

Before approval and execution:

1. Put the HR release in maintenance/not-yet-enabled state. Operations may remain online; no HR write path may be used.
2. Confirm a restorable Supabase database backup/snapshot exists and record its timestamp.
3. Take a schema-only export of `public`, `auth` and `storage` metadata.
4. Take a data-only export of `companies`, `profiles`, `company_memberships`, `operation_personnel`, `work_orders`, `operation_assignments` and existing storage bucket/object metadata.
5. Record row counts for those tables and the current Git commit.
6. Store backup artifacts outside the repository and verify that the files are non-empty/readable.

Production execution is blocked if a restorable backup cannot be verified.

## Execution order after explicit approval

1. Rerun read-only preflight and save its output.
2. Verify the deployed source commit and migration SHA-256.
3. Execute `20260717_hr_foundation.sql` once as one SQL batch.
4. Execute `20260717_hr_foundation_postflight.sql`.
5. Run the transactional synthetic scope rehearsal. It always rolls back.
6. Run API/Storage tests with reserved synthetic identities only.
7. If every gate passes, enable the HR UI. Do not import customer HR data in this release window.

## Synthetic matrix

| Company | User | Role/scope | Employee | Expected access |
|---|---|---|---|---|
| `zz_hr_test_a` | Synthetic HR A | HR_ADMIN / COMPANY | `TSTHR000001` | All company A HR records; none from B |
| `zz_hr_test_a` | Synthetic Manager A | ORGANIZATION_MANAGER / ORG-A1 | `TSTHR000002` | ORG-A1 standard records; no restricted employee files |
| `zz_hr_test_a` | Synthetic Employee A | EMPLOYEE / SELF | `TSTHR000003` | Own employee row, own files, assigned documents |
| `zz_hr_test_b` | Synthetic Employee B | EMPLOYEE / SELF | `TSTHR000004` | Own company B data only |

The SQL rehearsal creates two synthetic companies, organizations, departments, employees, grants, standard/restricted files and a document recipient entirely inside a rolled-back transaction. It never edits a customer row.

The API/Storage phase uses the same reserved prefix and must verify:

- company A valid upload/read
- company A user denied for company B path
- manager denied for `HEALTH_REPORT`, `MEDICAL`, `CRITICAL` and `PAYROLL`
- employee allowed only for own assigned document
- `hr-private.public = false` and public URL unavailable
- signed URL works before expiry and fails after expiry
- view/download creates both document and security audit events
- archive hides access while retaining metadata/object
- physical DELETE is rejected

Synthetic API fixtures must be archived/deactivated after evidence capture; customer rows are never selected for mutation.

## Rollback

### Before COMMIT or on migration error

PostgreSQL rolls back the entire transaction automatically. Confirm HR tables/bucket are absent and rerun the preflight. No restore is required unless a platform-level incident occurred.

### After COMMIT, before customer HR data

1. Disable HR navigation/API access and revert the application to the prior commit.
2. Keep additive HR tables, events, audit rows and private objects intact; do not run destructive drops.
3. Revoke/disable synthetic grants and archive synthetic fixtures if any API test committed them.
4. Investigate and correct the migration forward. The existing Operations tables remain authoritative.
5. Restore base tables from backup only if row-count/hash comparison proves an unintended base-data change.

### Rollback decision

Rollback is required for incomplete transaction state, failed tenant isolation, public bucket exposure, missing append-only triggers, customer-data mutation, or base-table count/hash drift. A failed synthetic assertion with otherwise intact isolation keeps HR disabled while the defect is corrected forward.

## Post-migration evidence

Retain:

- preflight and postflight outputs
- migration start/end timestamps
- migration file hash and Git commit
- RLS/cross-company/self-service results
- Storage and signed URL expiry evidence
- document/security audit rows for synthetic IDs
- archive/delete rejection evidence
- final base-table row-count comparison

Production migration approval must be requested again after the backup gate and immediate preflight are both confirmed.
