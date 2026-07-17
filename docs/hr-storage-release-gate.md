# HR Storage Release Gate

Production migration is **not approved** and has not been executed.

## Implemented and locally verified

- [x] `employee_code` is unique per company and every file path is scoped by `company_id/employee_code/document_class/file`.
- [x] Signed URL access is served by an authenticated HR API endpoint, not exposed directly by UI or public storage URLs.
- [x] Signed URL lifetime is bounded to 30â€“300 seconds (default 60 seconds).
- [x] View and download issuance appends `hr_document_audit_events` and `hr_security_audit_logs`.
- [x] `HEALTH_REPORT`, `MEDICAL`, `CRITICAL` and `PAYROLL` are restricted classes.
- [x] Restricted employee files are visible only to company HR or the employee, not organization/department managers.
- [x] File/version/payroll metadata uses archive state and rejects physical row deletion.
- [x] `hr-private` has no HR DELETE policy; the application archive endpoint never deletes a storage object.
- [x] Production build, typecheck and local HR/Operations/Workforce tests pass.

## Staging-only gates still requiring an isolated project

- [ ] Apply `20260717_hr_foundation.sql` twice and retain both successful outputs.
- [ ] Run `20260717_hr_foundation_postflight.sql`.
- [ ] Run `20260717_hr_foundation_scope_rehearsal.sql` and retain the rolled-back result.
- [ ] Verify valid upload/read plus cross-company upload/read rejection through the Storage API.
- [ ] Verify signed URL expiry after the configured TTL through the Storage API.
- [ ] Revert to the previous application release without dropping the additive HR schema, smoke-test, then redeploy HR and rerun postflight.

An isolated staging Supabase target is not configured in the current workspace. These unchecked gates must not be run against production. Production approval must be requested only after they pass on staging.
