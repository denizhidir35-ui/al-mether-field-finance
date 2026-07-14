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
  check (role in ('CEO', 'PARTNER', 'ASSISTANT', 'MANAGER', 'CHIEF', 'PERSONNEL'));

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
