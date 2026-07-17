-- POST-MIGRATION SYNTHETIC REHEARSAL.
-- All fixtures use reserved zz_hr_test_* identities and are rolled back.
-- No customer company, profile, grant, employee or document row is updated.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

insert into companies(id, name) values
  ('zz_hr_test_a', 'Synthetic HR Company A'),
  ('zz_hr_test_b', 'Synthetic HR Company B');

insert into auth.users(
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000','aa000000-0000-0000-0000-000000000001','authenticated','authenticated','hr-a@synthetic.invalid',crypt(encode(gen_random_bytes(18),'hex'),gen_salt('bf')),now(),'{}','{}',now(),now(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','aa000000-0000-0000-0000-000000000002','authenticated','authenticated','manager-a@synthetic.invalid',crypt(encode(gen_random_bytes(18),'hex'),gen_salt('bf')),now(),'{}','{}',now(),now(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','aa000000-0000-0000-0000-000000000003','authenticated','authenticated','employee-a@synthetic.invalid',crypt(encode(gen_random_bytes(18),'hex'),gen_salt('bf')),now(),'{}','{}',now(),now(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','bb000000-0000-0000-0000-000000000001','authenticated','authenticated','employee-b@synthetic.invalid',crypt(encode(gen_random_bytes(18),'hex'),gen_salt('bf')),now(),'{}','{}',now(),now(),'','','','');

insert into profiles(id, company_id, email, display_name, role, is_active, status, employee_code, activation_status) values
  ('aa000000-0000-0000-0000-000000000001','zz_hr_test_a','hr-a@synthetic.invalid','Synthetic HR A','HR',true,'ACTIVE','TSTHR000001','ACTIVE'),
  ('aa000000-0000-0000-0000-000000000002','zz_hr_test_a','manager-a@synthetic.invalid','Synthetic Manager A','MANAGER',true,'ACTIVE','TSTHR000002','ACTIVE'),
  ('aa000000-0000-0000-0000-000000000003','zz_hr_test_a','employee-a@synthetic.invalid','Synthetic Employee A','EMPLOYEE',true,'ACTIVE','TSTHR000003','ACTIVE'),
  ('bb000000-0000-0000-0000-000000000001','zz_hr_test_b','employee-b@synthetic.invalid','Synthetic Employee B','EMPLOYEE',true,'ACTIVE','TSTHR000004','ACTIVE');

insert into hr_organizations(id, company_id, code, name) values
  ('a1000000-0000-0000-0000-000000000001','zz_hr_test_a','ORG-A1','Synthetic Organization A1'),
  ('a1000000-0000-0000-0000-000000000002','zz_hr_test_a','ORG-A2','Synthetic Organization A2'),
  ('b1000000-0000-0000-0000-000000000001','zz_hr_test_b','ORG-B1','Synthetic Organization B1');

insert into hr_departments(id, company_id, organization_id, code, name) values
  ('a2000000-0000-0000-0000-000000000001','zz_hr_test_a','a1000000-0000-0000-0000-000000000001','DEP-A1','Synthetic Department A1'),
  ('a2000000-0000-0000-0000-000000000002','zz_hr_test_a','a1000000-0000-0000-0000-000000000002','DEP-A2','Synthetic Department A2'),
  ('b2000000-0000-0000-0000-000000000001','zz_hr_test_b','b1000000-0000-0000-0000-000000000001','DEP-B1','Synthetic Department B1');

insert into hr_employees(company_id, employee_code, profile_id, display_name, hr_role, organization_id, department_id, activation_status) values
  ('zz_hr_test_a','TSTHR000001','aa000000-0000-0000-0000-000000000001','Synthetic HR A','HR','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','ACTIVE'),
  ('zz_hr_test_a','TSTHR000002','aa000000-0000-0000-0000-000000000002','Synthetic Manager A','MANAGER','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','ACTIVE'),
  ('zz_hr_test_a','TSTHR000003','aa000000-0000-0000-0000-000000000003','Synthetic Employee A','EMPLOYEE','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','ACTIVE'),
  ('zz_hr_test_b','TSTHR000004','bb000000-0000-0000-0000-000000000001','Synthetic Employee B','EMPLOYEE','b1000000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000001','ACTIVE');

insert into hr_access_grants(company_id, profile_id, access_role, scope_type, organization_id, employee_code) values
  ('zz_hr_test_a','aa000000-0000-0000-0000-000000000001','HR_ADMIN','COMPANY',null,null),
  ('zz_hr_test_a','aa000000-0000-0000-0000-000000000002','ORGANIZATION_MANAGER','ORGANIZATION','a1000000-0000-0000-0000-000000000001',null),
  ('zz_hr_test_a','aa000000-0000-0000-0000-000000000003','EMPLOYEE','SELF',null,'TSTHR000003'),
  ('zz_hr_test_b','bb000000-0000-0000-0000-000000000001','EMPLOYEE','SELF',null,'TSTHR000004');

insert into hr_employee_files(company_id, employee_code, category, sensitivity, title, storage_path) values
  ('zz_hr_test_a','TSTHR000003','DOCUMENT','STANDARD','Synthetic Standard Document','zz_hr_test_a/TSTHR000003/DOCUMENT/standard.pdf'),
  ('zz_hr_test_a','TSTHR000003','HEALTH_REPORT','RESTRICTED','Synthetic Health Document','zz_hr_test_a/TSTHR000003/HEALTH_REPORT/health.pdf'),
  ('zz_hr_test_b','TSTHR000004','DOCUMENT','STANDARD','Synthetic Company B Document','zz_hr_test_b/TSTHR000004/DOCUMENT/standard.pdf');

insert into hr_documents(id, company_id, document_code, title, status) values
  ('a3000000-0000-0000-0000-000000000001','zz_hr_test_a','SYNTHETIC-POLICY-1','Synthetic Employee Document','PUBLISHED');
insert into hr_document_versions(id, company_id, document_id, employee_code, version, storage_path) values
  ('a4000000-0000-0000-0000-000000000001','zz_hr_test_a','a3000000-0000-0000-0000-000000000001','TSTHR000003',1,'zz_hr_test_a/TSTHR000003/DOCUMENT/policy.pdf');
insert into hr_document_recipients(company_id, document_id, version_id, employee_code) values
  ('zz_hr_test_a','a3000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000001','TSTHR000003');

-- Company HR: all of A, nothing from B.
select set_config('request.jwt.claim.sub','aa000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $$ begin
  if (select count(*) from hr_employees) <> 3 then raise exception 'HR company scope failed'; end if;
  if exists(select 1 from hr_employees where company_id = 'zz_hr_test_b') then raise exception 'Cross-company HR read leaked'; end if;
  begin
    insert into hr_notifications(company_id, employee_code, title, body)
    values ('zz_hr_test_b','TSTHR000004','Forbidden cross-company write','Must be rejected');
    raise exception 'Cross-company HR write unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Organization manager: scoped employees, standard file only, no health file.
reset role;
select set_config('request.jwt.claim.sub','aa000000-0000-0000-0000-000000000002',true);
set local role authenticated;
do $$ begin
  if (select count(*) from hr_employees) <> 3 then raise exception 'Organization manager scope failed'; end if;
  if (select count(*) from hr_employee_files where employee_code = 'TSTHR000003') <> 1 then raise exception 'Restricted file leaked to manager'; end if;
end $$;

-- Employee self-service: own row, own standard/restricted files and assigned document only.
reset role;
select set_config('request.jwt.claim.sub','aa000000-0000-0000-0000-000000000003',true);
set local role authenticated;
do $$ begin
  if (select count(*) from hr_employees) <> 1 then raise exception 'Employee self scope failed'; end if;
  if (select count(*) from hr_employee_files) <> 2 then raise exception 'Employee own file scope failed'; end if;
  if (select count(*) from hr_documents) <> 1 then raise exception 'Employee document recipient scope failed'; end if;
end $$;

-- Archive lifecycle retains metadata and rejects physical delete.
reset role;
update hr_employee_files set status = 'ARCHIVED', archived_at = now(), archived_by = 'aa000000-0000-0000-0000-000000000001'
where company_id = 'zz_hr_test_a' and employee_code = 'TSTHR000003' and category = 'DOCUMENT';
do $$ begin
  begin
    delete from hr_employee_files where company_id = 'zz_hr_test_a' and employee_code = 'TSTHR000003' and category = 'DOCUMENT';
    raise exception 'Physical delete unexpectedly succeeded';
  exception when raise_exception then
    if sqlerrm = 'Physical delete unexpectedly succeeded' then raise; end if;
  end;
end $$;

rollback;
select true as synthetic_scope_rehearsal_rolled_back;
