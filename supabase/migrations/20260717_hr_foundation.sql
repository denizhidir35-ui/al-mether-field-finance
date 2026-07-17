-- AL METHER Sprint 10 - HR Foundation
-- Extends the existing tenant/workforce model without changing Operations Engine data.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '120s';

create extension if not exists pgcrypto;

do $$ begin
  create type hr_event_type as enum (
    'EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED', 'EMPLOYEE_ARCHIVED',
    'ORGANIZATION_CREATED', 'ORGANIZATION_UPDATED', 'ORGANIZATION_ARCHIVED',
    'DEPARTMENT_CREATED', 'DEPARTMENT_UPDATED', 'DEPARTMENT_ARCHIVED',
    'TEAM_CREATED', 'TEAM_UPDATED', 'TEAM_ARCHIVED',
    'DOCUMENT_CREATED', 'DOCUMENT_VERSIONED', 'DOCUMENT_SENT', 'DOCUMENT_ACKNOWLEDGED', 'DOCUMENT_ACCEPTED', 'DOCUMENT_OTP_CONFIRMED', 'DOCUMENT_E_SIGNATURE_REQUESTED',
    'LEAVE_REQUEST_CREATED', 'LEAVE_APPROVED', 'LEAVE_REJECTED',
    'PAYROLL_UPLOADED', 'ASSET_ASSIGNED', 'ASSET_RETURNED'
  );
exception when duplicate_object then null; end $$;

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (
  role in ('CEO', 'PARTNER', 'ASSISTANT', 'MANAGER', 'CHIEF', 'PERSONNEL', 'HR', 'OFFICE', 'EMPLOYEE', 'PLATFORM_ADMIN')
);
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists activation_status text not null default 'ACTIVE'
  check (activation_status in ('PENDING_PHONE', 'PENDING_PASSWORD', 'ACTIVE', 'BLOCKED'));

create table if not exists hr_organizations (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  code text not null,
  name text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PASSIVE', 'ARCHIVED')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code),
  unique (company_id, id)
);

create table if not exists hr_departments (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  organization_id uuid not null,
  code text not null,
  name text not null,
  manager_employee_code text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PASSIVE', 'ARCHIVED')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code),
  unique (company_id, id),
  foreign key (company_id, organization_id) references hr_organizations(company_id, id)
);

create table if not exists hr_teams (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  department_id uuid not null,
  code text not null,
  name text not null,
  manager_employee_code text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PASSIVE', 'ARCHIVED')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code),
  unique (company_id, id),
  foreign key (company_id, department_id) references hr_departments(company_id, id)
);

create table if not exists hr_employees (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  employee_code text not null,
  profile_id uuid references profiles(id),
  operation_personnel_id text references operation_personnel(id),
  display_name text not null,
  phone text,
  job_title text,
  hr_role text not null default 'EMPLOYEE' check (hr_role in ('HR', 'MANAGER', 'EMPLOYEE', 'PLATFORM_ADMIN', 'CHIEF')),
  organization_id uuid,
  department_id uuid,
  team_id uuid,
  manager_employee_code text,
  activation_status text not null default 'PENDING_PHONE' check (activation_status in ('PENDING_PHONE', 'PENDING_PASSWORD', 'ACTIVE', 'BLOCKED')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PASSIVE', 'ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, employee_code),
  unique (company_id, operation_personnel_id),
  unique (company_id, id),
  foreign key (company_id, organization_id) references hr_organizations(company_id, id),
  foreign key (company_id, department_id) references hr_departments(company_id, id),
  foreign key (company_id, team_id) references hr_teams(company_id, id)
);

-- Auth account and workforce identity are separate references to the same physical employee.
-- employee_code remains the stable domain identity; profile_id is only the portal account.
create unique index if not exists hr_employees_profile_idx on hr_employees(company_id, profile_id) where profile_id is not null;

create table if not exists hr_employee_placements (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  employee_code text not null,
  organization_id uuid,
  department_id uuid,
  team_id uuid,
  manager_employee_code text,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'ENDED', 'ARCHIVED')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (company_id, employee_code) references hr_employees(company_id, employee_code),
  foreign key (company_id, organization_id) references hr_organizations(company_id, id),
  foreign key (company_id, department_id) references hr_departments(company_id, id),
  foreign key (company_id, team_id) references hr_teams(company_id, id),
  foreign key (company_id, manager_employee_code) references hr_employees(company_id, employee_code),
  check ((status = 'ACTIVE' and effective_to is null) or status <> 'ACTIVE')
);
create unique index if not exists hr_employee_active_placement_idx
  on hr_employee_placements(company_id, employee_code) where status = 'ACTIVE';

alter table hr_departments drop constraint if exists hr_departments_manager_employee_fk;
alter table hr_departments add constraint hr_departments_manager_employee_fk
  foreign key (company_id, manager_employee_code) references hr_employees(company_id, employee_code) deferrable initially deferred;
alter table hr_teams drop constraint if exists hr_teams_manager_employee_fk;
alter table hr_teams add constraint hr_teams_manager_employee_fk
  foreign key (company_id, manager_employee_code) references hr_employees(company_id, employee_code) deferrable initially deferred;
alter table hr_employees drop constraint if exists hr_employees_manager_employee_fk;
alter table hr_employees add constraint hr_employees_manager_employee_fk
  foreign key (company_id, manager_employee_code) references hr_employees(company_id, employee_code) deferrable initially deferred;

create table if not exists hr_company_licenses (
  company_id text not null references companies(id) on delete cascade,
  module_code text not null,
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  primary key (company_id, module_code)
);

create table if not exists hr_role_permissions (
  company_id text not null references companies(id) on delete cascade,
  role text not null,
  permission_code text not null,
  is_allowed boolean not null default true,
  primary key (company_id, role, permission_code)
);

create table if not exists hr_access_grants (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  access_role text not null check (access_role in ('HR_ADMIN', 'ORGANIZATION_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE')),
  scope_type text not null check (scope_type in ('COMPANY', 'ORGANIZATION', 'DEPARTMENT', 'SELF')),
  organization_id uuid,
  department_id uuid,
  employee_code text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PASSIVE', 'ARCHIVED')),
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  unique nulls not distinct (company_id, profile_id, access_role, scope_type, organization_id, department_id, employee_code),
  foreign key (company_id, organization_id) references hr_organizations(company_id, id),
  foreign key (company_id, department_id) references hr_departments(company_id, id),
  foreign key (company_id, employee_code) references hr_employees(company_id, employee_code),
  check (
    (scope_type = 'COMPANY' and organization_id is null and department_id is null and employee_code is null)
    or (scope_type = 'ORGANIZATION' and organization_id is not null and department_id is null and employee_code is null)
    or (scope_type = 'DEPARTMENT' and department_id is not null and employee_code is null)
    or (scope_type = 'SELF' and employee_code is not null)
  )
);

create table if not exists hr_employee_files (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  employee_code text not null,
  category text not null check (category in ('IDENTITY', 'DOCUMENT', 'PAYROLL', 'CONTRACT', 'CERTIFICATE', 'LEAVE', 'ASSET', 'HEALTH_REPORT', 'MEDICAL', 'CRITICAL')),
  sensitivity text not null default 'STANDARD' check (sensitivity in ('STANDARD', 'SENSITIVE', 'RESTRICTED')),
  title text not null,
  storage_path text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'ARCHIVED')),
  archived_at timestamptz,
  archived_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (company_id, employee_code) references hr_employees(company_id, employee_code),
  check (storage_path is null or storage_path like company_id || '/' || employee_code || '/' || category || '/%'),
  check (category not in ('PAYROLL', 'HEALTH_REPORT', 'MEDICAL', 'CRITICAL') or sensitivity = 'RESTRICTED'),
  check ((status = 'ACTIVE' and archived_at is null) or status = 'ARCHIVED')
);

create table if not exists hr_documents (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  document_code text not null,
  title text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, document_code),
  unique (company_id, id)
);

create table if not exists hr_document_versions (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  document_id uuid not null,
  employee_code text,
  version integer not null check (version > 0),
  content text not null default '',
  storage_path text,
  sensitivity text not null default 'STANDARD' check (sensitivity in ('STANDARD', 'SENSITIVE', 'RESTRICTED')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'ARCHIVED')),
  archived_at timestamptz,
  archived_by uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (document_id, version),
  unique (company_id, id),
  foreign key (company_id, document_id) references hr_documents(company_id, id),
  foreign key (company_id, employee_code) references hr_employees(company_id, employee_code),
  check (storage_path is null or (employee_code is not null and storage_path like company_id || '/' || employee_code || '/%')),
  check ((status = 'ACTIVE' and archived_at is null) or status = 'ARCHIVED')
);

create table if not exists hr_document_recipients (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  document_id uuid not null,
  version_id uuid not null,
  employee_code text not null,
  approval_level text not null default 'ACKNOWLEDGEMENT' check (approval_level in ('ACKNOWLEDGEMENT', 'ACCEPTANCE', 'OTP_CONFIRMATION', 'E_SIGNATURE_REQUIRED')),
  status text not null default 'SENT' check (status in ('SENT', 'READ', 'APPROVED', 'REJECTED', 'EXPIRED')),
  sent_at timestamptz not null default now(),
  read_at timestamptz,
  approved_at timestamptz,
  unique (document_id, version_id, employee_code),
  foreign key (company_id, document_id) references hr_documents(company_id, id),
  foreign key (company_id, version_id) references hr_document_versions(company_id, id),
  foreign key (company_id, employee_code) references hr_employees(company_id, employee_code)
);

create table if not exists hr_document_audit_events (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  document_id uuid not null,
  employee_code text,
  event_type text not null check (event_type in ('CREATED', 'VERSIONED', 'SENT', 'READ', 'VIEWED', 'DOWNLOADED', 'APPROVED', 'ARCHIVED')),
  metadata jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id),
  occurred_at timestamptz not null default now(),
  foreign key (company_id, document_id) references hr_documents(company_id, id)
);

create table if not exists hr_asset_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  employee_code text not null,
  source_module text not null,
  asset_reference text not null,
  assigned_at timestamptz not null default now(),
  returned_at timestamptz,
  assigned_by uuid references auth.users(id),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'RETURNED', 'ARCHIVED')),
  archived_at timestamptz,
  unique (company_id, source_module, asset_reference, returned_at),
  foreign key (company_id, employee_code) references hr_employees(company_id, employee_code)
);
create unique index if not exists hr_asset_active_assignment_idx
  on hr_asset_assignments(company_id, source_module, asset_reference) where status = 'ACTIVE';

create table if not exists hr_events (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  aggregate_type text not null,
  aggregate_id text not null,
  event_type hr_event_type not null,
  payload jsonb not null default '{}'::jsonb,
  actor_user_id uuid not null references auth.users(id),
  deduplication_key text not null,
  occurred_at timestamptz not null default now(),
  sequence bigint generated always as identity,
  unique (company_id, deduplication_key),
  unique (company_id, sequence)
);

create table if not exists hr_security_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  action text not null,
  resource_type text not null,
  resource_id text,
  result text not null check (result in ('ALLOWED', 'DENIED', 'ERROR')),
  request_metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists hr_read_models (
  company_id text primary key references companies(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  event_sequence bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists hr_leave_requests (
  id uuid primary key default gen_random_uuid(), company_id text not null references companies(id) on delete cascade,
  employee_code text not null, leave_type text not null, starts_on date not null, ends_on date not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  created_at timestamptz not null default now(), foreign key (company_id, employee_code) references hr_employees(company_id, employee_code)
);

create table if not exists hr_payroll_records (
  id uuid primary key default gen_random_uuid(), company_id text not null references companies(id) on delete cascade,
  employee_code text not null, period text not null, status text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  sensitivity text not null default 'RESTRICTED' check (sensitivity = 'RESTRICTED'),
  storage_path text, archived_at timestamptz, archived_by uuid references auth.users(id),
  created_at timestamptz not null default now(), unique (company_id, employee_code, period),
  foreign key (company_id, employee_code) references hr_employees(company_id, employee_code),
  check (storage_path is null or storage_path like company_id || '/' || employee_code || '/PAYROLL/%'),
  check ((status <> 'ARCHIVED' and archived_at is null) or status = 'ARCHIVED')
);

create table if not exists hr_notifications (
  id uuid primary key default gen_random_uuid(), company_id text not null references companies(id) on delete cascade,
  employee_code text, title text not null, body text not null, is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists hr_employees_org_idx on hr_employees(company_id, organization_id, status);
create index if not exists hr_employees_manager_idx on hr_employees(company_id, manager_employee_code, status);
create index if not exists hr_document_recipients_employee_idx on hr_document_recipients(company_id, employee_code, status);
create index if not exists hr_audit_document_idx on hr_document_audit_events(company_id, document_id, occurred_at desc);

create or replace function next_workforce_personnel_code() returns text language sql security definer set search_path = public as $$
  select 'PMTHR' || lpad(nextval('operation_personnel_code_seq')::text, 6, '0');
$$;
revoke all on function next_workforce_personnel_code() from public, anon, authenticated;
grant execute on function next_workforce_personnel_code() to service_role;

create or replace function reject_hr_audit_mutation() returns trigger language plpgsql as $$
begin raise exception 'hr_document_audit_events is append-only'; end; $$;
drop trigger if exists hr_document_audit_no_update on hr_document_audit_events;
create trigger hr_document_audit_no_update before update on hr_document_audit_events for each row execute function reject_hr_audit_mutation();
drop trigger if exists hr_document_audit_no_delete on hr_document_audit_events;
create trigger hr_document_audit_no_delete before delete on hr_document_audit_events for each row execute function reject_hr_audit_mutation();

create or replace function reject_hr_file_delete() returns trigger language plpgsql as $$
begin raise exception 'HR files are archived, never physically deleted'; end; $$;
drop trigger if exists hr_employee_files_no_delete on hr_employee_files;
create trigger hr_employee_files_no_delete before delete on hr_employee_files for each row execute function reject_hr_file_delete();
drop trigger if exists hr_document_versions_no_delete on hr_document_versions;
create trigger hr_document_versions_no_delete before delete on hr_document_versions for each row execute function reject_hr_file_delete();
drop trigger if exists hr_payroll_records_no_delete on hr_payroll_records;
create trigger hr_payroll_records_no_delete before delete on hr_payroll_records for each row execute function reject_hr_file_delete();

create or replace function reject_hr_event_mutation() returns trigger language plpgsql as $$
begin raise exception 'hr_events is append-only'; end; $$;
drop trigger if exists hr_events_no_update on hr_events;
create trigger hr_events_no_update before update on hr_events for each row execute function reject_hr_event_mutation();
drop trigger if exists hr_events_no_delete on hr_events;
create trigger hr_events_no_delete before delete on hr_events for each row execute function reject_hr_event_mutation();
drop trigger if exists hr_security_audit_no_update on hr_security_audit_logs;
create trigger hr_security_audit_no_update before update on hr_security_audit_logs for each row execute function reject_hr_audit_mutation();
drop trigger if exists hr_security_audit_no_delete on hr_security_audit_logs;
create trigger hr_security_audit_no_delete before delete on hr_security_audit_logs for each row execute function reject_hr_audit_mutation();

create or replace function can_manage_hr() returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from hr_access_grants grant_record
    where grant_record.company_id = current_company_id() and grant_record.profile_id = auth.uid()
      and grant_record.access_role = 'HR_ADMIN' and grant_record.scope_type = 'COMPANY' and grant_record.status = 'ACTIVE'
  );
$$;
create or replace function can_view_hr_employee(target_employee_code text, target_organization_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select current_company_id() is not null and exists (
    select 1 from hr_access_grants grant_record
    where grant_record.company_id = current_company_id() and grant_record.profile_id = auth.uid() and grant_record.status = 'ACTIVE'
      and (
        (grant_record.access_role = 'HR_ADMIN' and grant_record.scope_type = 'COMPANY')
        or (grant_record.access_role = 'EMPLOYEE' and grant_record.scope_type = 'SELF' and grant_record.employee_code = target_employee_code)
        or (grant_record.access_role = 'ORGANIZATION_MANAGER' and grant_record.scope_type = 'ORGANIZATION' and grant_record.organization_id = target_organization_id)
        or (grant_record.access_role = 'DEPARTMENT_MANAGER' and grant_record.scope_type = 'DEPARTMENT' and exists (
          select 1 from hr_employee_placements placement where placement.company_id = grant_record.company_id
            and placement.employee_code = target_employee_code and placement.department_id = grant_record.department_id and placement.status = 'ACTIVE'
        ))
      )
  );
$$;
create or replace function can_view_hr_employee_file(target_employee_code text, target_organization_id uuid, target_category text) returns boolean language sql stable security definer set search_path = public as $$
  select case
    when target_category in ('PAYROLL', 'HEALTH_REPORT', 'MEDICAL', 'CRITICAL')
      then can_manage_hr() or target_employee_code = current_employee_code()
    else can_view_hr_employee(target_employee_code, target_organization_id)
  end;
$$;
create or replace function can_view_hr_document(target_document_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select can_manage_hr() or exists (
    select 1 from hr_document_recipients recipient
    where recipient.company_id = current_company_id() and recipient.document_id = target_document_id
      and recipient.employee_code = current_employee_code()
  );
$$;
create or replace function can_view_hr_organization(target_organization_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select can_manage_hr() or exists (
    select 1 from hr_access_grants grant_record
    where grant_record.company_id = current_company_id() and grant_record.profile_id = auth.uid() and grant_record.status = 'ACTIVE'
      and (
        (grant_record.scope_type = 'ORGANIZATION' and grant_record.organization_id = target_organization_id)
        or (grant_record.scope_type = 'DEPARTMENT' and exists (select 1 from hr_departments department where department.id = grant_record.department_id and department.organization_id = target_organization_id))
        or (grant_record.scope_type = 'SELF' and exists (select 1 from hr_employee_placements placement where placement.employee_code = grant_record.employee_code and placement.organization_id = target_organization_id and placement.status = 'ACTIVE'))
      )
  );
$$;
create or replace function can_view_hr_department(target_department_id uuid, target_organization_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select can_manage_hr() or can_view_hr_organization(target_organization_id) or exists (
    select 1 from hr_access_grants grant_record
    where grant_record.company_id = current_company_id() and grant_record.profile_id = auth.uid() and grant_record.status = 'ACTIVE'
      and ((grant_record.scope_type = 'DEPARTMENT' and grant_record.department_id = target_department_id)
        or (grant_record.scope_type = 'SELF' and exists (select 1 from hr_employee_placements placement where placement.employee_code = grant_record.employee_code and placement.department_id = target_department_id and placement.status = 'ACTIVE')))
  );
$$;
create or replace function can_view_hr_team(target_team_id uuid, target_department_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select can_manage_hr() or exists (
    select 1 from hr_departments department where department.id = target_department_id and can_view_hr_department(department.id, department.organization_id)
  ) or exists (
    select 1 from hr_access_grants grant_record join hr_employee_placements placement on placement.company_id = grant_record.company_id and placement.employee_code = grant_record.employee_code and placement.status = 'ACTIVE'
    where grant_record.profile_id = auth.uid() and grant_record.status = 'ACTIVE' and grant_record.scope_type = 'SELF' and placement.team_id = target_team_id
  );
$$;
revoke all on function can_manage_hr(), can_view_hr_employee(text,uuid), can_view_hr_employee_file(text,uuid,text), can_view_hr_document(uuid), can_view_hr_organization(uuid), can_view_hr_department(uuid,uuid), can_view_hr_team(uuid,uuid) from public;
grant execute on function can_manage_hr(), can_view_hr_employee(text,uuid), can_view_hr_employee_file(text,uuid,text), can_view_hr_document(uuid), can_view_hr_organization(uuid), can_view_hr_department(uuid,uuid), can_view_hr_team(uuid,uuid) to authenticated;

do $$ declare table_name text; begin
  foreach table_name in array array['hr_organizations','hr_departments','hr_teams','hr_employees','hr_employee_placements','hr_company_licenses','hr_role_permissions','hr_access_grants','hr_employee_files','hr_documents','hr_document_versions','hr_document_recipients','hr_document_audit_events','hr_security_audit_logs','hr_asset_assignments','hr_leave_requests','hr_payroll_records','hr_notifications','hr_events','hr_read_models'] loop
    execute format('alter table %I enable row level security', table_name);
  end loop;
end $$;

drop policy if exists "hr company organizations" on hr_organizations;
drop policy if exists "hr scoped organizations" on hr_organizations;
create policy "hr scoped organizations" on hr_organizations for select to authenticated using (company_id = current_company_id() and can_view_hr_organization(id));
drop policy if exists "hr manage organizations" on hr_organizations;
drop policy if exists "hr insert organizations" on hr_organizations;
create policy "hr insert organizations" on hr_organizations for insert to authenticated with check (company_id = current_company_id() and can_manage_hr());
drop policy if exists "hr update organizations" on hr_organizations;
create policy "hr update organizations" on hr_organizations for update to authenticated using (company_id = current_company_id() and can_manage_hr()) with check (company_id = current_company_id() and can_manage_hr());

drop policy if exists "hr company departments" on hr_departments;
create policy "hr company departments" on hr_departments for select to authenticated using (company_id = current_company_id() and can_view_hr_department(id, organization_id));
drop policy if exists "hr manage departments" on hr_departments;
drop policy if exists "hr insert departments" on hr_departments;
create policy "hr insert departments" on hr_departments for insert to authenticated with check (company_id = current_company_id() and can_manage_hr());
drop policy if exists "hr update departments" on hr_departments;
create policy "hr update departments" on hr_departments for update to authenticated using (company_id = current_company_id() and can_manage_hr()) with check (company_id = current_company_id() and can_manage_hr());

drop policy if exists "hr company teams" on hr_teams;
create policy "hr company teams" on hr_teams for select to authenticated using (company_id = current_company_id() and can_view_hr_team(hr_teams.id, hr_teams.department_id));
drop policy if exists "hr manage teams" on hr_teams;
drop policy if exists "hr insert teams" on hr_teams;
create policy "hr insert teams" on hr_teams for insert to authenticated with check (company_id = current_company_id() and can_manage_hr());
drop policy if exists "hr update teams" on hr_teams;
create policy "hr update teams" on hr_teams for update to authenticated using (company_id = current_company_id() and can_manage_hr()) with check (company_id = current_company_id() and can_manage_hr());

drop policy if exists "hr scoped employees" on hr_employees;
create policy "hr scoped employees" on hr_employees for select to authenticated using (company_id = current_company_id() and can_view_hr_employee(employee_code, organization_id));
drop policy if exists "hr manage employees" on hr_employees;
drop policy if exists "hr insert employees" on hr_employees;
create policy "hr insert employees" on hr_employees for insert to authenticated with check (company_id = current_company_id() and can_manage_hr());
drop policy if exists "hr update employees" on hr_employees;
create policy "hr update employees" on hr_employees for update to authenticated using (company_id = current_company_id() and can_manage_hr()) with check (company_id = current_company_id() and can_manage_hr());

drop policy if exists "hr scoped placements" on hr_employee_placements;
create policy "hr scoped placements" on hr_employee_placements for select to authenticated using (
  company_id = current_company_id() and can_view_hr_employee(employee_code, organization_id)
);
drop policy if exists "hr insert placements" on hr_employee_placements;
create policy "hr insert placements" on hr_employee_placements for insert to authenticated with check (company_id = current_company_id() and can_manage_hr());
drop policy if exists "hr update placements" on hr_employee_placements;
create policy "hr update placements" on hr_employee_placements for update to authenticated using (company_id = current_company_id() and can_manage_hr()) with check (company_id = current_company_id() and can_manage_hr());

-- Company/role/permission metadata is readable only inside the tenant; only HR leadership mutates it.
drop policy if exists "hr company licenses" on hr_company_licenses;
create policy "hr company licenses" on hr_company_licenses for select to authenticated using (company_id = current_company_id());
drop policy if exists "hr manage licenses" on hr_company_licenses;
drop policy if exists "hr insert licenses" on hr_company_licenses;
create policy "hr insert licenses" on hr_company_licenses for insert to authenticated with check (company_id = current_company_id() and can_manage_hr());
drop policy if exists "hr update licenses" on hr_company_licenses;
create policy "hr update licenses" on hr_company_licenses for update to authenticated using (company_id = current_company_id() and can_manage_hr()) with check (company_id = current_company_id() and can_manage_hr());
drop policy if exists "hr company permissions" on hr_role_permissions;
create policy "hr company permissions" on hr_role_permissions for select to authenticated using (company_id = current_company_id());
drop policy if exists "hr manage permissions" on hr_role_permissions;
drop policy if exists "hr insert permissions" on hr_role_permissions;
create policy "hr insert permissions" on hr_role_permissions for insert to authenticated with check (company_id = current_company_id() and can_manage_hr());
drop policy if exists "hr update permissions" on hr_role_permissions;
create policy "hr update permissions" on hr_role_permissions for update to authenticated using (company_id = current_company_id() and can_manage_hr()) with check (company_id = current_company_id() and can_manage_hr());

drop policy if exists "hr scoped access grants" on hr_access_grants;
create policy "hr scoped access grants" on hr_access_grants for select to authenticated using (company_id = current_company_id() and (profile_id = auth.uid() or can_manage_hr()));
drop policy if exists "hr insert access grants" on hr_access_grants;
create policy "hr insert access grants" on hr_access_grants for insert to authenticated with check (company_id = current_company_id() and can_manage_hr());
drop policy if exists "hr update access grants" on hr_access_grants;
create policy "hr update access grants" on hr_access_grants for update to authenticated using (company_id = current_company_id() and can_manage_hr()) with check (company_id = current_company_id() and can_manage_hr());

-- Employee-owned records follow the same scoped employee rule.
do $$ declare table_name text; begin
  foreach table_name in array array['hr_asset_assignments','hr_leave_requests','hr_payroll_records'] loop
    execute format('drop policy if exists "hr scoped records" on %I', table_name);
    execute format('create policy "hr scoped records" on %I for select to authenticated using (company_id = current_company_id() and exists (select 1 from hr_employees employee where employee.company_id = %I.company_id and employee.employee_code = %I.employee_code and can_view_hr_employee(employee.employee_code, employee.organization_id)))', table_name, table_name, table_name);
    execute format('drop policy if exists "hr manage records" on %I', table_name);
    execute format('drop policy if exists "hr insert records" on %I', table_name);
    execute format('create policy "hr insert records" on %I for insert to authenticated with check (company_id = current_company_id() and can_manage_hr())', table_name);
    execute format('drop policy if exists "hr update records" on %I', table_name);
    execute format('create policy "hr update records" on %I for update to authenticated using (company_id = current_company_id() and can_manage_hr()) with check (company_id = current_company_id() and can_manage_hr())', table_name);
  end loop;
end $$;

drop policy if exists "hr scoped records" on hr_employee_files;
drop policy if exists "hr scoped employee files" on hr_employee_files;
create policy "hr scoped employee files" on hr_employee_files for select to authenticated using (
  company_id = current_company_id()
  and exists (
    select 1 from hr_employees employee
    where employee.company_id = hr_employee_files.company_id
      and employee.employee_code = hr_employee_files.employee_code
      and can_view_hr_employee_file(employee.employee_code, employee.organization_id, hr_employee_files.category)
  )
);
drop policy if exists "hr manage records" on hr_employee_files;
drop policy if exists "hr insert records" on hr_employee_files;
create policy "hr insert records" on hr_employee_files for insert to authenticated
  with check (company_id = current_company_id() and can_manage_hr());
drop policy if exists "hr update records" on hr_employee_files;
create policy "hr update records" on hr_employee_files for update to authenticated
  using (company_id = current_company_id() and can_manage_hr())
  with check (company_id = current_company_id() and can_manage_hr());

-- Document visibility is company-scoped for HR and recipient-scoped for employees.
drop policy if exists "hr scoped documents" on hr_documents;
create policy "hr scoped documents" on hr_documents for select to authenticated using (company_id = current_company_id() and can_view_hr_document(id));
drop policy if exists "hr manage documents" on hr_documents;
drop policy if exists "hr insert documents" on hr_documents;
create policy "hr insert documents" on hr_documents for insert to authenticated with check (company_id = current_company_id() and can_manage_hr());
drop policy if exists "hr update documents" on hr_documents;
create policy "hr update documents" on hr_documents for update to authenticated using (company_id = current_company_id() and can_manage_hr()) with check (company_id = current_company_id() and can_manage_hr());

do $$ declare table_name text; begin
  foreach table_name in array array['hr_document_versions','hr_document_recipients','hr_document_audit_events'] loop
    execute format('drop policy if exists "hr scoped document records" on %I', table_name);
    execute format('create policy "hr scoped document records" on %I for select to authenticated using (company_id = current_company_id() and can_view_hr_document(%I.document_id))', table_name, table_name);
    execute format('drop policy if exists "hr manage document records" on %I', table_name);
    execute format('create policy "hr manage document records" on %I for insert to authenticated with check (company_id = current_company_id() and can_manage_hr())', table_name);
  end loop;
end $$;
drop policy if exists "hr archive document versions" on hr_document_versions;
create policy "hr archive document versions" on hr_document_versions for update to authenticated
  using (company_id = current_company_id() and can_manage_hr())
  with check (company_id = current_company_id() and can_manage_hr());

drop policy if exists "hr scoped notifications" on hr_notifications;
create policy "hr scoped notifications" on hr_notifications for select to authenticated using (company_id = current_company_id() and (can_manage_hr() or employee_code = current_employee_code()));
drop policy if exists "hr manage notifications" on hr_notifications;
create policy "hr manage notifications" on hr_notifications for insert to authenticated with check (company_id = current_company_id() and can_manage_hr());

drop policy if exists "hr event stream" on hr_events;
create policy "hr event stream" on hr_events for select to authenticated using (company_id = current_company_id() and (can_manage_hr() or actor_user_id = auth.uid()));
drop policy if exists "hr append events" on hr_events;
create policy "hr append events" on hr_events for insert to authenticated with check (company_id = current_company_id() and actor_user_id = auth.uid() and can_manage_hr());
revoke update, delete on hr_events from anon, authenticated;

drop policy if exists "hr security audit read" on hr_security_audit_logs;
create policy "hr security audit read" on hr_security_audit_logs for select to authenticated using (company_id = current_company_id() and can_manage_hr());
drop policy if exists "hr security audit append" on hr_security_audit_logs;
create policy "hr security audit append" on hr_security_audit_logs for insert to authenticated with check (company_id = current_company_id() and actor_user_id = auth.uid());
revoke update, delete on hr_security_audit_logs from anon, authenticated;

drop policy if exists "hr read model" on hr_read_models;
create policy "hr read model" on hr_read_models for select to authenticated using (company_id = current_company_id() and can_manage_hr());
drop policy if exists "hr insert read model" on hr_read_models;
create policy "hr insert read model" on hr_read_models for insert to authenticated with check (company_id = current_company_id() and can_manage_hr());
drop policy if exists "hr update read model" on hr_read_models;
create policy "hr update read model" on hr_read_models for update to authenticated using (company_id = current_company_id() and can_manage_hr()) with check (company_id = current_company_id() and can_manage_hr());

drop policy if exists "hr private document read" on storage.objects;
create policy "hr private document read" on storage.objects for select to authenticated using (
  bucket_id = 'hr-private' and (storage.foldername(name))[1] = current_company_id()
  and (
    can_manage_hr()
    or can_view_hr_employee_file((storage.foldername(name))[2], (
      select employee.organization_id from hr_employees employee
      where employee.company_id = current_company_id() and employee.employee_code = (storage.foldername(name))[2]
    ), (storage.foldername(name))[3])
  )
);
drop policy if exists "hr private document upload" on storage.objects;
create policy "hr private document upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'hr-private'
  and (storage.foldername(name))[1] = current_company_id()
  and (storage.foldername(name))[3] in ('IDENTITY', 'DOCUMENT', 'PAYROLL', 'CONTRACT', 'CERTIFICATE', 'LEAVE', 'ASSET', 'HEALTH_REPORT', 'MEDICAL', 'CRITICAL')
  and can_manage_hr()
  and exists (
    select 1 from hr_employees employee
    where employee.company_id = current_company_id()
      and employee.employee_code = (storage.foldername(name))[2]
      and employee.status <> 'ARCHIVED'
  )
);

-- Seed the private bucket only after all Storage policy DDL is complete.
insert into storage.buckets (id, name, public) values ('hr-private', 'hr-private', false)
on conflict (id) do update set public = false;

-- Existing workforce identities become HR employee records without changing their source tables.
insert into hr_employees (company_id, employee_code, profile_id, display_name, job_title, hr_role, activation_status, status)
select company_id, employee_code, id, display_name, 'Saha Şefi', 'CHIEF', 'ACTIVE', status
from profiles where role = 'CHIEF' and employee_code is not null
on conflict (company_id, employee_code) do update set profile_id = excluded.profile_id, display_name = excluded.display_name, status = excluded.status;

insert into hr_employees (company_id, employee_code, operation_personnel_id, display_name, job_title, hr_role, manager_employee_code, activation_status, status)
select personnel.company_id, personnel.personnel_code, personnel.id, personnel.display_name, personnel.title, 'EMPLOYEE',
  case when chief.employee_code is not null then personnel.assigned_chief_code else null end,
  'PENDING_PHONE', personnel.status
from operation_personnel personnel
left join profiles chief
  on chief.company_id = personnel.company_id
  and chief.employee_code = personnel.assigned_chief_code
  and chief.role = 'CHIEF'
  and chief.is_active
  and chief.status = 'ACTIVE'
on conflict (company_id, employee_code) do update set operation_personnel_id = excluded.operation_personnel_id, display_name = excluded.display_name, job_title = excluded.job_title, manager_employee_code = excluded.manager_employee_code, status = excluded.status;

insert into hr_employee_placements (company_id, employee_code, organization_id, department_id, team_id, manager_employee_code)
select company_id, employee_code, organization_id, department_id, team_id, manager_employee_code
from hr_employees where status = 'ACTIVE'
on conflict (company_id, employee_code) where status = 'ACTIVE' do nothing;

insert into hr_company_licenses (company_id, module_code)
select id, module_code
from companies
cross join (values ('dashboard'),('hr'),('documents'),('operations'),('fleet'),('inventory'),('reports'),('settings'),('finance')) modules(module_code)
on conflict do nothing;

insert into hr_role_permissions (company_id, role, permission_code)
select id, role_code, permission_code from companies cross join (values
  ('PLATFORM_ADMIN','*'), ('CEO','*'), ('PARTNER','*'),
  ('HR','hr.view'), ('HR','hr.manage'), ('HR','documents.view'),
  ('MANAGER','hr.view_scoped'), ('MANAGER','documents.view'),
  ('EMPLOYEE','employee.self'), ('EMPLOYEE','documents.self'),
  ('CHIEF','operations.assigned')
) permissions(role_code, permission_code) on conflict do nothing;

insert into hr_access_grants (company_id, profile_id, access_role, scope_type)
select company_id, id, 'HR_ADMIN', 'COMPANY' from profiles
where role in ('CEO', 'PARTNER', 'HR', 'PLATFORM_ADMIN') and is_active
on conflict do nothing;

insert into hr_access_grants (company_id, profile_id, access_role, scope_type, employee_code)
select company_id, profile_id, 'EMPLOYEE', 'SELF', employee_code from hr_employees
where profile_id is not null
on conflict do nothing;

-- Fail before COMMIT if any deferred manager relation or placement is inconsistent.
do $$
begin
  if exists (
    select 1
    from hr_employees employee
    left join hr_employees manager
      on manager.company_id = employee.company_id
      and manager.employee_code = employee.manager_employee_code
    where employee.manager_employee_code is not null
      and manager.id is null
  ) then
    raise exception 'HR migration integrity check failed: orphan employee manager reference';
  end if;

  if exists (
    select 1
    from hr_employee_placements placement
    left join hr_employees employee
      on employee.company_id = placement.company_id
      and employee.employee_code = placement.employee_code
    where employee.id is null
  ) then
    raise exception 'HR migration integrity check failed: orphan employee placement';
  end if;
end $$;

set constraints all immediate;

commit;
