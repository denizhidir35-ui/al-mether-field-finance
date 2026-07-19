begin;

create table if not exists hr_personnel_import_batches (
  id uuid primary key,
  company_id text not null references companies(id) on delete cascade,
  source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
  file_name text not null,
  status text not null check (status in ('PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED')),
  total_rows integer not null default 0 check (total_rows >= 0),
  successful_rows integer not null default 0 check (successful_rows >= 0),
  failed_rows integer not null default 0 check (failed_rows >= 0),
  skipped_rows integer not null default 0 check (skipped_rows >= 0),
  actor_user_id uuid not null references auth.users(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (company_id, id)
);

create table if not exists hr_personnel_import_rows (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  import_batch_id uuid not null,
  row_number integer not null check (row_number >= 2),
  idempotency_key text not null check (length(idempotency_key) = 64),
  source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
  employee_code text,
  email text not null,
  phone text not null,
  auth_user_id uuid references auth.users(id) on delete set null,
  auth_created_by_import boolean not null default false,
  status text not null check (status in ('PENDING', 'VALIDATED', 'AUTH_CREATED', 'COMPLETED', 'FAILED', 'COMPENSATED', 'MANUAL_REVIEW')),
  error_code text,
  error_message text,
  actor_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (company_id, idempotency_key),
  unique (company_id, import_batch_id, row_number),
  foreign key (company_id, import_batch_id) references hr_personnel_import_batches(company_id, id)
);

create index if not exists hr_personnel_import_batches_company_idx on hr_personnel_import_batches(company_id, started_at desc);
create index if not exists hr_personnel_import_rows_batch_idx on hr_personnel_import_rows(company_id, import_batch_id, row_number);
create index if not exists hr_personnel_import_rows_auth_idx on hr_personnel_import_rows(auth_user_id) where auth_user_id is not null;

alter table hr_personnel_import_batches enable row level security;
alter table hr_personnel_import_rows enable row level security;

drop policy if exists "hr scoped import batches" on hr_personnel_import_batches;
create policy "hr scoped import batches" on hr_personnel_import_batches for select to authenticated
using (company_id = current_company_id() and can_manage_hr());

drop policy if exists "hr scoped import rows" on hr_personnel_import_rows;
create policy "hr scoped import rows" on hr_personnel_import_rows for select to authenticated
using (company_id = current_company_id() and can_manage_hr());

revoke insert, update, delete on hr_personnel_import_batches from anon, authenticated;
revoke insert, update, delete on hr_personnel_import_rows from anon, authenticated;

create or replace function reserve_hr_personnel_import_row(
  p_company_id text,
  p_import_batch_id uuid,
  p_row_number integer,
  p_idempotency_key text,
  p_source_sha256 text,
  p_employee_code text,
  p_email text,
  p_phone text,
  p_actor_user_id uuid
) returns table(row_id uuid, row_status text, resolved_employee_code text, existing_auth_user_id uuid, reused boolean)
language plpgsql security definer set search_path = public as $$
declare inserted_id uuid;
begin
  insert into hr_personnel_import_rows (
    company_id, import_batch_id, row_number, idempotency_key, source_sha256,
    employee_code, email, phone, status, actor_user_id
  ) values (
    p_company_id, p_import_batch_id, p_row_number, p_idempotency_key, p_source_sha256,
    p_employee_code, lower(p_email), p_phone, 'PENDING', p_actor_user_id
  ) on conflict (company_id, idempotency_key) do nothing
  returning id into inserted_id;

  if inserted_id is not null then
    insert into hr_security_audit_logs (company_id, actor_user_id, action, resource_type, resource_id, result, request_metadata)
    values (p_company_id, p_actor_user_id, 'IMPORT_PERSONNEL_ROW_PENDING', 'HR_PERSONNEL_IMPORT_ROW', inserted_id::text, 'ALLOWED',
      jsonb_build_object('import_batch_id', p_import_batch_id, 'row_number', p_row_number, 'status', 'PENDING', 'error_code', null));
    update hr_personnel_import_rows set status = 'VALIDATED', updated_at = now() where id = inserted_id;
    insert into hr_security_audit_logs (company_id, actor_user_id, action, resource_type, resource_id, result, request_metadata)
    values (p_company_id, p_actor_user_id, 'IMPORT_PERSONNEL_ROW_VALIDATED', 'HR_PERSONNEL_IMPORT_ROW', inserted_id::text, 'ALLOWED',
      jsonb_build_object('import_batch_id', p_import_batch_id, 'row_number', p_row_number, 'status', 'VALIDATED', 'error_code', null));
  end if;

  return query
  select import_row.id, import_row.status, import_row.employee_code, import_row.auth_user_id, inserted_id is null
  from hr_personnel_import_rows import_row
  where import_row.company_id = p_company_id and import_row.idempotency_key = p_idempotency_key;
end;
$$;

create or replace function update_hr_personnel_import_row_status(
  p_company_id text,
  p_row_id uuid,
  p_status text,
  p_auth_user_id uuid default null,
  p_auth_created_by_import boolean default false,
  p_error_code text default null,
  p_error_message text default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('PENDING', 'VALIDATED', 'AUTH_CREATED', 'COMPLETED', 'FAILED', 'COMPENSATED', 'MANUAL_REVIEW') then
    raise exception 'Invalid import row status';
  end if;
  update hr_personnel_import_rows
  set status = p_status,
      auth_user_id = coalesce(p_auth_user_id, auth_user_id),
      auth_created_by_import = auth_created_by_import or p_auth_created_by_import,
      error_code = p_error_code,
      error_message = left(p_error_message, 1000),
      completed_at = case when p_status in ('COMPLETED','FAILED','COMPENSATED','MANUAL_REVIEW') then now() else completed_at end,
      updated_at = now()
  where company_id = p_company_id and id = p_row_id;
  if not found then raise exception 'Import row not found'; end if;
  insert into hr_security_audit_logs (company_id, actor_user_id, action, resource_type, resource_id, result, request_metadata)
  select import_row.company_id, import_row.actor_user_id, 'IMPORT_PERSONNEL_ROW_' || p_status, 'HR_PERSONNEL_IMPORT_ROW', import_row.id::text,
    case when p_status in ('FAILED','MANUAL_REVIEW') then 'ERROR' else 'ALLOWED' end,
    jsonb_build_object('import_batch_id', import_row.import_batch_id, 'row_number', import_row.row_number, 'status', p_status, 'error_code', p_error_code)
  from hr_personnel_import_rows import_row where import_row.company_id = p_company_id and import_row.id = p_row_id;
end;
$$;

create or replace function complete_hr_personnel_import_row(
  p_company_id text,
  p_row_id uuid,
  p_actor_user_id uuid,
  p_auth_user_id uuid,
  p_employee_code text,
  p_display_name text,
  p_phone text,
  p_email text,
  p_job_title text,
  p_chief_code text,
  p_organization_id uuid,
  p_department_id uuid,
  p_team_id uuid,
  p_idempotency_key text
) returns table(operation_personnel_id text, event_sequence bigint)
language plpgsql security definer set search_path = public as $$
declare personnel_id text;
declare created_sequence bigint;
declare import_status text;
declare batch_id uuid;
declare source_row_number integer;
begin
  select status, import_batch_id, row_number into import_status, batch_id, source_row_number from hr_personnel_import_rows
  where company_id = p_company_id and id = p_row_id for update;
  if import_status <> 'AUTH_CREATED' then raise exception 'Import row is not ready for persistence'; end if;
  if p_employee_code !~ '^PMTHR[0-9]{6}$' then raise exception 'Invalid employee code'; end if;
  if not exists (select 1 from profiles where company_id = p_company_id and employee_code = p_chief_code and role = 'CHIEF' and status = 'ACTIVE') then raise exception 'Active chief not found'; end if;
  if not exists (select 1 from hr_organizations where company_id = p_company_id and id = p_organization_id and status = 'ACTIVE') then raise exception 'Organization not found'; end if;
  if not exists (select 1 from hr_departments where company_id = p_company_id and id = p_department_id and organization_id = p_organization_id and status = 'ACTIVE') then raise exception 'Department hierarchy mismatch'; end if;
  if p_team_id is not null and not exists (select 1 from hr_teams where company_id = p_company_id and id = p_team_id and department_id = p_department_id and status = 'ACTIVE') then raise exception 'Team hierarchy mismatch'; end if;

  insert into profiles (id, company_id, email, phone, display_name, role, employee_code, status, is_active, activation_status)
  values (p_auth_user_id, p_company_id, lower(p_email), p_phone, p_display_name, 'EMPLOYEE', p_employee_code, 'ACTIVE', true, 'PENDING_PHONE');
  insert into company_memberships (company_id, user_id, email, display_name, role, is_active)
  values (p_company_id, p_auth_user_id, lower(p_email), p_display_name, 'EMPLOYEE', true);
  insert into operation_personnel (company_id, personnel_code, display_name, title, status, assigned_chief_code, qr_value, created_by)
  values (p_company_id, p_employee_code, p_display_name, p_job_title, 'ACTIVE', p_chief_code, 'AUTO', p_actor_user_id)
  returning id into personnel_id;
  insert into hr_employees (
    company_id, employee_code, profile_id, operation_personnel_id, display_name, phone, job_title,
    hr_role, organization_id, department_id, team_id, manager_employee_code, activation_status, status
  ) values (
    p_company_id, p_employee_code, p_auth_user_id, personnel_id, p_display_name, p_phone, p_job_title,
    'EMPLOYEE', p_organization_id, p_department_id, p_team_id, p_chief_code, 'PENDING_PHONE', 'ACTIVE'
  );
  insert into hr_employee_placements (company_id, employee_code, organization_id, department_id, team_id, manager_employee_code, created_by)
  values (p_company_id, p_employee_code, p_organization_id, p_department_id, p_team_id, p_chief_code, p_actor_user_id);
  insert into hr_access_grants (company_id, profile_id, access_role, scope_type, employee_code)
  values (p_company_id, p_auth_user_id, 'EMPLOYEE', 'SELF', p_employee_code);
  insert into hr_events (company_id, aggregate_type, aggregate_id, event_type, payload, actor_user_id, deduplication_key)
  values (
    p_company_id, 'EMPLOYEE', p_employee_code, 'EMPLOYEE_CREATED',
    jsonb_build_object('employeeCode', p_employee_code, 'displayName', p_display_name, 'hrRole', 'EMPLOYEE', 'operationPersonnelId', personnel_id, 'source', 'EXCEL_IMPORT'),
    p_actor_user_id, p_idempotency_key
  ) returning sequence into created_sequence;
  insert into hr_security_audit_logs (company_id, actor_user_id, action, resource_type, resource_id, result, request_metadata)
  values (
    p_company_id, p_actor_user_id, 'IMPORT_PERSONNEL_ROW_COMPLETED', 'HR_PERSONNEL_IMPORT_ROW', p_employee_code, 'ALLOWED',
    jsonb_build_object('import_batch_id', batch_id, 'row_number', source_row_number, 'import_row_id', p_row_id, 'idempotency_key', p_idempotency_key, 'status', 'COMPLETED', 'error_code', null)
  );
  update hr_personnel_import_rows set status = 'COMPLETED', employee_code = p_employee_code, completed_at = now(), updated_at = now()
  where company_id = p_company_id and id = p_row_id;
  return query select personnel_id, created_sequence;
end;
$$;

revoke all on function reserve_hr_personnel_import_row(text,uuid,integer,text,text,text,text,text,uuid) from public, anon, authenticated;
revoke all on function update_hr_personnel_import_row_status(text,uuid,text,uuid,boolean,text,text) from public, anon, authenticated;
revoke all on function complete_hr_personnel_import_row(text,uuid,uuid,uuid,text,text,text,text,text,text,uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function reserve_hr_personnel_import_row(text,uuid,integer,text,text,text,text,text,uuid) to service_role;
grant execute on function update_hr_personnel_import_row_status(text,uuid,text,uuid,boolean,text,text) to service_role;
grant execute on function complete_hr_personnel_import_row(text,uuid,uuid,uuid,text,text,text,text,text,text,uuid,uuid,uuid,text) to service_role;

commit;
