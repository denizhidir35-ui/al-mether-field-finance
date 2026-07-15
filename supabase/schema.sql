-- AL METHER tenant foundation and provider-independent internal mail MVP.
-- Run in the Supabase SQL editor. No service-role key is used by the browser.

create extension if not exists pgcrypto;

create table if not exists companies (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists company_memberships (
  company_id text not null references companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null default 'member',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id),
  unique (company_id, email)
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id text not null references companies(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role text not null default 'ASSISTANT' check (role in ('CEO', 'PARTNER', 'ASSISTANT', 'MANAGER', 'CHIEF', 'PERSONNEL')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep the migration usable when a minimal profiles table already exists.
alter table profiles add column if not exists company_id text references companies(id) on delete cascade;
alter table profiles add column if not exists email text;
alter table profiles add column if not exists display_name text;
alter table profiles add column if not exists role text default 'ASSISTANT';
alter table profiles add column if not exists is_active boolean default true;
alter table profiles add column if not exists created_at timestamptz default now();
alter table profiles add column if not exists updated_at timestamptz default now();

-- Keep role authorization aligned with the application role model.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('CEO', 'PARTNER', 'ASSISTANT', 'MANAGER', 'CHIEF', 'PERSONNEL', 'HR', 'OFFICE'));

create or replace function is_company_member(target_company_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from company_memberships membership
    where membership.company_id = target_company_id
      and membership.user_id = auth.uid()
      and membership.is_active
  );
$$;

revoke all on function is_company_member(text) from public;
grant execute on function is_company_member(text) to authenticated;

alter table companies enable row level security;
alter table company_memberships enable row level security;
alter table profiles enable row level security;

drop policy if exists "members read own companies" on companies;
create policy "members read own companies" on companies for select to authenticated
using (is_company_member(id));

drop policy if exists "members read own memberships" on company_memberships;
create policy "members read own memberships" on company_memberships for select to authenticated
using (is_company_member(company_id));

drop policy if exists "users read own profile" on profiles;
create policy "users read own profile" on profiles for select to authenticated
using (id = auth.uid() and is_active);

revoke insert, update, delete on profiles from anon, authenticated;
grant select on profiles to authenticated;

-- Bootstrap the existing manually-created Supabase Auth user. This does not create auth users.
insert into companies (id, name)
values ('al_mether', 'AL METHER')
on conflict (id) do update set name = excluded.name;

insert into profiles (id, company_id, email, display_name, role, is_active, updated_at)
values (
  '9294fb0c-0cab-4d59-81c5-6867718112d6',
  'al_mether',
  'denizhidir@almether.com',
  U&'Deniz H\0131d\0131r',
  'CEO',
  true,
  now()
)
on conflict (id) do update set
  company_id = excluded.company_id,
  email = excluded.email,
  display_name = excluded.display_name,
  role = excluded.role,
  is_active = excluded.is_active,
  updated_at = now();

insert into company_memberships (company_id, user_id, email, display_name, role, is_active)
values (
  'al_mether',
  '9294fb0c-0cab-4d59-81c5-6867718112d6',
  'denizhidir@almether.com',
  U&'Deniz H\0131d\0131r',
  'CEO',
  true
)
on conflict (company_id, user_id) do update set
  email = excluded.email,
  display_name = excluded.display_name,
  role = excluded.role,
  is_active = excluded.is_active;

insert into profiles (id, company_id, email, display_name, role, is_active, updated_at)
values (
  '06869149-45a7-4229-b11b-daa23ca34418',
  'al_mether',
  'aytacturkbay@almether.com',
  U&'Ayta\00E7 T\00FCrkbay',
  'PARTNER',
  true,
  now()
)
on conflict (id) do update set
  company_id = excluded.company_id,
  email = excluded.email,
  display_name = excluded.display_name,
  role = excluded.role,
  is_active = excluded.is_active,
  updated_at = now();

insert into company_memberships (company_id, user_id, email, display_name, role, is_active)
values (
  'al_mether',
  '06869149-45a7-4229-b11b-daa23ca34418',
  'aytacturkbay@almether.com',
  U&'Ayta\00E7 T\00FCrkbay',
  'PARTNER',
  true
)
on conflict (company_id, user_id) do update set
  email = excluded.email,
  display_name = excluded.display_name,
  role = excluded.role,
  is_active = excluded.is_active;

create table if not exists mether_mail_messages (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id),
  sender_name text not null,
  sender_email text not null,
  recipient_user_id uuid not null references auth.users(id),
  recipient_name text not null,
  recipient_email text not null,
  subject text not null check (char_length(subject) between 1 and 200),
  body text not null check (char_length(body) between 1 and 20000),
  has_attachment boolean not null default false,
  is_read boolean not null default false,
  is_starred boolean not null default false,
  created_at timestamptz not null default now()
);

-- External IMAP/SMTP messages do not always map both sides to an Auth user.
alter table mether_mail_messages alter column sender_user_id drop not null;
alter table mether_mail_messages alter column recipient_user_id drop not null;
alter table mether_mail_messages add column if not exists provider_message_id text;
alter table mether_mail_messages add column if not exists mailbox_email text;
alter table mether_mail_messages add column if not exists direction text not null default 'internal';
alter table mether_mail_messages add column if not exists html_body text;
alter table mether_mail_messages add column if not exists is_archived boolean not null default false;
alter table mether_mail_messages add column if not exists deleted_at timestamptz;

drop index if exists mether_mail_provider_message_idx;
create unique index mether_mail_provider_message_idx
  on mether_mail_messages(company_id, mailbox_email, provider_message_id);

create table if not exists mether_mail_attachments (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  message_id uuid not null references mether_mail_messages(id) on delete cascade,
  filename text not null,
  content_type text not null default 'application/octet-stream',
  byte_size bigint not null default 0,
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  unique (message_id, filename, byte_size)
);

alter table mether_mail_attachments enable row level security;
drop policy if exists "participants read mail attachments" on mether_mail_attachments;
create policy "participants read mail attachments" on mether_mail_attachments for select to authenticated
using (
  exists (
    select 1 from mether_mail_messages message
    where message.id = message_id
      and message.company_id = company_id
      and is_company_member(message.company_id)
      and (auth.uid() = message.sender_user_id or auth.uid() = message.recipient_user_id)
  )
);
grant select on mether_mail_attachments to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('mail-attachments', 'mail-attachments', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

create index if not exists mether_mail_recipient_idx
  on mether_mail_messages(company_id, recipient_user_id, created_at desc);
create index if not exists mether_mail_sender_idx
  on mether_mail_messages(company_id, sender_user_id, created_at desc);

alter table mether_mail_messages enable row level security;

drop policy if exists "participants read tenant mail" on mether_mail_messages;
create policy "participants read tenant mail" on mether_mail_messages for select to authenticated
using (
  is_company_member(company_id)
  and (auth.uid() = sender_user_id or auth.uid() = recipient_user_id)
);

drop policy if exists "recipients update mailbox state" on mether_mail_messages;
create policy "recipients update mailbox state" on mether_mail_messages for update to authenticated
using (is_company_member(company_id) and recipient_user_id = auth.uid())
with check (is_company_member(company_id) and recipient_user_id = auth.uid());

revoke insert, delete, update on mether_mail_messages from anon, authenticated;
grant select on mether_mail_messages to authenticated;
grant update (is_read, is_starred) on mether_mail_messages to authenticated;

create or replace function send_mether_mail(
  p_company_id text,
  p_recipient_email text,
  p_subject text,
  p_body text
)
returns mether_mail_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  sender company_memberships;
  recipient company_memberships;
  created_message mether_mail_messages;
begin
  if auth.uid() is null or not is_company_member(p_company_id) then
    raise exception 'not authorized for company';
  end if;

  select * into sender from company_memberships
    where company_id = p_company_id and user_id = auth.uid() and is_active;
  select * into recipient from company_memberships
    where company_id = p_company_id and lower(email) = lower(trim(p_recipient_email)) and is_active;

  if recipient.user_id is null then
    raise exception 'recipient is not an active company member';
  end if;
  if char_length(trim(p_subject)) not between 1 and 200
    or char_length(trim(p_body)) not between 1 and 20000 then
    raise exception 'invalid message content';
  end if;

  insert into mether_mail_messages (
    company_id, sender_user_id, sender_name, sender_email,
    recipient_user_id, recipient_name, recipient_email, subject, body
  ) values (
    p_company_id, sender.user_id, sender.display_name, sender.email,
    recipient.user_id, recipient.display_name, recipient.email, trim(p_subject), trim(p_body)
  ) returning * into created_message;

  return created_message;
end;
$$;

revoke all on function send_mether_mail(text, text, text, text) from public, anon;
grant execute on function send_mether_mail(text, text, text, text) to authenticated;

-- Finance policies use the same tenant boundary. Existing public policies are removed.
create table if not exists finance_entries (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id),
  type text not null check (type in ('income','expense')),
  title text not null,
  category text not null,
  amount numeric not null default 0,
  status text not null default 'pending',
  created_by text not null,
  created_at timestamptz not null default now()
);

alter table finance_entries enable row level security;
drop policy if exists "public read finance" on finance_entries;
drop policy if exists "public insert finance" on finance_entries;
drop policy if exists "public update finance" on finance_entries;
drop policy if exists "public delete finance" on finance_entries;
drop policy if exists "tenant read finance" on finance_entries;
drop policy if exists "tenant insert finance" on finance_entries;
drop policy if exists "tenant update finance" on finance_entries;
drop policy if exists "tenant delete finance" on finance_entries;

create policy "tenant read finance" on finance_entries for select to authenticated using (is_company_member(company_id));
create policy "tenant insert finance" on finance_entries for insert to authenticated with check (is_company_member(company_id));
create policy "tenant update finance" on finance_entries for update to authenticated using (is_company_member(company_id)) with check (is_company_member(company_id));
create policy "tenant delete finance" on finance_entries for delete to authenticated using (is_company_member(company_id));

-- ============================================================================
-- Sprint 09: shared multi-device Operation Platform
-- Operation Engine, canonical events, reducer and read-model contracts remain
-- application-owned. PostgreSQL is the durable repository and event store.
-- ============================================================================

alter table profiles add column if not exists employee_code text;
alter table profiles add column if not exists status text not null default 'ACTIVE';
alter table profiles drop constraint if exists profiles_status_check;
alter table profiles add constraint profiles_status_check check (status in ('ACTIVE', 'PASSIVE'));
create unique index if not exists profiles_company_employee_code_idx
  on profiles(company_id, employee_code)
  where employee_code is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_company_employee_code_key'
      and conrelid = 'profiles'::regclass
  ) then
    alter table profiles
      add constraint profiles_company_employee_code_key unique (company_id, employee_code);
  end if;
end $$;

insert into profiles (
  id, company_id, email, display_name, role, is_active,
  employee_code, status, updated_at
)
select
  'e2df3414-0c17-4bdd-82c4-605b9b8b2cb1',
  'al_mether',
  'smthr000001@almether.com',
  U&'Ahmet Y\0131lmaz',
  'CHIEF',
  true,
  'SMTHR000001',
  'ACTIVE',
  now()
where exists (
  select 1 from auth.users
  where id = 'e2df3414-0c17-4bdd-82c4-605b9b8b2cb1'
)
on conflict (id) do update set
  company_id = excluded.company_id,
  email = excluded.email,
  display_name = excluded.display_name,
  role = excluded.role,
  is_active = excluded.is_active,
  employee_code = excluded.employee_code,
  status = excluded.status,
  updated_at = now();

insert into company_memberships (
  company_id, user_id, email, display_name, role, is_active
)
select
  'al_mether',
  'e2df3414-0c17-4bdd-82c4-605b9b8b2cb1',
  'smthr000001@almether.com',
  U&'Ahmet Y\0131lmaz',
  'CHIEF',
  true
where exists (
  select 1 from auth.users
  where id = 'e2df3414-0c17-4bdd-82c4-605b9b8b2cb1'
)
on conflict (company_id, user_id) do update set
  email = excluded.email,
  display_name = excluded.display_name,
  role = excluded.role,
  is_active = excluded.is_active;

create or replace function current_company_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select company_id from profiles
  where id = auth.uid() and is_active and status = 'ACTIVE';
$$;

create or replace function current_platform_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles
  where id = auth.uid() and is_active and status = 'ACTIVE';
$$;

create or replace function current_employee_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select employee_code from profiles
  where id = auth.uid() and is_active and status = 'ACTIVE';
$$;

revoke all on function current_company_id() from public;
revoke all on function current_platform_role() from public;
revoke all on function current_employee_code() from public;
grant execute on function current_company_id() to authenticated;
grant execute on function current_platform_role() to authenticated;
grant execute on function current_employee_code() to authenticated;

create sequence if not exists operation_work_order_code_seq start 1;
create sequence if not exists operation_personnel_code_seq start 1;

create table if not exists projects (
  id text primary key default ('project-' || gen_random_uuid()::text),
  company_id text not null references companies(id) on delete cascade,
  project_number text not null,
  customer text not null,
  title text not null,
  description text not null default '',
  address text not null default '',
  city text not null,
  district text not null,
  latitude double precision not null,
  longitude double precision not null,
  documents jsonb not null default '[]'::jsonb,
  status text not null default 'ACTIVE' check (status in ('PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, project_number)
);

create table if not exists operation_personnel (
  id text primary key default ('personnel-' || gen_random_uuid()::text),
  company_id text not null references companies(id) on delete cascade,
  personnel_code text not null default ('PMTHR' || lpad(nextval('operation_personnel_code_seq')::text, 6, '0')),
  display_name text not null,
  title text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PASSIVE', 'ARCHIVED')),
  qr_value text not null,
  qr_version integer not null default 1 check (qr_version > 0),
  documents jsonb not null default '[]'::jsonb,
  certificates jsonb not null default '[]'::jsonb,
  trainings jsonb not null default '[]'::jsonb,
  signatures jsonb not null default '[]'::jsonb,
  performance_records jsonb not null default '[]'::jsonb,
  authorizations jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, personnel_code)
);

create table if not exists work_orders (
  id text primary key default ('work-order-' || gen_random_uuid()::text),
  company_id text not null references companies(id) on delete cascade,
  code text not null default ('ALM-' || lpad(nextval('operation_work_order_code_seq')::text, 6, '0')),
  project_id text not null references projects(id),
  project_code text not null,
  project_number text not null,
  customer text not null,
  title text not null,
  description text not null default '',
  address text not null default '',
  city text not null,
  district text not null,
  latitude double precision not null,
  longitude double precision not null,
  assigned_chief_id text not null,
  assigned_personnel_ids text[] not null default '{}',
  operation_type text not null default 'fiber_field_operation',
  workflow_id text not null default 'chief-fiber-v1',
  workflow_step text not null default 'personnel',
  target_codes text[] not null default '{}',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'critical')),
  status text not null default 'assigned' check (status in ('assigned', 'active', 'completed', 'cancelled')),
  progress integer not null default 0 check (progress between 0 and 100),
  target_count integer not null default 0,
  completed_count integer not null default 0,
  attachment_ids text[] not null default '{}',
  planned_start_at timestamptz not null,
  estimated_end_at timestamptz not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  closed_at timestamptz,
  unique (company_id, code)
);

do $$
begin
  alter table work_orders drop constraint work_orders_company_id_project_id_status_key;
exception when undefined_object then null;
end $$;

create unique index if not exists work_orders_company_project_idx
  on work_orders(company_id, project_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'work_orders_company_chief_fkey'
      and conrelid = 'work_orders'::regclass
  ) then
    alter table work_orders
      add constraint work_orders_company_chief_fkey
      foreign key (company_id, assigned_chief_id)
      references profiles(company_id, employee_code);
  end if;
end $$;

create table if not exists operation_assignments (
  company_id text not null references companies(id) on delete cascade,
  work_order_id text not null references work_orders(id) on delete cascade,
  employee_code text not null,
  granted_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (work_order_id, employee_code),
  foreign key (company_id, employee_code)
    references profiles(company_id, employee_code)
);

create table if not exists operation_events (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  work_order_id text not null references work_orders(id) on delete cascade,
  project_code text not null,
  chief_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  context jsonb not null,
  target_code text,
  step_id text,
  deduplication_key text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  occurred_at timestamptz not null,
  sequence bigint generated always as identity,
  version integer not null default 1,
  unique (company_id, deduplication_key),
  unique (work_order_id, sequence)
);

create table if not exists operation_read_models (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  work_order_id text not null references work_orders(id) on delete cascade,
  snapshot jsonb not null,
  event_sequence bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique (company_id, work_order_id)
);

create table if not exists operation_chat (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  work_order_id text not null references work_orders(id) on delete cascade,
  event_id text not null references operation_events(id),
  sender_user_id uuid not null references auth.users(id),
  message text not null,
  created_at timestamptz not null default now(),
  unique (event_id)
);

create table if not exists operation_evidence (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  work_order_id text not null references work_orders(id) on delete cascade,
  event_id text not null references operation_events(id),
  evidence_type text not null,
  metadata jsonb not null,
  storage_path text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (event_id, id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  work_order_id text references work_orders(id) on delete cascade,
  event_id text references operation_events(id),
  recipient_role text not null,
  recipient_employee_code text,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists presence (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  employee_code text not null,
  work_order_id text references work_orders(id) on delete set null,
  status text not null default 'OFFLINE' check (status in ('ONLINE', 'FIELD', 'OFFLINE')),
  last_seen_at timestamptz not null default now(),
  unique (company_id, employee_code)
);

create or replace function can_access_work_order(target_work_order_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from work_orders work_order
    where work_order.id = target_work_order_id
      and work_order.company_id = current_company_id()
      and (
        current_platform_role() in ('CEO', 'PARTNER', 'MANAGER')
        or (current_platform_role() = 'CHIEF' and work_order.assigned_chief_id = current_employee_code())
        or exists (
          select 1 from operation_assignments assignment
          where assignment.work_order_id = work_order.id
            and assignment.company_id = work_order.company_id
            and assignment.employee_code = current_employee_code()
        )
      )
  );
$$;

revoke all on function can_access_work_order(text) from public;
grant execute on function can_access_work_order(text) to authenticated;

create or replace function reject_operation_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'operation_events is append-only';
end;
$$;

drop trigger if exists operation_events_no_update on operation_events;
create trigger operation_events_no_update before update on operation_events
for each row execute function reject_operation_event_mutation();
drop trigger if exists operation_events_no_delete on operation_events;
create trigger operation_events_no_delete before delete on operation_events
for each row execute function reject_operation_event_mutation();

alter table projects enable row level security;
alter table operation_personnel enable row level security;
alter table work_orders enable row level security;
alter table operation_assignments enable row level security;
alter table operation_events enable row level security;
alter table operation_read_models enable row level security;
alter table operation_chat enable row level security;
alter table operation_evidence enable row level security;
alter table notifications enable row level security;
alter table presence enable row level security;

drop policy if exists "operations read projects" on projects;
create policy "operations read projects" on projects for select to authenticated
using (company_id = current_company_id());
drop policy if exists "leadership manage projects" on projects;
create policy "leadership manage projects" on projects for all to authenticated
using (company_id = current_company_id() and current_platform_role() in ('CEO', 'PARTNER', 'MANAGER'))
with check (company_id = current_company_id() and current_platform_role() in ('CEO', 'PARTNER', 'MANAGER'));

drop policy if exists "operations read personnel" on operation_personnel;
create policy "operations read personnel" on operation_personnel for select to authenticated
using (
  company_id = current_company_id()
  and (
    current_platform_role() in ('CEO', 'PARTNER', 'MANAGER', 'HR')
    or (
      current_platform_role() = 'CHIEF'
      and exists (
        select 1 from work_orders work_order
        where work_order.company_id = operation_personnel.company_id
          and work_order.assigned_chief_id = current_employee_code()
          and operation_personnel.personnel_code = any(work_order.assigned_personnel_ids)
      )
    )
  )
);
drop policy if exists "hr leadership manage personnel" on operation_personnel;
create policy "hr leadership manage personnel" on operation_personnel for all to authenticated
using (company_id = current_company_id() and current_platform_role() in ('CEO', 'PARTNER', 'MANAGER', 'HR'))
with check (company_id = current_company_id() and current_platform_role() in ('CEO', 'PARTNER', 'MANAGER', 'HR'));

drop policy if exists "role scoped read work orders" on work_orders;
create policy "role scoped read work orders" on work_orders for select to authenticated
using (can_access_work_order(id));
drop policy if exists "leadership create work orders" on work_orders;
create policy "leadership create work orders" on work_orders for insert to authenticated
with check (company_id = current_company_id() and current_platform_role() in ('CEO', 'PARTNER', 'MANAGER'));

drop policy if exists "authorized users read operation assignments" on operation_assignments;
create policy "authorized users read operation assignments" on operation_assignments for select to authenticated
using (
  company_id = current_company_id()
  and (employee_code = current_employee_code() or current_platform_role() in ('CEO', 'PARTNER', 'MANAGER'))
);
drop policy if exists "leadership manage operation assignments" on operation_assignments;
create policy "leadership manage operation assignments" on operation_assignments for all to authenticated
using (company_id = current_company_id() and current_platform_role() in ('CEO', 'PARTNER', 'MANAGER'))
with check (company_id = current_company_id() and current_platform_role() in ('CEO', 'PARTNER', 'MANAGER'));

drop policy if exists "role scoped read operation events" on operation_events;
create policy "role scoped read operation events" on operation_events for select to authenticated
using (company_id = current_company_id() and can_access_work_order(work_order_id));
drop policy if exists "role scoped append operation events" on operation_events;
create policy "role scoped append operation events" on operation_events for insert to authenticated
with check (company_id = current_company_id() and can_access_work_order(work_order_id));

drop policy if exists "role scoped read operation projections" on operation_read_models;
create policy "role scoped read operation projections" on operation_read_models for select to authenticated
using (company_id = current_company_id() and can_access_work_order(work_order_id));
drop policy if exists "role scoped write operation projections" on operation_read_models;
create policy "role scoped write operation projections" on operation_read_models for insert to authenticated
with check (company_id = current_company_id() and can_access_work_order(work_order_id));
drop policy if exists "role scoped update operation projections" on operation_read_models;
create policy "role scoped update operation projections" on operation_read_models for update to authenticated
using (company_id = current_company_id() and can_access_work_order(work_order_id))
with check (company_id = current_company_id() and can_access_work_order(work_order_id));

drop policy if exists "role scoped operation chat" on operation_chat;
create policy "role scoped operation chat" on operation_chat for select to authenticated
using (company_id = current_company_id() and can_access_work_order(work_order_id));
drop policy if exists "role scoped operation evidence" on operation_evidence;
create policy "role scoped operation evidence" on operation_evidence for select to authenticated
using (company_id = current_company_id() and can_access_work_order(work_order_id));
drop policy if exists "role scoped notifications" on notifications;
create policy "role scoped notifications" on notifications for select to authenticated
using (
  company_id = current_company_id()
  and (recipient_role = current_platform_role() or recipient_employee_code = current_employee_code())
);
drop policy if exists "company presence" on presence;
create policy "company presence" on presence for select to authenticated
using (company_id = current_company_id());

revoke insert, update, delete on operation_events from anon;
revoke update, delete on operation_events from authenticated;
grant select, insert on operation_events to authenticated;
grant select, insert on work_orders to authenticated;
grant select, insert, delete on operation_assignments to authenticated;
grant select, insert, update on projects, operation_personnel, operation_read_models, presence to authenticated;
grant select on operation_chat, operation_evidence, notifications to authenticated;

insert into projects (
  id, company_id, project_number, customer, title, description, city, district,
  latitude, longitude, status, created_by
)
select
  'project-alm-0001', 'al_mether', 'ALM-0001', 'AL METHER Fiber',
  U&'Kar\015F\0131yaka Fiber D\00F6n\00FC\015F\00FCm', '', U&'\0130zmir', U&'Kar\015F\0131yaka',
  38.4554, 27.1197, 'ACTIVE', '9294fb0c-0cab-4d59-81c5-6867718112d6'
where exists (select 1 from auth.users where id = '9294fb0c-0cab-4d59-81c5-6867718112d6')
on conflict (company_id, project_number) do nothing;

insert into projects (
  id, company_id, project_number, customer, title, description, city, district,
  latitude, longitude, status, created_by
)
select
  'project-alm-0002', 'al_mether', 'ALM-0002', 'AL METHER Fiber',
  U&'Bornova Altyap\0131 Operasyonu', '', U&'\0130zmir', 'Bornova',
  38.4622, 27.2165, 'ACTIVE', '9294fb0c-0cab-4d59-81c5-6867718112d6'
where exists (select 1 from auth.users where id = '9294fb0c-0cab-4d59-81c5-6867718112d6')
on conflict (company_id, project_number) do nothing;

insert into projects (
  id, company_id, project_number, customer, title, description, city, district,
  latitude, longitude, status, created_by
)
select
  'project-alm-0003', 'al_mether', 'ALM-0003', 'AL METHER Fiber',
  'Gaziemir Saha Teslimi', '', U&'\0130zmir', 'Gaziemir',
  38.3213, 27.1297, 'COMPLETED', '9294fb0c-0cab-4d59-81c5-6867718112d6'
where exists (select 1 from auth.users where id = '9294fb0c-0cab-4d59-81c5-6867718112d6')
on conflict (company_id, project_number) do nothing;

do $$
begin
  alter publication supabase_realtime add table work_orders;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table operation_events;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table operation_personnel;
exception when duplicate_object then null;
end $$;
