-- STAGING ONLY. Transactional cross-company, role-scope and archive rehearsal.
-- It creates temporary fixtures and always rolls them back.

begin;

create temporary table _hr_scope_context as
select id as user_id, company_id, employee_code
from profiles
where employee_code is not null and is_active and status = 'ACTIVE'
order by case when role = 'CHIEF' then 0 else 1 end, created_at
limit 1;

do $$ begin
  if not exists (select 1 from _hr_scope_context) then
    raise exception 'Staging requires one active profile with employee_code';
  end if;
end $$;

insert into companies(id, name) values ('hr_scope_other_company', 'HR Scope Other Company');

insert into hr_organizations(id, company_id, code, name) values
  ('10000000-0000-0000-0000-000000000001', (select company_id from _hr_scope_context), 'SCOPE-A', 'Scope A'),
  ('10000000-0000-0000-0000-000000000002', (select company_id from _hr_scope_context), 'SCOPE-B', 'Scope B'),
  ('20000000-0000-0000-0000-000000000001', 'hr_scope_other_company', 'SCOPE-X', 'Scope X');

insert into hr_employees(company_id, employee_code, display_name, organization_id, activation_status) values
  ((select company_id from _hr_scope_context), 'PMTHR-SCOPE-A', 'Scope Employee A', '10000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ((select company_id from _hr_scope_context), 'PMTHR-SCOPE-B', 'Scope Employee B', '10000000-0000-0000-0000-000000000002', 'ACTIVE'),
  ('hr_scope_other_company', 'PMTHR-SCOPE-X', 'Scope Employee X', '20000000-0000-0000-0000-000000000001', 'ACTIVE');

insert into hr_employee_files(company_id, employee_code, category, sensitivity, title, storage_path) values
  ((select company_id from _hr_scope_context), 'PMTHR-SCOPE-A', 'DOCUMENT', 'STANDARD', 'Ordinary A', (select company_id from _hr_scope_context) || '/PMTHR-SCOPE-A/DOCUMENT/a.pdf'),
  ((select company_id from _hr_scope_context), 'PMTHR-SCOPE-A', 'HEALTH_REPORT', 'RESTRICTED', 'Health A', (select company_id from _hr_scope_context) || '/PMTHR-SCOPE-A/HEALTH_REPORT/health.pdf'),
  ((select company_id from _hr_scope_context), 'PMTHR-SCOPE-B', 'DOCUMENT', 'STANDARD', 'Ordinary B', (select company_id from _hr_scope_context) || '/PMTHR-SCOPE-B/DOCUMENT/b.pdf'),
  ('hr_scope_other_company', 'PMTHR-SCOPE-X', 'DOCUMENT', 'STANDARD', 'Ordinary X', 'hr_scope_other_company/PMTHR-SCOPE-X/DOCUMENT/x.pdf');

-- Use the selected staging identity as company-wide HR first.
delete from hr_access_grants where profile_id = (select user_id from _hr_scope_context);
insert into hr_access_grants(company_id, profile_id, access_role, scope_type)
select company_id, user_id, 'HR_ADMIN', 'COMPANY' from _hr_scope_context;

select set_config('request.jwt.claim.sub', (select user_id::text from _hr_scope_context), true);
set local role authenticated;

do $$ begin
  if (select count(*) from hr_employees where employee_code like 'PMTHR-SCOPE-%') <> 2 then
    raise exception 'HR_ADMIN company scope failed';
  end if;
  if exists (select 1 from hr_employees where company_id = 'hr_scope_other_company') then
    raise exception 'Cross-company employee read was not rejected';
  end if;
end $$;

reset role;
delete from hr_access_grants where profile_id = (select user_id from _hr_scope_context);
insert into hr_access_grants(company_id, profile_id, access_role, scope_type, organization_id)
select company_id, user_id, 'ORGANIZATION_MANAGER', 'ORGANIZATION', '10000000-0000-0000-0000-000000000001' from _hr_scope_context;
set local role authenticated;

do $$ begin
  if (select count(*) from hr_employees where employee_code like 'PMTHR-SCOPE-%') <> 1 then
    raise exception 'Organization manager employee scope failed';
  end if;
  if (select count(*) from hr_employee_files where employee_code = 'PMTHR-SCOPE-A') <> 1 then
    raise exception 'Restricted health file leaked to organization manager';
  end if;
end $$;

reset role;
-- Archive lifecycle: metadata is retained and physical row deletion must fail.
update hr_employee_files
set status = 'ARCHIVED', archived_at = now(), archived_by = (select user_id from _hr_scope_context)
where employee_code = 'PMTHR-SCOPE-A' and category = 'DOCUMENT';

do $$ begin
  if not exists (select 1 from hr_employee_files where employee_code = 'PMTHR-SCOPE-A' and category = 'DOCUMENT' and status = 'ARCHIVED') then
    raise exception 'Archive metadata update failed';
  end if;
  begin
    delete from hr_employee_files where employee_code = 'PMTHR-SCOPE-A' and category = 'DOCUMENT';
    raise exception 'Physical HR file delete unexpectedly succeeded';
  exception when raise_exception then
    if sqlerrm = 'Physical HR file delete unexpectedly succeeded' then raise; end if;
  end;
end $$;

rollback;

select true as staging_scope_rehearsal_rolled_back;
