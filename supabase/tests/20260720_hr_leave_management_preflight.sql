-- READ ONLY. Run before 20260720_hr_leave_management.sql.
begin transaction read only;

with active_leave as (
  select id, company_id, employee_code, starts_on, ends_on
  from public.hr_leave_requests where status in ('PENDING', 'APPROVED')
), overlapping_leave_records as (
  select distinct least(a.id, b.id) first_id, greatest(a.id, b.id) second_id
  from active_leave a join active_leave b
    on a.company_id = b.company_id and a.employee_code = b.employee_code and a.id < b.id
   and daterange(a.starts_on, a.ends_on, '[]') && daterange(b.starts_on, b.ends_on, '[]')
), findings as (
  select 'ACTIVE_DATE_OVERLAP' finding, count(*) total from overlapping_leave_records
  union all select 'INVALID_DATE_RANGE', count(*) from public.hr_leave_requests where ends_on < starts_on
  union all select 'BROKEN_EMPLOYEE_REFERENCE', count(*) from public.hr_leave_requests leave_record
    left join public.hr_employees employee on employee.company_id = leave_record.company_id and employee.employee_code = leave_record.employee_code
    where employee.id is null
  union all select 'EMPLOYEE_COMPANY_MISMATCH', count(*) from public.hr_leave_requests leave_record
    where exists (select 1 from public.hr_employees employee where employee.employee_code = leave_record.employee_code and employee.company_id <> leave_record.company_id)
      and not exists (select 1 from public.hr_employees employee where employee.employee_code = leave_record.employee_code and employee.company_id = leave_record.company_id)
  union all select 'INVALID_MANAGER_SCOPE_GRANT', count(*) from public.hr_access_grants grant_record
    where grant_record.status = 'ACTIVE' and (
      (grant_record.scope_type = 'ORGANIZATION' and not exists (select 1 from public.hr_organizations item where item.id = grant_record.organization_id and item.company_id = grant_record.company_id))
      or (grant_record.scope_type = 'DEPARTMENT' and not exists (select 1 from public.hr_departments item where item.id = grant_record.department_id and item.company_id = grant_record.company_id))
    )
  union all select 'SOURCE_BACKFILL_ROWS', count(*) from public.hr_leave_requests
)
select * from findings order by finding;

do $$
begin
  if exists (select 1 from public.hr_leave_requests where ends_on < starts_on) then raise exception 'LEAVE_PREFLIGHT_INVALID_DATE_RANGE'; end if;
  if exists (
    select 1 from public.hr_leave_requests leave_record left join public.hr_employees employee
      on employee.company_id = leave_record.company_id and employee.employee_code = leave_record.employee_code
    where employee.id is null
  ) then raise exception 'LEAVE_PREFLIGHT_BROKEN_EMPLOYEE_REFERENCE'; end if;
  if exists (
    select 1 from public.hr_leave_requests a join public.hr_leave_requests b
      on a.company_id = b.company_id and a.employee_code = b.employee_code and a.id < b.id
     and a.status in ('PENDING','APPROVED') and b.status in ('PENDING','APPROVED')
     and daterange(a.starts_on, a.ends_on, '[]') && daterange(b.starts_on, b.ends_on, '[]')
  ) then raise exception 'LEAVE_PREFLIGHT_ACTIVE_DATE_OVERLAP'; end if;
  if exists (
    select 1 from public.hr_access_grants grant_record where grant_record.status = 'ACTIVE' and (
      (grant_record.scope_type = 'ORGANIZATION' and not exists (select 1 from public.hr_organizations item where item.id = grant_record.organization_id and item.company_id = grant_record.company_id))
      or (grant_record.scope_type = 'DEPARTMENT' and not exists (select 1 from public.hr_departments item where item.id = grant_record.department_id and item.company_id = grant_record.company_id))
    )
  ) then raise exception 'LEAVE_PREFLIGHT_INVALID_MANAGER_SCOPE_GRANT'; end if;
end $$;

rollback;
