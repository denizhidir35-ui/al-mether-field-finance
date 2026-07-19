-- READ ONLY. Run after a successful migration commit and before frontend deployment.
begin transaction read only;

select
  exists(select 1 from pg_proc where proname = 'execute_hr_leave_command') as command_rpc_ok,
  exists(select 1 from pg_proc where proname = 'can_access_hr_leave_employee') as scope_function_ok,
  exists(select 1 from pg_trigger where tgname = 'hr_leave_requests_no_delete' and not tgisinternal) as no_delete_trigger_ok,
  exists(select 1 from pg_constraint where conname = 'hr_leave_no_active_overlap') as overlap_constraint_ok,
  exists(select 1 from pg_indexes where indexname = 'hr_leave_idempotency_idx') as idempotency_index_ok,
  exists(select 1 from pg_policies where tablename = 'hr_leave_requests' and policyname = 'hr scoped records') as scoped_read_policy_ok,
  exists(select 1 from pg_policies where tablename = 'hr_leave_requests' and policyname = 'hr leave direct insert denied') as direct_insert_denied_ok,
  exists(select 1 from pg_policies where tablename = 'hr_leave_requests' and policyname = 'hr leave direct update denied') as direct_update_denied_ok,
  not exists(select 1 from public.hr_leave_requests where source is null) as source_backfill_ok,
  not exists(select 1 from public.hr_leave_requests where ends_on < starts_on) as date_integrity_ok;

select status, source, count(*) total
from public.hr_leave_requests
group by status, source
order by status, source;

rollback;
